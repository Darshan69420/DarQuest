// Sol Mage on Solana: connect a wallet, read how many Sol Mage tokens it holds, and unlock
// cosmetic perks. The game only ever reads from the chain. It never asks a wallet to sign or
// send anything, and everything in the game works without a wallet.

export const CHAIN = {
  network: 'devnet',                   // 'devnet' while testing, 'mainnet' after launch
  rpc: {
    devnet: 'https://api.devnet.solana.com',
    // the public mainnet endpoint is rate-limited: use your own RPC URL (Helius, QuickNode...) at launch
    mainnet: 'https://api.mainnet-beta.solana.com',
  },
  mint: '',                            // the Sol Mage token's mint address (see docs/token/README.md)
  name: 'Sol Mage',
  symbol: 'SOLMAGE',
};

// A test link can point the game at another network or mint: ?solnet=devnet&solmint=<address>
try {
  const q = new URLSearchParams(location.search);
  if (['devnet', 'mainnet'].includes(q.get('solnet'))) CHAIN.network = q.get('solnet');
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q.get('solmint') || '')) CHAIN.mint = q.get('solmint');
} catch { /* no location (tests) */ }

// Perks by how many tokens the wallet holds. Each tier includes the ones below it.
export const TIERS = [
  { id: 'holder', min: 1, name: 'Sol Mage', perks: ['Sol Mage robes, violet and gold', 'The title "the Sol Mage"'],
    outfit: { robe: 0x3b2a7a, hat: 0x241a4a, trim: 0xf2c14e, gem: 0x14f195 } },
  { id: 'adept', min: 10000, name: 'Sunbound Adept', perks: ['A sun-orange cape and a green-fire orb', 'The title "the Sunbound"'],
    outfit: { robe: 0x3b2a7a, hat: 0x241a4a, trim: 0xf2c14e, gem: 0x14f195, cape: 0xe8923a, orb: 0x14f195 } },
  { id: 'archon', min: 1000000, name: 'Solar Archon', perks: ['Black-and-gold archon robes', 'A drifting aura of sunfire', 'The title "Solar Archon"'],
    outfit: { robe: 0x1d1a24, hat: 0x121016, trim: 0xf2c14e, gem: 0xffd23d, cape: 0x9945ff, orb: 0xffd23d }, aura: true },
];
const TITLES = { holder: 'the Sol Mage', adept: 'the Sunbound', archon: 'Solar Archon' };

const KEY = 'solmage-wallet';
// address, balance, when it was checked, which wallet app, and whether to wear the outfit
export const wallet = { address: null, balance: 0, checkedAt: 0, app: null, wear: true, error: null, loading: false };
try { Object.assign(wallet, JSON.parse(localStorage.getItem(KEY) || '{}'), { error: null, loading: false }); } catch { /* ignore */ }

const listeners = [];
export function onWallet(fn) { listeners.push(fn); }
function changed() {
  try { localStorage.setItem(KEY, JSON.stringify({ address: wallet.address, balance: wallet.balance, checkedAt: wallet.checkedAt, app: wallet.app, wear: wallet.wear })); } catch { /* ignore */ }
  for (const fn of listeners) fn(wallet);
}

export function tier(balance = wallet.balance) {
  let best = null;
  for (const t of TIERS) if (wallet.address && balance >= t.min) best = t;
  return best;
}

export function perkTitles() {
  const t = tier();
  if (!t) return [];
  return TIERS.slice(0, TIERS.indexOf(t) + 1).map(x => TITLES[x.id]);
}

// The outfit to wear, or null.
export function outfit() {
  const t = tier();
  return t && wallet.wear ? t.outfit : null;
}

export const shortAddress = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : '');

// ------------------------------------------------------------ wallets

// Wallet apps announce themselves through the Wallet Standard; older ones inject a global.
const standard = [];
function register(...ws) { for (const w of ws) if (!standard.includes(w)) standard.push(w); return () => {}; }
if (typeof window !== 'undefined') {
  window.addEventListener('wallet-standard:register-wallet', (e) => { try { e.detail({ register }); } catch { /* a broken wallet */ } });
  try { window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', { detail: { register } })); } catch { /* ignore */ }
}

// Every wallet the player could connect: { id, name, icon, connect() → address }
export function walletApps() {
  const out = [];
  for (const w of standard) {
    const solana = (w.chains || []).some(c => c.startsWith('solana:'));
    const connect = w.features?.['standard:connect'];
    if (!solana || !connect) continue;
    out.push({ id: 'std:' + w.name, name: w.name, icon: w.icon, connect: async () => (await connect.connect()).accounts?.[0]?.address });
  }
  const legacy = [
    ['Phantom', () => window.phantom?.solana || (window.solana?.isPhantom && window.solana)],
    ['Solflare', () => window.solflare?.isSolflare && window.solflare],
    ['Backpack', () => window.backpack?.solana || window.backpack],
  ];
  for (const [name, get] of legacy) {
    const provider = typeof window !== 'undefined' && get();
    if (!provider?.connect || out.some(o => o.name === name)) continue;
    out.push({ id: 'legacy:' + name, name, connect: async () => {
      const r = await provider.connect();
      return (r?.publicKey || provider.publicKey)?.toString();
    } });
  }
  return out;
}

export async function connect(app) {
  wallet.error = null;
  try {
    const address = await app.connect();
    if (!address) throw new Error('The wallet did not share an address.');
    wallet.address = address;
    wallet.app = app.name;
    wallet.balance = 0;
    changed();
    await refresh();
  } catch (e) {
    wallet.error = e?.message?.includes('reject') ? 'You cancelled the connection.' : (e?.message || 'Could not connect.');
    changed();
  }
}

export function disconnect() {
  Object.assign(wallet, { address: null, balance: 0, checkedAt: 0, app: null, error: null });
  changed();
}

export function setWear(on) { wallet.wear = on; changed(); }

// ------------------------------------------------------------ reading the chain

async function rpc(method, params) {
  const res = await fetch(CHAIN.rpc[CHAIN.network], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`The Solana network answered ${res.status}. Try again in a moment.`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'The Solana network sent an error.');
  return json.result;
}

// How many Sol Mage tokens an address holds, across all its token accounts.
export async function tokenBalance(owner, mint = CHAIN.mint) {
  if (!mint) return 0;
  const result = await rpc('getTokenAccountsByOwner', [owner, { mint }, { encoding: 'jsonParsed', commitment: 'confirmed' }]);
  let total = 0;
  for (const acc of result?.value || []) {
    const amt = acc.account?.data?.parsed?.info?.tokenAmount;
    total += amt ? Number(amt.uiAmountString ?? amt.uiAmount ?? 0) : 0;
  }
  return total;
}

export async function refresh() {
  if (!wallet.address) return;
  if (!CHAIN.mint) { wallet.balance = 0; wallet.checkedAt = Date.now(); changed(); return; }
  wallet.loading = true;
  wallet.error = null;
  changed();
  try {
    wallet.balance = await tokenBalance(wallet.address);
    wallet.checkedAt = Date.now();
  } catch (e) {
    wallet.error = e?.message || 'Could not read the balance.';
  }
  wallet.loading = false;
  changed();
}
