// Headless test runner: node tests/run.cjs [steps.js] [--q=query] [--pre=setup.js] [--w=1280 --h=720] [--shot=name]
// Starts a new game, runs optional steps (async JS evaluated in the page with `dq` = window.darquest,
// `sleep` and `log`), reports console errors and saves a screenshot to tests/shots/.
// Needs the game served at http://localhost:8123 (python3 -m http.server 8123) and Playwright.
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const stepsFile = args.find(a => !a.startsWith('--'));
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +opt('w', 1280), height: +opt('h', 720) } });
  const errors = [];
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('ERR_CERT') && !m.text().includes('GL Driver Message')) errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
  const url = `http://localhost:8123/${opt('page', 'index.html')}${opt('q', '') ? '?' + opt('q') : ''}`;
  await page.goto(url);
  if (!args.includes('--keep')) await page.evaluate((low) => { localStorage.clear(); if (low) localStorage.setItem('darquest-settings', JSON.stringify({ quality: 'low' })); }, args.includes('--low'));
  if (opt('pre')) await page.evaluate(fs.readFileSync(opt('pre'), 'utf8'));
  await page.reload();
  await page.waitForTimeout(1500);
  const t0 = Date.now();
  if (!args.includes('--notitle')) {
    const school = opt('school', 'blaze');
    await page.evaluate(() => window.darquestTestHook?.());
    const started = await page.evaluate(async (school) => {
      if (window.darquest?.newGame) { await window.darquest.newGame('Tester', school, 'normal'); return true; }
      const card = document.querySelector(`[data-school="${school}"]`);
      if (!card) return false;
      card.click();
      document.querySelector('#begin').click();
      return true;
    }, school);
    if (!started) errors.push('could not start game');
    await page.waitForTimeout(2500);
    await page.evaluate(() => { document.querySelector('#dialog button')?.click(); });
  }
  if (stepsFile) {
    const code = fs.readFileSync(stepsFile, 'utf8');
    try {
      const res = await page.evaluate(async (code) => {
        const dq = window.darquest;
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        const log = [];
        const fn = new Function('dq', 'sleep', 'log', `return (async () => { ${code} })();`);
        await fn(dq, sleep, log);
        return log;
      }, code);
      if (res && res.length) console.log('STEPS LOG:\n' + res.join('\n'));
    } catch (e) { errors.push('[steps] ' + e.message); }
  }
  const shot = path.join(OUT, `${opt('shot', 'shot')}.png`);
  await page.screenshot({ path: shot });
  const fps = await page.evaluate(() => new Promise(res => {
    let n = 0; const t = performance.now();
    const f = () => { n++; if (performance.now() - t < 2000) requestAnimationFrame(f); else res(n / 2); };
    requestAnimationFrame(f);
  }));
  console.log(`screenshot: ${shot}\nfps(headless): ${fps.toFixed(1)}  elapsed ${(Date.now() - t0) / 1000}s`);
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
  await browser.close();
})();
