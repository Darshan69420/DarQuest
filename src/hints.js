// Tutorial hints: a small card that explains one thing at the moment you first need it.
// Each hint shows once per wizard (remembered in p.hints) and they can be switched off in Settings.
import { settings, keyFor, keyLabel } from './settings.js';

const k = (a) => `<kbd>${keyLabel(keyFor(a))}</kbd>`;
const touch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

// when(c): should it appear now? done(c, t): has the player got it? (t = seconds on screen)
// urgent hints push a calmer one aside; it comes back later.
export const HINTS = [
  {
    id: 'move', icon: '🧭', title: 'Getting around',
    text: () => touch()
      ? 'Drag the <b>joystick</b> to walk, or tap the ground to walk there. Drag anywhere else to turn the camera.'
      : `Walk with <span class="nw">${k('forward')}${k('left')}${k('back')}${k('right')}</span> or click the ground. <b>Drag</b> the mouse to look around, and scroll to zoom.`,
    when: () => true,
    done: (c, t) => c.walked > 10 || t > 45,
  },
  {
    id: 'dodge', icon: '⚠️', title: 'Danger on the ground!', urgent: true,
    text: () => `Red on the ground means a big attack is coming. Step out of it, or ${touch() ? 'tap 💨' : `press ${k('dodge')}`} to dodge-roll through it.`,
    when: (c) => c.danger,
    done: (c, t) => t > 8,
  },
  {
    id: 'potion', icon: '🧪', title: 'Health is low', urgent: true,
    text: () => `${touch() ? 'Tap 🧪' : `Press ${k('potion')}`} to drink a potion. Fountains like the Wellspring heal you for free, and Madame Fizz sells more potions.`,
    when: (c) => c.inCombat && c.hp < 0.45 && c.p.potions > 0,
    done: (c, t) => c.hp > 0.7 || t > 10,
  },
  {
    id: 'fight', icon: '✨', title: 'Casting spells',
    text: () => touch()
      ? 'Tap the first spell button to attack your target, and tap a foe to target it. The other buttons cast the spells on your bar, which use mana (the blue bar).'
      : `Press ${k('slot1')} to attack your target. <span class="nw">${k('slot2')}–${k('slot5')}</span> cast the spells on your bar, which use mana (the blue bar). ${k('target')} picks the next foe.`,
    when: (c) => c.inCombat,
    done: (c, t) => t > 10 || (!c.inCombat && t > 3),
  },
  {
    id: 'quest', icon: '⭐', title: 'Following your quest',
    text: () => `Your quest is in the <b>📜 Quest</b> card. The ⭐ on the minimap and the <b>beam of light</b> show where to go next. ${touch() ? 'Tap 📜' : k('journal')} opens your journal.`,
    when: (c) => c.seen('move'),
    done: (c, t) => t > 11,
  },
  {
    id: 'marker', icon: '❗', title: 'Someone needs you',
    text: () => `A <b>❗</b> over someone's head means they have a quest. A <b>❓</b> means you can hand one in. ${touch() ? 'Tap them' : `Walk up and press ${k('interact')}`} to talk.`,
    when: (c) => c.markerNear,
    done: (c, t) => t > 10 || c.talking,
  },
  {
    id: 'levelup', icon: '📘', title: 'You levelled up!',
    text: () => `Each level gives a <b>Training Point</b>: Mirabel in the Academy courtyard teaches new spells for them. Put spells on your bar in the Spellbook (${k('spellbook')}), and spend <b>Talent Points</b> under Character (${k('character')}) → Talents.`,
    when: (c) => c.p.level >= 2,
    done: (c, t) => t > 14,
  },
  {
    id: 'gear', icon: '🎒', title: 'New gear',
    text: () => `You found something to wear! Open Character (${touch() ? '🎒' : k('character')}) to put it on. Rarer colours roll bigger bonuses.`,
    when: (c) => c.p.inventory.length > 0,
    done: (c, t) => t > 10,
  },
  {
    id: 'gather', icon: '⛏️', title: 'Gathering',
    text: () => `${touch() ? 'Tap the prompt' : `Press ${k('interact')}`} to gather. Your wizard keeps working until the spot runs out. Gathering trains your Skills (${k('skills')}), and materials become food, potions and gear at crafting stations.`,
    when: (c) => c.nodeNear,
    done: (c, t) => t > 12,
  },
  {
    id: 'portal', icon: '🌀', title: 'A Spiral Door',
    text: () => `Spiral Doors lead to other lands. ${touch() ? 'Tap the prompt' : `Press ${k('interact')}`} next to one to travel. Locked doors open as your story goes on.`,
    when: (c) => c.portalNear,
    done: (c, t) => t > 10,
  },
  {
    id: 'night', icon: '🌙', title: 'Night falls',
    text: () => 'At night <b>spirits roam</b> the land and every foe gives <b>15% more XP</b>. A lantern lights your way.',
    when: (c) => c.night && c.p.level >= 2,
    done: (c, t) => t > 9,
  },
  {
    id: 'mount', icon: '🐴', title: 'Saddle up',
    text: () => `${touch() ? 'Use the menu (☰)' : `Press ${k('mount')}`} to ride your mount. You hop off when a battle starts.`,
    when: (c) => c.p.mounts?.length > 0 && !c.mounted,
    done: (c, t) => c.mounted || t > 10,
  },
];

export class Hints {
  constructor(el) {
    this.el = el;
    this.cur = null;     // the hint on screen
    this.t = 0;          // how long it has been showing
    this.gap = 1.5;      // quiet time before the next one
    this.walked = 0;
    this.last = null;
    el.addEventListener('click', () => this.close());   // tap anywhere on the card to dismiss it
  }

  reset() { this.hide(); this.walked = 0; this.last = null; this.gap = 1.5; }

  seen(p, id) { return !!p.hints?.[id]; }

  // c: { p, pos, inCombat, hp, danger, markerNear, nodeNear, portalNear, night, mounted, talking, paused }
  update(c, dt) {
    const p = c.p;
    p.hints ??= {};
    this.player = p;
    if (this.last) {
      const d = Math.hypot(c.pos.x - this.last.x, c.pos.z - this.last.z);
      if (d < 20) this.walked += d;   // bigger jumps are teleports
    }
    this.last = { x: c.pos.x, z: c.pos.z };
    if (!settings.hints || p.hints._old) { if (this.cur) this.hide(); return; }
    c.walked = this.walked;
    c.seen = (id) => this.seen(p, id);
    // menus and conversations hide the card; the clock only runs while you can see it
    this.el.classList.toggle('paused', !!c.paused);
    if (this.cur) {
      if (!c.paused) this.t += dt;
      if (this.cur.done(c, this.t)) return this.close();
      if (c.paused || this.cur.urgent) return;
      const urgent = HINTS.find(h => h.urgent && !p.hints[h.id] && h.when(c));
      if (urgent) this.show(urgent);   // the calm one waits its turn
      return;
    }
    if (c.paused) return;
    this.gap -= dt;
    if (this.gap > 0 && !HINTS.some(h => h.urgent && !p.hints[h.id] && h.when(c))) return;
    const next = HINTS.find(h => !p.hints[h.id] && h.when(c));
    if (next) this.show(next);
  }

  show(h) {
    this.cur = h;
    this.t = 0;
    this.el.innerHTML = `<div class="hint-icon">${h.icon}</div><div class="hint-body"><div class="hint-title">${h.title}</div><div class="hint-text">${h.text()}</div></div><button class="hint-x" title="Got it">✕</button>`;
    this.el.classList.remove('hidden', 'out');
    this.el.classList.toggle('urgent', !!h.urgent);
    void this.el.offsetWidth;
    this.el.classList.add('in');
  }

  // The player has seen this one: remember it and make room for the next.
  close() {
    if (!this.cur) return;
    if (this.player) this.player.hints[this.cur.id] = 1;
    this.onSeen?.(this.cur.id);
    this.hide();
    this.gap = 4;
  }

  hide() {
    this.cur = null;
    this.el.classList.remove('in');
    this.el.classList.add('out');
    clearTimeout(this.hideT);
    this.hideT = setTimeout(() => { if (!this.cur) this.el.classList.add('hidden'); }, 300);
  }
}
