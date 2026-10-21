<div align="center">

# 🏠 HR HABIB FCA

**Personal Messenger FCA + Facebook Page API for Node.js**

`npm install sk-habibulla-fca`

</div>

## ⚡ Personal ID Login (AppState)

Requires your **own** Facebook account's `appstate.json` (cookie objects).

```js
const fs = require('node:fs');
const login = require('sk-habibulla-fca');
const appState = JSON.parse(fs.readFileSync('./appstate.json', 'utf8'));

login({ appState }, { listenEvents: true }, (err, api) => {
  if (err) return console.error('Login failed:', err.message);
  console.log('Logged in:', api.getCurrentUserID());
  api.listenMqtt((error, event) => {
    if (error) return console.error(error.message);
    if (event?.type === 'message' && event.body === '!ping') {
      api.sendMessage('Pong!', event.threadID);
    }
  });
});
```

**Functions:** `login()`, `api.listenMqtt()`, `api.sendMessage()`, `api.getCurrentUserID()` and additional backend APIs.

## 🌐 Facebook Page API

The existing official Page interface is still supported:

```js
const { createClient } = require('sk-habibulla-fca');
const page = createClient({
  pageId: process.env.FB_PAGE_ID,
  pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN,
  verifyToken: process.env.FB_VERIFY_TOKEN,
  appSecret: process.env.FB_APP_SECRET
});
```

## 🔒 Important

- Never upload `appstate.json`, cookies, passwords, or access tokens to GitHub.
- **Personal Login is unofficial.** It uses the separately maintained `@dongdev/fca-unofficial` backend (Apache-2.0), **not an independently built Messenger protocol**. Meta may change or block it; account restrictions are possible.
- Personal Login / MQTT have **not** been live-tested against Facebook here. Passing local tests does not guarantee successful login.
- Page API requires a Meta app, Page token and permissions.

**Developer:** HR HABIB · **License:** MIT (wrapper and Page client); backend retains its own license.
