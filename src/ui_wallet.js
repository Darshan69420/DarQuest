// The Sol Mage wallet window: connect a Solana wallet, see your Sol Mage balance and which
// cosmetic perks it unlocks.
import { openModal, esc } from './ui.js';
import { CHAIN, TIERS, wallet, tier, walletApps, connect, disconnect, refresh, setWear, shortAddress, onWallet } from './chain.js';

// the open window re-renders whenever the wallet changes
let current = null;
onWallet(() => current?.());

const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

export function openWallet() {
  let body = null;
  const render = () => {
    if (!body?.isConnected) return;
    const t = tier(), apps = walletApps();
    const net = CHAIN.network === 'mainnet' ? 'Mainnet' : 'Devnet (test network)';
    let top;
    if (!wallet.address) {
      top = `<p class="modal-note">Hold <b>${CHAIN.name}</b> (${CHAIN.symbol}) tokens on Solana to unlock cosmetic perks for every wizard on this device.
        The game only reads your balance. It never asks your wallet to sign or send anything, and you can play the whole game without one.</p>
        <div class="wallet-apps">${apps.length
          ? apps.map((a, i) => `<button class="btn primary" data-app="${i}">${a.icon ? `<img src="${esc(a.icon)}" alt="" class="wallet-icon">` : ''}Connect ${esc(a.name)}</button>`).join('')
          : '<p class="modal-note">No Solana wallet found in this browser. Install <a href="https://phantom.com" target="_blank" rel="noopener">Phantom</a> or <a href="https://solflare.com" target="_blank" rel="noopener">Solflare</a>, then reload the game.</p>'}</div>`;
    } else {
      top = `<div class="wallet-card">
          <div><small>Connected${wallet.app ? ` with ${esc(wallet.app)}` : ''}</small><b class="wallet-addr" title="${esc(wallet.address)}">${esc(shortAddress(wallet.address))}</b></div>
          <div class="wallet-bal"><small>${esc(CHAIN.symbol)} held</small><b>${CHAIN.mint ? (wallet.loading ? '…' : fmt(wallet.balance)) : '—'}</b></div>
          <div class="wallet-btns"><button class="btn small" data-refresh ${wallet.loading || !CHAIN.mint ? 'disabled' : ''}>Refresh</button><button class="btn small" data-disconnect>Disconnect</button></div>
        </div>
        ${CHAIN.mint ? '' : `<p class="modal-note">The ${CHAIN.name} token has not launched yet, so there is no balance to read. Your perks will appear here once it does.</p>`}
        ${t ? `<label class="set-row"><span>Wear the ${esc(t.name)} outfit<small>Turn it off to show your own gear again</small></span><button class="btn small ${wallet.wear ? 'primary' : ''}" data-wear>${wallet.wear ? 'On' : 'Off'}</button></label>` : ''}`;
    }
    body.innerHTML = `${top}
      ${wallet.error ? `<p class="wallet-error">${esc(wallet.error)}</p>` : ''}
      <h3 class="sub-h">Perks</h3>
      <div class="wallet-tiers">${TIERS.map(x => {
        const have = t && TIERS.indexOf(t) >= TIERS.indexOf(x);
        return `<div class="gear-row ${have ? 'active' : 'empty'}"><div class="gear-icon">${have ? '✨' : '🔒'}</div>
          <div class="gear-info"><b>${esc(x.name)}</b> <small>hold ${fmt(x.min)}+ ${esc(CHAIN.symbol)}</small><br><span>${x.perks.map(esc).join(' · ')}</span></div>
          ${have ? '<span class="card-tag ok">Unlocked</span>' : ''}</div>`;
      }).join('')}</div>
      <p class="wallet-foot">${esc(net)}${CHAIN.mint ? ` · mint <code title="${esc(CHAIN.mint)}">${esc(shortAddress(CHAIN.mint))}</code>` : ''}. Perks are cosmetic and give no advantage in battle.</p>`;
    body.querySelectorAll('[data-app]').forEach(b => b.addEventListener('click', async () => { b.disabled = true; await connect(apps[+b.dataset.app]); }));
    body.querySelector('[data-refresh]')?.addEventListener('click', () => refresh());
    body.querySelector('[data-disconnect]')?.addEventListener('click', () => disconnect());
    body.querySelector('[data-wear]')?.addEventListener('click', () => setWear(!wallet.wear));
  };
  current = render;
  openModal(`🔮 ${CHAIN.name} Wallet`, '', (b) => { body = b; render(); });
}
