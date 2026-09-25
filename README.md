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
| Move | `W` `A` `S` `D` or the arrow keys, or tap/click the ground |
| Look around | Drag with the mouse or your finger; scroll to zoom |
| Talk / gather / use | `E` |
| Basic attack / spells | `1` / `2`–`5` (or click the hotbar) |
| Dodge | `Space` |
| Dragon shout | `R` |
| Next target | `Tab` (or click an enemy) |
| Spellbook & shouts | `B` |
| Character, gear & pets | `C` |
| Skills | `K` |
| Materials bag | `I` |
| Quest journal | `J` |
| Eat food / drink potion | `F` / `H` |
| Build mode (at your Homestead) | `G` |
| Ride / dismount | `X` |
| World Atlas & fast travel | `N` (or click the minimap) |
| Menu & settings | `Esc` |

Every key can be changed in **Settings → Keys**.

## How it plays

- **Six schools:** Blaze 🔥, Frost ❄️, Tempest ⚡, Verdant 🌿, Umbral 💀 and Arcane ✨, each with its own health and spell list. Astral 🌙 support spells can be learned by everyone.
- **Real-time combat:** key `1` is your school's free basic attack (every third hit in a row is a combo strike), and keys `2`–`5` hold the spells you pick. Enemies wind up big attacks: **red shapes on the ground** show where they will land, so step out or dodge through them.
- **Three chapters of story:** Hollow Lane (Lord Hollowmere), the Emberfall Wilds (Pyrrhon, the Molten King) and the **Dragonspire Peaks**, where Vorathrax the Sky Tyrant flies above the battlefield and rains fire until you shout her down.
- **Dragon shouts:** learn the Voice, read Word Walls to learn six shouts (Unrelenting Force, Fire Breath, Frost Breath, Whirlwind Sprint, Become Ethereal, Dragonrend), and absorb dragon souls to unlock their deeper words.
- **Skills (RuneScape style):** Mining, Woodcutting, Fishing, Foraging, Cooking, Smithing, Alchemy and Woodworking, each from level 1 to 99. Gather in Millbrook Meadow and beyond, then craft bars, tools, food, potions, elixirs, amulets, wands and staffs at crafting stations.
- **The Endless Rift (roguelike):** a dungeon that is different every run, with shrines that grant boons, chests, traps, merchants, elites and a guardian boss every 5 floors. Spend Rift Shards on permanent upgrades.
- **Your Homestead (Minecraft style):** a floating island where you build anything from 14 kinds of crafted blocks (wood, stone, brick, glass, lanterns, crystal, gold, dragonscale and more), with a ghost preview and step-up walking, plus your own crafting stations.
- **Gear, pets and side quests:** 45+ gear pieces (drops, shops and crafting), 8 pets, the Gatherers' Guild quest chain, and a quest journal.
- **Mounts and fast travel:** six mounts (Starfall Steed, Dire Wolf, Emberback, Frost Elk, Void Stalker, Sky Drake), waystones across the world, and a World Atlas to fast-travel between them.
- **Day and night, weather:** a 15-minute day with a moving sun and moon, starry nights with night-only spirits and bonus XP, rain, thunderstorms, snow, blizzards and ashfall.
- **Difficulty:** Normal, Heroic or Legendary.
- **Quality of life:** three save slots with export and import, a settings menu (volume, graphics quality, modern or classic controls, rebindable keys), a minimap, generated music, and a touch joystick on phones.

## Code layout

```
index.html        page shell, HUD and title screen
css/style.css     all styling
src/data.js       ⭐ game content: schools, spells, enemies, NPCs, quests (start here to tweak!)
src/items.js      materials, food, potions and tools
src/skills.js     the 8 gathering/crafting skills, resource nodes and recipes
src/sidequests.js side quests (the Gatherers' Guild and more)
src/rift.js       the Endless Rift: floor generation, boons, upgrades
src/shouts.js     dragon shouts
src/homestead.js  building with blocks on your floating island
src/gear.js       item rarities, bonus stats and legendary powers
src/talents.js    talent trees for every school
src/sky.js        day/night cycle and weather
src/settings.js   settings and key bindings
src/state.js      player stats, levelling, quests, save/load
src/world.js      3D world (Three.js): map, movement, camera, enemies, spell effects
src/models.js     toon-shaded models built from code (outlines, faces, merging)
src/combat.js     real-time combat: spells, dodging, enemy AI, pets, boss phases
src/maps.js       Millbrook Meadow, Emberfall, Dragonspire and the Word Walls
src/skilling.js   the gathering loop
src/ui_*.js       windows for skills, the Rift and shouts
src/minimap.js    corner minimap
src/audio.js      synthesized sound effects and music
src/ui.js         dialogue, menus, cards
src/main.js       ties everything together
lib/              vendored Three.js (MIT licence)
gallery.html      model gallery: preview every model (?group=foes1, ?model=knight)
```

## Roadmap

The full plan is in [ROADMAP.md](ROADMAP.md). In short, each phase ends with a playable build:

1. **Solid foundation:** combat tuning, a settings menu, save slots, a tutorial, and bug and performance fixes.
2. **RPG depth:** talent trees, a second school, gear rarity and set bonuses, crafting, and an economy.
3. **A real world and story:** six worlds (one per school), about 60 main-story quests, branching dialogue, and fast travel.
4. **Dungeons and bosses:** puzzles, elites, dodge-the-floor boss mechanics, and heroic dungeons.
5. **Companions and systems:** hired wizards, pets that level up, mounts, a bestiary, and housing.
6. **Endgame:** level cap 50, the Tower of Trials, an arena, weekly challenges, and New Game+.
7. **Presentation:** animation, per-world music, polish, and accessibility.
8. **Ship it:** publish on GitHub Pages or itch.io and run a playtest round.
9. **Multiplayer (optional):** a small server for towns and co-op dungeons.
