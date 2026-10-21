'use strict';
const { createHmac, timingSafeEqual } = require('node:crypto');

function verifySignature(raw, header, appSecret) {
  if (!appSecret || typeof header !== 'string' || !header.startsWith('sha256=')) return false;
  const providedHex = header.slice('sha256='.length);
  if (!/^[0-9a-f]{64}$/i.test(providedHex)) return false;
  const expected = createHmac('sha256', appSecret).update(raw).digest();
  const provided = Buffer.from(providedHex, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

async function readBody(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const e = new Error('Webhook payload too large');
      e.status = 413;
      throw e;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function normalizeEvents(payload) {
  if (payload?.object !== 'page' || !Array.isArray(payload.entry)) return [];
  const out = [];
  for (const entry of payload.entry) {
    for (const item of entry.messaging || []) {
      const senderID = String(item.sender?.id || '');
      const recipientID = String(item.recipient?.id || '');
      const base = {
        senderID,
        threadID: senderID,
        recipientID,
        timestamp: item.timestamp || Date.now()
      };
      if (item.message) {
        out.push({
          ...base,
          type: 'message',
          body: item.message.text || '',
          messageID: item.message.mid || '',
          attachments: item.message.attachments || [],
          isEcho: !!item.message.is_echo,
          quickReply: item.message.quick_reply?.payload || null,
          raw: item
        });
      } else if (item.postback) {
        out.push({ ...base, type: 'postback', payload: item.postback.payload || '', raw: item });
      } else if (item.read) {
        out.push({ ...base, type: 'read', raw: item });
      } else if (item.delivery) {
        out.push({ ...base, type: 'delivery', raw: item });
      } else if (item.reaction) {
        out.push({ ...base, type: 'reaction', reaction: item.reaction, raw: item });
      }
    }
  }
  return out;
}

function buildWebhookHandler(client) {
  const webhookPath = client.webhookPath;
  return async function webhookHandler(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname !== webhookPath) {
      res.writeHead(404); res.end('Not Found'); return;
    }
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token === client.verifyToken && challenge !== null) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(challenge);
      } else {
        res.writeHead(403); res.end('Verification failed');
      }
      return;
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'GET, POST' }); res.end('Method Not Allowed'); return;
    }
    try {
      const raw = await readBody(req);
      if (!verifySignature(raw, req.headers['x-hub-signature-256'], client.appSecret)) {
        res.writeHead(401); res.end('Invalid signature'); return;
      }
      let payload;
      try { payload = JSON.parse(raw.toString('utf8')); }
      catch { res.writeHead(400); res.end('Malformed JSON'); return; }
      if (payload?.object !== 'page') { res.writeHead(400); res.end('Unexpected webhook object'); return; }
      const events = normalizeEvents(payload);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('EVENT_RECEIVED');
      // Dispatch after acknowledgement. Callback exceptions are forwarded to 'handlerError'.
      queueMicrotask(() => {
        for (const event of events) {
          const listeners = client.listeners(event.type);
          for (const handler of listeners) {
            try {
              Promise.resolve(handler(event)).catch(error => client._emitHandlerError(error));
            } catch (error) { client._emitHandlerError(error); }
          }
        }
      });
    } catch (error) {
      const status = error.status === 413 ? 413 : 500;
      res.writeHead(status); res.end(status === 413 ? 'Payload too large' : 'Internal Error');
      client._emitHandlerError(error);
    }
  };
}

module.exports = { buildWebhookHandler, verifySignature, normalizeEvents };
