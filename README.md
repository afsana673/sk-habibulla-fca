
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=230&color=0:00D4FF,50:9D00FF,100:FF00C8&text=SK%20HABIBULLA&fontSize=52&fontColor=FFFFFF&fontAlignY=39&animation=twinkling&desc=HR%20HABIB%20FCA%20%E2%9A%A1%20MESSENGER%20API&descSize=20&descAlignY=61" width="100%"/>

<img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=800&size=23&duration=2500&pause=800&color=00F7FF&center=true&vCenter=true&width=520&lines=Welcome+to+SK+HABIBULLA;Powerful+Messenger+Bot+API;Fast+%E2%9A%A1+Secure+%E2%9A%A1+Modern" />

### 💎 HR HABIB FCA v0.2.0

![Node](https://img.shields.io/badge/Node.js-20+-00FF88?style=for-the-badge&logo=node.js&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-0.2.0-FF0066?style=for-the-badge&logo=npm)
![License](https://img.shields.io/badge/License-MIT-8B00FF?style=for-the-badge)

**⚡ Modern Messenger API for Node.js ⚡**

</div>

---

## 🌈 Features

- 🔐 Personal Facebook AppState Login
- 💬 Send & Receive Messages
- ⚡ MQTT Event Listener
- 🤖 Messenger Bot Support
- 👥 Group Message Handling
- 🌐 Facebook Page API
- ☁️ Railway & Render Support

## 📦 Installation

```bash
npm install sk-habibulla-fca@0.2.0
```

## 🚀 Quick Start

```javascript
const fs = require("node:fs");
const login = require("sk-habibulla-fca");

const appState = JSON.parse(
  fs.readFileSync("./appstate.json", "utf8")
);

login({ appState }, (err, api) => {
  if (err) return console.error(err);

  console.log("SK HABIBULLA FCA Connected!");

  api.listenMqtt((err, event) => {
    if (err) return console.error(err);

    if (event?.type === "message" &&
        event.body === "!ping") {
      api.sendMessage("🏓 Pong!", event.threadID);
    }
  });
});
```

> Personal account login uses an unofficial backend.
> Live Facebook compatibility is not guaranteed.
> Keep AppState files and credentials private.

---

<div align="center">

## 👑 DEVELOPER

### ⚡ SK HABIBULLA ⚡

**Creator & Maintainer**

💜 Fast • Powerful • Lightweight 💜

**Made with ❤️ by SK HABIBULLA**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:FF00C8,50:9D00FF,100:00D4FF&height=110&section=footer" width="100%"/>

</div>
