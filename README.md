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
| Character, gear & pets | `C` |
| Drink potion | `H` |
| Sound on/off | `M` |
| Help | `?` |
| In battle | Click a card (or press `1`–`7`), then click a target. Press `P` to pass and `Esc` to cancel |

## How it plays

- **Six schools:** Blaze 🔥, Frost ❄️, Tempest ⚡, Verdant 🌿, Umbral 💀 and Arcane ✨. Each has its own health, accuracy and spell list. Astral 🌙 support spells can be learned by everyone.
- **Pips:** in battle you gain a pip every round. Power pips (◆) count double for spells of your own school.
- **Cards:** you draw a hand of 7 from your deck. Damage, drains, burns over time, heals, blades, shields, traps and weaknesses.
- **Accuracy:** spells can fizzle! Enemies also resist their own school.
- **Progress:** earn XP and gold, level up, spend Training Points with Mirabel to learn spells, and buy potions from Madame Fizz. Your game saves automatically in the browser.
- **Gear:** 20 hats, robes, boots, wands and amulets drop from enemies or can be bought. They add health, damage, accuracy, resist, power-pip chance and healing, and change your wizard's look.
- **Pets:** 6 pets follow you around and may cast a free spell at the start of each battle round. Hatch them from eggs or find them on tough enemies.
- **Difficulty:** Normal, Heroic (+50% enemy health, +30% damage, smarter AI) or Legendary (over double health, +60% damage, enemies start with pips, no fleeing). Harder modes give more XP, gold and loot.
- **Chapter 1, Hollow Lane:** 7 quests ending with a boss fight against Lord Hollowmere.
- **Chapter 2, Emberfall Wilds:** reached through the Spiral Door portal. 7 more quests, 6 new enemies, and Pyrrhon, the Molten King, a boss with two phases, two Magma Guards, and a nasty reaction to Frost magic.
- **Sound and music**, generated in code, and a **minimap** that points to your quest.

## Code layout

```
index.html        page shell, HUD and title screen
css/style.css     all styling
src/data.js       ⭐ game content: schools, spells, enemies, NPCs, quests (start here to tweak!)
src/state.js      player stats, levelling, quests, save/load
src/world.js      3D world (Three.js): map, movement, camera, enemies, spell effects
src/models.js     low-poly models built from code
src/battle.js     the card battle system (pets, boss phases, enemy AI)
src/maps.js       the Emberfall Wilds zone
src/minimap.js    corner minimap
src/audio.js      synthesized sound effects and music
src/ui.js         dialogue, menus, cards
src/main.js       ties everything together
lib/              vendored Three.js (MIT licence)
```

## Roadmap

1. **Chapter 3:** a new world (a frozen sky-city or a sunken ruin), plus dungeons: short instanced areas with a boss at the end.
2. **Crafting and treasure cards:** one-use spell cards found as loot, and recipes that turn materials into gear.
3. **Companions:** hire an NPC wizard of another school to fight beside you (true 2v3 battles).
4. **Arena (PvP-style):** duel AI "rival wizards" with their own decks for ranked rewards.
5. **Real art:** replace the code-built models in `models.js` with glTF models and animations.
6. **Online multiplayer:** a small Node.js server so friends can explore and battle together.
7. **Publish:** host on GitHub Pages or itch.io so anyone can play from a link.
