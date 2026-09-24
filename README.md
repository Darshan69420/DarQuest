# DarQuest

A 3D spellcard adventure that runs in your web browser. You're a new apprentice at **Starfall Academy**. Pick a school of magic, build a deck of spell cards, and fight your way down Hollow Lane in turn-based duels.

## Play it

The game uses JavaScript modules, so it needs a tiny local web server. Opening `index.html` directly won't work. From this folder, run one of these:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000>.

To share it online, you can turn on **GitHub Pages** for this repo (Settings → Pages → deploy from the branch). It's a plain static site with no build step.

## Controls

| Action | Keys |
| --- | --- |
| Walk / turn | `W` `A` `S` `D` or the arrow keys, or tap/click the ground |
| Look around | Drag with the mouse or your finger; scroll to zoom |
| Talk / interact | `E` (or tap a character) |
| Spellbook (edit deck) | `B` |
| Drink potion | `H` |
| Help | `?` |
| In battle | Click a card (or press `1`–`7`), then click a target. Press `P` to pass and `Esc` to cancel |

## How it plays

- **Six schools:** Blaze 🔥, Frost ❄️, Tempest ⚡, Verdant 🌿, Umbral 💀 and Arcane ✨. Each has its own health, accuracy and spell list. Astral 🌙 support spells can be learned by everyone.
- **Pips:** in battle you gain a pip every round. Power pips (◆) count double for spells of your own school.
- **Cards:** you draw a hand of 7 from your deck. Damage, drains, burns over time, heals, blades, shields, traps and weaknesses.
- **Accuracy:** spells can fizzle! Enemies also resist their own school.
- **Progress:** earn XP and gold, level up, spend Training Points with Mirabel to learn spells, and buy potions from Madame Fizz. Your game saves automatically in the browser.
- **Chapter 1:** a 7-quest storyline that ends with a boss fight against Lord Hollowmere in the crypt.

## Code layout

```
index.html        page shell, HUD and title screen
css/style.css     all styling
src/data.js       ⭐ game content: schools, spells, enemies, NPCs, quests (start here to tweak!)
src/state.js      player stats, levelling, quests, save/load
src/world.js      3D world (Three.js): map, movement, camera, enemies, spell effects
src/models.js     low-poly models built from code
src/battle.js     the card battle system
src/ui.js         dialogue, menus, cards
src/main.js       ties everything together
lib/              vendored Three.js (MIT licence)
```

### Ideas for what to add next

- More worlds past Hollow Lane (new map zones plus new enemies in `data.js`)
- Pets, gear and equipment drops
- Companions who fight beside you
- Real 3D art: swap the models in `models.js` for glTF files
- Sound effects and music
- Online multiplayer
