'use strict';
const { MessengerFCA, createClient } = require('./src/client');

// Personal-account authentication uses a separately maintained unofficial backend.
// Load it only for personal logins so Page API users remain unaffected.
function login(...args) {
  const backend = require('@dongdev/fca-unofficial');
  const authenticate = typeof backend === 'function' ? backend : backend.login;
  if (typeof authenticate !== 'function') {
    throw new Error('Personal FCA authentication backend does not export login()');
  }
  return authenticate(...args);
}

module.exports = Object.assign(login, { login, MessengerFCA, createClient });
