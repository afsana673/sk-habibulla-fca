'use strict';
const { EventEmitter } = require('node:events');
const http = require('node:http');
const { graphPost } = require('./http');
const { buildWebhookHandler } = require('./webhook');

function nonEmpty(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} must be a non-empty string`);
  return value.trim();
}

function withCallback(promise, callback) {
  if (callback === undefined) return promise;
  if (typeof callback !== 'function') throw new TypeError('callback must be a function');
  promise.then(result => callback(null, result), error => callback(error));
  return undefined;
}

class MessengerFCA extends EventEmitter {
  constructor(options = {}) {
    super();
    this.pageId = nonEmpty(options.pageId, 'pageId');
    this.pageAccessToken = nonEmpty(options.pageAccessToken, 'pageAccessToken');
    this.verifyToken = nonEmpty(options.verifyToken, 'verifyToken');
    this.appSecret = nonEmpty(options.appSecret, 'appSecret');
    this.apiVersion = options.apiVersion || 'v24.0';
    if (!/^v\d+\.\d+$/.test(this.apiVersion)) throw new TypeError('apiVersion must look like v24.0');
    this.webhookPath = options.webhookPath || '/webhook';
    if (!this.webhookPath.startsWith('/') || this.webhookPath.includes('?')) {
      throw new TypeError('webhookPath must start with / and contain no query string');
    }
    this.timeoutMs = options.timeoutMs ?? 15000;
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    if (typeof this.fetchImpl !== 'function') throw new TypeError('fetch is unavailable');
    this._server = null;
  }

  getCurrentUserID() { return this.pageId; }

  _emitHandlerError(error) {
    if (this.listenerCount('handlerError') > 0) this.emit('handlerError', error);
    else console.error('[messenger-fca] Webhook handler error:', error);
  }

  _send(payload, callback) {
    const promise = graphPost({
      fetchImpl: this.fetchImpl,
      apiVersion: this.apiVersion,
      pageId: this.pageId,
      accessToken: this.pageAccessToken,
      payload,
      timeoutMs: this.timeoutMs
    });
    return withCallback(promise, callback);
  }

  sendMessage(message, threadID, callback) {
    const recipient = nonEmpty(String(threadID ?? ''), 'threadID');
    const messageBody = typeof message === 'string' ? { text: message } : message;
    if (!messageBody || typeof messageBody !== 'object' || Array.isArray(messageBody)) {
      throw new TypeError('message must be text or a valid Messenger message object');
    }
    return this._send({
      recipient: { id: recipient },
      messaging_type: 'RESPONSE',
      message: messageBody
    }, callback);
  }

  sendAttachment(type, url, threadID, callback) {
    if (!['image', 'audio', 'video', 'file'].includes(type)) {
      throw new TypeError('type must be image, audio, video, or file');
    }
    nonEmpty(url, 'url');
    if (!/^https:\/\//i.test(url)) throw new TypeError('Attachment URL must use https://');
    return this.sendMessage({
      attachment: { type, payload: { url, is_reusable: false } }
    }, threadID, callback);
  }

  sendQuickReplies(text, replies, threadID, callback) {
    nonEmpty(text, 'text');
    if (!Array.isArray(replies) || replies.length < 1 || replies.length > 13) {
      throw new TypeError('replies must contain 1–13 quick reply objects');
    }
    return this.sendMessage({ text, quick_replies: replies }, threadID, callback);
  }

  senderAction(action, threadID, callback) {
    if (!['typing_on', 'typing_off', 'mark_seen'].includes(action)) {
      throw new TypeError('Unknown sender action');
    }
    const recipient = nonEmpty(String(threadID ?? ''), 'threadID');
    return this._send({ recipient: { id: recipient }, sender_action: action }, callback);
  }

  sendTemplate(payload, threadID, callback) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new TypeError('payload must be an object');
    }
    return this.sendMessage({ attachment: { type: 'template', payload } }, threadID, callback);
  }

  listen(handler) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    this.on('message', handler);
    return () => this.off('message', handler);
  }

  webhookHandler() { return buildWebhookHandler(this); }

  async startWebhook({ port = 3000, host = '0.0.0.0' } = {}) {
    if (this._server) throw new Error('Webhook server is already running');
    const server = http.createServer(this.webhookHandler());
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => { server.off('error', reject); resolve(); });
      });
    } catch (error) { server.close(); throw error; }
    this._server = server;
    return server;
  }

  async stopWebhook() {
    if (!this._server) return;
    const server = this._server;
    this._server = null;
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

function createClient(options) { return new MessengerFCA(options); }
module.exports = { MessengerFCA, createClient };
