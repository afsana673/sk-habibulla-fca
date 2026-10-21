'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { createClient, login } = require('..');

test('Package exposes Personal login and preserves Page API', () => {
  const api = require('..');
  assert.equal(typeof api, 'function');
  assert.equal(api, login);
  assert.equal(typeof createClient, 'function');
});

test('Personal login forwards AppState, options and callback to backend', () => {
  const originalLoad = Module._load;
  const appState = [{ key: 'c_user', value: 'test-only' }];
  let called = false;
  Module._load = function(request, parent, isMain) {
    if (request === '@dongdev/fca-unofficial') {
      return (credentials, options, callback) => {
        assert.deepEqual(credentials.appState, appState);
        assert.equal(options.listenEvents, true);
        callback(null, { listenMqtt: () => {}, sendMessage: () => {} });
        called = true;
      };
    }
    return originalLoad.apply(this, arguments);
  };
  try {
    login({ appState }, { listenEvents: true }, (error, api) => {
      assert.equal(error, null);
      assert.equal(typeof api.listenMqtt, 'function');
    });
    assert.equal(called, true);
  } finally {
    Module._load = originalLoad;
  }
});

test('Personal login accepts callback-only form', () => {
  const originalLoad = Module._load;
  let forwarded;
  Module._load = function(request) {
    if (request === '@dongdev/fca-unofficial') return (...args) => { forwarded = args; return 'ok'; };
    return originalLoad.apply(this, arguments);
  };
  try {
    const cb = () => {};
    assert.equal(login({ appState: [] }, cb), 'ok');
    assert.equal(forwarded.length, 2);
    assert.equal(forwarded[1], cb);
  } finally {
    Module._load = originalLoad;
  }
});
