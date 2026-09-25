// Sol Mage wallet test: a pretend Phantom wallet and a pretend Solana RPC, so it runs offline.
// Connects from the title screen, checks the perks at 20,000 and 2,000,000 tokens, then disconnects.
// Run it with the game served at http://localhost:8123: node tests/wallet.cjs
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const OUT = path.join(__dirname, 'shots');
require('fs').mkdirSync(OUT, { recursive: true });
const MINT = 'So1MageTest11111111111111111111111111111111', ADDR = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  let balance = 20000, calls = 0;
  await p.route('https://api.devnet.solana.com/**', async (route) => {
    calls++;
    const req = route.request().postDataJSON();
    const ok = req.method === 'getTokenAccountsByOwner' && req.params[0] === ADDR && req.params[1].mint === MINT;
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, result: { value: ok ? [{ account: { data: { parsed: { info: { tokenAmount: { uiAmount: balance, uiAmountString: String(balance) } } } } } }] : [] } }) });
  });
  await p.addInitScript((addr) => { window.phantom = { solana: { isPhantom: true, publicKey: null, connect: async () => { window.phantom.solana.publicKey = { toString: () => addr }; return { publicKey: window.phantom.solana.publicKey }; } } }; }, ADDR);
  await p.goto(`http://localhost:8123/index.html?solmint=${MINT}`);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('darquest-settings', JSON.stringify({ quality: 'medium' })); });
  await p.reload(); await p.waitForTimeout(2000);
  await p.evaluate(() => { document.querySelector('.new-game')?.classList.add('hidden'); document.querySelector('#title-wallet').click(); });
  await p.waitForTimeout(400);
  console.log('before connect:', await p.evaluate(() => document.querySelector('#modal .wallet-apps')?.textContent.trim()));
  await p.screenshot({ path: `${OUT}/wallet_before.png` });
  await p.evaluate(() => document.querySelector('[data-app]').click());
  await p.waitForTimeout(800);
  console.log('after connect:', await p.evaluate(() => document.querySelector('.wallet-card')?.textContent.replace(/\s+/g, ' ').trim()), '| unlocked tiers:', await p.evaluate(() => document.querySelectorAll('.wallet-tiers .card-tag.ok').length), '| rpc calls', calls);
  await p.screenshot({ path: `${OUT}/wallet_after.png` });
  await p.evaluate(() => window.darquest.UI.closeModal());
  await p.evaluate(() => window.darquest.newGame('Wren Ashdown', 'blaze', 'normal')); await p.waitForTimeout(2200);
  const info = await p.evaluate(async () => { const dq = window.darquest; dq.UI.closeDialog(); const a = await import('./src/achievements.js'); return { cosmetic: dq.world.cosmetic, titles: a.unlockedTitles(dq.player) }; });
  console.log('in game:', JSON.stringify(info));
  await p.evaluate(() => { const dq = window.darquest; dq.player.title = 'the Sunbound'; dq.world.camYaw = 0; dq.world.camDist = 6; dq.world.camPitch = 1; });
  await p.keyboard.press('KeyJ'); await p.waitForTimeout(200); await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/wallet_ingame.png` });
  balance = 2000000;
  await p.evaluate(async () => { const c = await import('./src/chain.js'); await c.refresh(); });
  await p.waitForTimeout(1500);
  console.log('archon:', await p.evaluate(async () => { const c = await import('./src/chain.js'); return c.tier()?.id + ' robe=' + window.darquest.world.cosmetic?.robe; }));
  await p.screenshot({ path: `${OUT}/wallet_archon.png` });
  await p.evaluate(async () => { const c = await import('./src/chain.js'); c.disconnect(); });
  await p.waitForTimeout(300);
  console.log('after disconnect: cosmetic', await p.evaluate(() => JSON.stringify(window.darquest.world.cosmetic)), 'title', await p.evaluate(() => window.darquest.player.title));
  console.log(errs.length ? 'ERRORS ' + errs.join('\n') : 'no errors');
  await b.close();
})();
