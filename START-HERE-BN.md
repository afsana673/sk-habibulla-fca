# নিজের FCA npm প্যাকেজ — বাংলা নির্দেশনা

**প্যাকেজ:** `sk-habibulla-fca` (ইচ্ছা করলে `package.json`-এ নিজের নামে পরিবর্তন করো)

এটি সম্পূর্ণ আলাদা Node.js কোড: `@eryxenx/fca` dependency নেই।

⚠️ **গুরুত্বপূর্ণ:** এটি Facebook **Page** Messenger API ব্যবহার করে। ব্যক্তিগত অ্যাকাউন্টের `appstate.json` / ID-cookie দিয়ে login করে না এবং GoatBot-এর `listenMqtt`, group kick, unsend নেই। এ ধরনের personal-account FCA করতে আলাদা অনানুষ্ঠানিক protocol implementation দরকার।

## npm-এ publish

1. ZIP extract করে ফোল্ডার খুলবে।
2. `package.json` খুলে `"name": "sk-habibulla-fca"` পরিবর্তন করে নিজের available npm package name লিখবে। চাইলে `@তোমার-এনপিএম-ইউজারনেম/fca` রূপে দাও।
3. Node.js 20+ এবং npm ইনস্টল থাকতে হবে।
4. Terminal-এ চালাবে:

```bash
npm login
npm test
npm publish --dry-run
npm publish --access public
```

এরপর অন্যরা `npm install তোমার-প্যাকেজ-নাম` চালিয়ে ব্যবহার করতে পারবে। Scoped name নিলে npm account-এ ওই scope-এর মালিক হতে হবে; publish করার সময় 2FA/অনুমতি লাগতে পারে।

## Railway-তে Page bot চালাতে

GitHub-এ পুরো ফোল্ডার push করবে, Railway-তে deploy করবে এবং এগুলো Environment Variables হিসেবে বসাবে:

```text
FB_PAGE_ID=...
FB_PAGE_ACCESS_TOKEN=...
FB_VERIFY_TOKEN=...
FB_APP_SECRET=...
FB_GRAPH_VERSION=v24.0
```

Railway-এর Start Command:

```bash
node examples/bot.js
```

Meta App Dashboard-এর webhook Callback URL:

```text
https://তোমার-railway-ডোমেইন/webhook
```

Webhook Verify Token হিসেবে `FB_VERIFY_TOKEN`-এর হুবহু value দাও। Messenger webhook message subscription চালু করো। আপনার Page-এ `!ping` পাঠালে bot `Pong!` পাঠানোর জন্য প্রস্তুত থাকে; Meta permission ও messaging policy ঠিক থাকতে হবে।

**কখনোই cookie, password, app secret বা access token npm প্যাকেজের মধ্যে রাখবে না।**
