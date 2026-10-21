'use strict';
const { createClient } = require('../index');

const client = createClient({
  pageId: process.env.FB_PAGE_ID,
  pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN,
  verifyToken: process.env.FB_VERIFY_TOKEN,
  appSecret: process.env.FB_APP_SECRET,
  apiVersion: process.env.FB_GRAPH_VERSION || 'v24.0'
});

client.listen(async event => {
  if (event.isEcho) return;
  const command = (event.body || '').trim().toLowerCase();
  if (command === '!ping') await client.sendMessage('Pong! 🏓', event.threadID);
  else if (command === '!help') await client.sendMessage('Commands: !ping, !help', event.threadID);
});

client.on('postback', async event => {
  await client.sendMessage(`Postback: ${event.payload}`, event.threadID);
});
client.on('handlerError', error => console.error('Bot error:', error.message));

client.startWebhook({ port: Number(process.env.PORT) || 3000 })
  .then(() => console.log(`Webhook running: /webhook (port ${process.env.PORT || 3000})`))
  .catch(error => { console.error(error); process.exitCode = 1; });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => client.stopWebhook().finally(() => process.exit(0)));
}
