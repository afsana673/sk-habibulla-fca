# GitHub + npm ওয়েবসাইট দিয়ে Publish (Termux ছাড়াই)

1. `https://github.com/new` → একটি PUBLIC repo তৈরি করো: `sk-habibulla-fca`.
2. এই ZIP extract করে **sk-habibulla-fca/** ফোল্ডারের *ভেতরের* সব ফাইল/ফোল্ডার repo root-এ upload করো। ZIP ফাইলটি একা upload করলে publish হবে না।
3. GitHub-এ `package.json` → Edit করে name বদলাও যদি নামটি npm-এ নেওয়া থাকে। Unscoped `sk-habibulla-fca`, অথবা নিজস্ব npm username দিয়ে `@username/fca`। `version` আগের version-এর থেকে নতুন হতে হবে।
4. `https://www.npmjs.com/` → account তৈরি করে 2FA চালু করো।
5. npm Profile → Access Tokens → Generate New Token; **Granular**, **Read and write (stage only)**; নতুন package-এর জন্য নিজের scope বা All Packages permission দাও; token copy করো।
6. GitHub Repo → Settings → Secrets and variables → Actions → New repository secret → Name: `NPM_TOKEN`, Value: npm token।
7. `.github/workflows/publish.yml` path-এ এই ZIP-এ থাকা workflow নিশ্চিত করো।
8. GitHub Repo → Actions → `Stage package on npm` → `Run workflow` → Branch main → Run workflow। Green হলে package Stage হয়েছে।
9. npm website-এ login → `Staged Packages` tab → সংশ্লিষ্ট package → Review → Approve → 2FA complete।
10. npm package now public: `npm install sk-habibulla-fca` (অথবা তোমার scoped package)।

**সতর্কতা:** এটি Facebook **Page** API-র FCA-style package; ব্যক্তিগত Facebook Account-এর `appstate.json` login, GoatBot / listenMqtt / group kick / unsend সমর্থন করে না। ব্যক্তিগত cookies, tokens, appstate ইত্যাদি GitHub-এ upload করো না।

Sources: https://docs.npmjs.com/staged-publishing/ , https://docs.npmjs.com/creating-and-viewing-access-tokens/
