'use strict';
const fs = require('node:fs');
const path = require('node:path');
const login = require('../index');

const statePath = path.join(process.cwd(), 'appstate.json');
if (!fs.existsSync(statePath)) {
  console.error('Missing appstate.json in the bot working directory.');
  process.exit(1);
}
let appState;
try {
  appState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  if (!Array.isArray(appState)) throw new Error('Expected an array of cookie objects');
} catch (err) {
  console.error('Invalid appstate.json:', err.message);
  process.exit(1);
}

login({ appState }, { listenEvents: true, selfListen: false }, (err, api) => {
  if (err) {
    console.error('Personal ID login failed:', err.message);
    return;
  }
  console.log('Logged in:', api.getCurrentUserID());
  api.listenMqtt((listenError, event) => {
    if (listenError) return console.error('MQTT error:', listenError.message);
    if (event && event.type === 'message' && event.body === '!ping') {
      api.sendMessage('Pong! 🏓', event.threadID, error => {
        if (error) console.error('Send error:', error.message);
      });
    }
  });
});
