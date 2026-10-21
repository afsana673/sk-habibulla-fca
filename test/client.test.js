'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { once } = require('node:events');
const { createClient } = require('..');
const { verifySignature, normalizeEvents } = require('../src/webhook');

const defaults = {
  pageId: '456', pageAccessToken: 'top-secret-test-token', verifyToken: 'test-verify', appSecret: 'test-app-secret'
};

function fakeClient(extra = {}) { return createClient({ ...defaults, ...extra }); }

test('sendMessage sends text to Graph API and does not put access token in URL', async () => {
  let captured;
  const client = fakeClient({ fetchImpl: async (url, opts) => {
    captured = { url, opts }; return new Response(JSON.stringify({ recipient_id: '123', message_id: 'mid.1' }), { status: 200 });
  }});
  const result = await client.sendMessage('Hello', '123');
  assert.equal(result.message_id, 'mid.1');
  assert.equal(captured.url, 'https://graph.facebook.com/v24.0/456/messages');
  assert.equal(captured.opts.headers.Authorization, 'Bearer top-secret-test-token');
  assert.deepEqual(JSON.parse(captured.opts.body), {
    recipient: { id: '123' }, messaging_type: 'RESPONSE', message: { text: 'Hello' }
  });
});

test('callback API works and rejects non-HTTPS attachment', async () => {
  const client = fakeClient({ fetchImpl: async () => new Response('{"message_id":"mid.2"}', { status: 200 }) });
  await new Promise((resolve, reject) => {
    client.sendMessage('Hi', '123', (err, r) => err ? reject(err) : (assert.equal(r.message_id, 'mid.2'), resolve()));
  });
  assert.throws(() => client.sendAttachment('image', 'http://bad.test/pic.jpg', '123'), /https/);
});

test('non-200 Meta errors preserve API code', async () => {
  const client = fakeClient({ fetchImpl: async () => new Response(JSON.stringify({ error: { message: 'No permission', code: 10 } }), { status: 403 }) });
  await assert.rejects(client.sendMessage('Hi', '123'), e => e.code === 10 && e.status === 403);
});

test('valid webhook signature works, tampered signature fails', () => {
  const raw = Buffer.from('{"object":"page","entry":[]}');
  const good = 'sha256=' + createHmac('sha256', defaults.appSecret).update(raw).digest('hex');
  assert.equal(verifySignature(raw, good, defaults.appSecret), true);
  assert.equal(verifySignature(Buffer.from('tampered'), good, defaults.appSecret), false);
  assert.equal(verifySignature(raw, 'sha256=x', defaults.appSecret), false);
});

test('webhook GET challenge and POST message normalization', async t => {
  const client = fakeClient({ webhookPath: '/webhook' });
  const server = await client.startWebhook({ port: 0, host: '127.0.0.1' });
  t.after(() => client.stopWebhook());
  const base = `http://127.0.0.1:${server.address().port}/webhook`;
  const response = await fetch(base + '?hub.mode=subscribe&hub.verify_token=test-verify&hub.challenge=hello');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'hello');
  const bad = await fetch(base, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
  assert.equal(bad.status, 401);
  const payload = JSON.stringify({ object: 'page', entry: [{ messaging: [{ sender: { id: '123' }, recipient: { id: '456' }, message: { mid: 'mid.3', text: '!ping' } }] }] });
  const signature = 'sha256=' + createHmac('sha256', defaults.appSecret).update(payload).digest('hex');
  const nextMessage = once(client, 'message');
  const res = await fetch(base, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature }, body: payload
  });
  assert.equal(res.status, 200);
  const [event] = await nextMessage;
  assert.equal(event.threadID, '123');
  assert.equal(event.body, '!ping');
  assert.equal(event.messageID, 'mid.3');
});

test('postback event normalization', () => {
  const events = normalizeEvents({ object: 'page', entry: [{ messaging: [{ sender: { id: '11' }, postback: { payload: 'YES' } }] }] });
  assert.equal(events[0].type, 'postback');
  assert.equal(events[0].payload, 'YES');
});
