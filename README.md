# DarQuest

A 3D action RPG that runs in your web browser. You're a new apprentice at **Starfall Academy**. Pick a school of magic, learn spells, and blast your way through Hollow Lane and the Emberfall Wilds in real-time fights.

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
| Move | Camera-relative `W` `A` `S` `D`, classic arrow keys, or tap/click the ground |
| Sprint / gallop | Hold `Shift` while moving |
| Touch movement | Drag the thumb stick; hold Sprint to move faster |
| Look around | Drag with the mouse or your finger; scroll to zoom |
| Talk / interact | `E`, tap a character, or tap the nearby action prompt |
| Basic attack / spells | `1` / `2`–`5` (or click the hotbar) |
| Dodge | `Space` |
| Next target | `Tab` (or click an enemy) |
| Spellbook (choose spells for keys 2–5) | `B` |
| Character, gear & pets | `C` |
| Spell scroll bag | `R` |
| Mount / dismount | `F` |
| Fullscreen | `V` |
| Drink potion | `H` |
| Sound on/off | `M` |
| Help | `?` |

## How it plays

- **Six schools:** Blaze 🔥, Frost ❄️, Tempest ⚡, Verdant 🌿, Umbral 💀 and Arcane ✨. Each has its own health, accuracy and spell list. Astral 🌙 support spells can be learned by everyone.
- **Real-time combat:** fight right in the world. Key `1` is your school's free basic attack; keys `2`–`5` hold the spells you pick, each with a mana cost and cooldown. Damage, drains, burns over time, heals, blades, shields, traps and weaknesses.
- **Dodge:** enemies wind up their big attacks (watch the cast bar and ⚠️). A well-timed dodge makes you untouchable for a moment. Enemies resist their own school, and nearby friends join the fight.
- **Progress:** earn XP and gold, level up, spend Training Points with Mirabel to learn spells, and buy potions from Madame Fizz. Your game saves automatically in the browser.
- **Gear:** 20 hats, robes, boots, wands and amulets drop from enemies or can be bought. They add health, damage, crit chance, resist, haste and healing, and change your wizard's look.
- **Pets:** 6 pets follow you around and cast spells to help whenever you're fighting. Hatch them from eggs or find them on tough enemies.
- **Difficulty:** Normal, Heroic (+50% enemy health, +30% damage, faster and smarter enemies) or Legendary (over double health, +60% damage, much faster attacks). Harder modes give more XP, gold and loot.
- **Chapter 1, Hollow Lane:** 7 quests ending with a boss fight against Lord Hollowmere.
- **Chapter 2, Emberfall Wilds:** reached through the Spiral Door portal. 7 more quests, 6 new enemies, and Pyrrhon, the Molten King, a boss with two phases, two Magma Guards, and a nasty reaction to Frost magic.
- **Sound and music**, generated in code, and a **minimap** that points to your quest.
- **Scrolls and mounts:** find or buy one-use spell scrolls that work for any school without mana. Learn Astral Pulse at level 5 for a close-range burst, or find its rarer scroll. Buy a Moonstag or Emberstag from Elowen at the academy, ride faster, and dismount when combat begins. Spells draw animated sigils when cast.
- **Rift Contracts:** speak to Riftkeeper Vale in the academy courtyard for a repeatable three-stage hunt. Choose a temporary boon at each stage, face increasingly dangerous targets, and return for XP and gold. The run survives reloads; defeat or abandonment removes its boons. Your story progress remains.
- **The Shattered Archive:** after Hollow Lane, enter the Archive Gate in the courtyard for four chambers with seeded enemy groups, visible encounter rules and the Unbound Curator. After the second fight, seal a Folio to weaken the Curator or take its secret for extra gold on victory while the Curator hits harder. Later, choose to rest, take a scroll, or bind one of two offered Runes. Reload restores remaining foes and choices; every chamber has a return gate to abandon, or defeat the guardian for a one-time payout.

## Code layout

```
index.html        page shell, HUD and title screen
css/style.css     all styling
src/data.js       ⭐ game content: schools, spells, enemies, NPCs, quests (start here to tweak!)
src/state.js      player stats, levelling, quests, save/load
src/world.js      3D world (Three.js): map, movement, camera, enemies, spell effects
src/models.js     toon-shaded wizards, creatures and animated stags built from code
src/combat.js     real-time combat: spells, dodging, enemy AI, pets, boss phases
src/maps.js       the Emberfall Wilds zone
src/minimap.js    corner minimap
src/audio.js      synthesized sound effects and music
src/ui.js         dialogue, menus, cards
src/main.js       ties everything together
src/rifts.js      seeded Rift Contracts and temporary boons
src/archive.js    seeded Archive encounters and room progression
src/archive-map.js four original 3D chambers
lib/              vendored Three.js (MIT licence)
gallery.html      model gallery: preview every model (?group=foes1, ?model=knight)
docs/ROADMAP.md   game direction, next milestones and release checks
```

## Quality checks

Run `npm run check` with Node 20 or newer. It tests Rift and Archive progress, encounter combat rules, Rune offers, scroll consumption, mount ownership, save restoration and single payouts; the Archive route tests sample 1,200 seeds. Content validation checks references, 900 seeded Rift stages and 900 seeded Archive rooms. The game itself still has no build step or runtime npm dependencies.

## Roadmap

1. **First seeded dungeon:** assemble authored rooms in a short run with encounters, rest and a guardian. See [the full roadmap](docs/ROADMAP.md).
2. **Crafting and rare scrolls:** recipes that turn materials into gear, plus rare scrolls with new spell effects.
3. **Companions:** hire an NPC wizard of another school to fight beside you (true 2v3 battles).
4. **Arena (PvP-style):** duel AI "rival wizards" with their own decks for ranked rewards.
5. **Real art:** replace the code-built models in `models.js` with glTF models and animations.
6. **Online multiplayer:** a small Node.js server so friends can explore and battle together.
7. **Publish:** host on GitHub Pages or itch.io so anyone can play from a link.
