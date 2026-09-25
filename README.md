# DarQuest

A 3D action RPG that runs in your web browser. You're a new apprentice at **Starfall Academy**. Pick a school of magic, learn spells, and battle through Hollow Lane, the Emberfall Wilds, the dragon-haunted Dragonspire Peaks, frozen Glacierreach, the floating islands of Stormspire, the giant forest of Thornwood and the underworld of the Hollow Deep in real-time fights, all the way to the Pale Magister himself.

## Play it

The game uses JavaScript modules, so it needs a tiny local web server. Opening `index.html` directly won't work. From this folder, run one of these:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000>.

To share it online, turn on **GitHub Pages** for this repo (Settings → Pages → Source: **GitHub Actions**). The workflow in `.github/workflows/pages.yml` publishes the game whenever `main` changes. It's a plain static site with no build step, and it can be installed to a phone's home screen.

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

- **Six schools:** Blaze 🔥, Frost ❄️, Tempest ⚡, Verdant 🌿, Umbral 💀 and Arcane ✨, each with its own health and 11 spells from level 1 to level 48 (ultimates like Phoenix Ascension and Cosmic Titan). Astral 🌙 support spells can be learned by everyone.
- **Real-time combat:** key `1` is your school's free basic attack (every third hit in a row is a combo strike), and keys `2`–`5` hold the spells you pick. Enemies wind up big attacks: **red shapes on the ground** show where they will land, so step out or dodge through them.
- **Seven chapters of story (51 quests) and an ending:** Hollow Lane (Lord Hollowmere), the Emberfall Wilds (Pyrrhon, the Molten King), the **Dragonspire Peaks**, where Vorathrax the Sky Tyrant flies above the battlefield and rains fire until you shout her down, and **Glacierreach**: the snowy town of Frostholm, the frozen Mirror Lake, the Rime Caverns and Queen Sylvara's ice castle under the northern lights, and **Stormspire**: floating islands joined by rope bridges over a sea of clouds, sky pirates, airships, and Voltaris the Storm Herald, a giant thunderbird who flies into the storm and rains lightning, and **Thornwood**: a forest of colossal trees, the root-house village of Greenhollow, a glowing mushroom hollow, and the blighted Thornmother, whose seed pods heal her until you cut them down. The finale is the **Hollow Deep**: rivers of souls, the Deathless Legion, echoes of the bosses you beat, and a four-phase battle with **Malvoren, the Pale Magister** (a ward held by soul anchors, a flight phase, and the Unmaking), followed by an ending and credits.
- **Conversations and choices:** ask the people you meet about the world ("Ask about…"), and make three big decisions (the Frozen Queen's fate, the Skyraiders, the Heartwood) that change your rewards and how the ending reads.
- **Dragon shouts:** learn the Voice, read Word Walls to learn six shouts (Unrelenting Force, Fire Breath, Frost Breath, Whirlwind Sprint, Become Ethereal, Dragonrend), and absorb dragon souls to unlock their deeper words.
- **Skills (RuneScape style):** Mining, Woodcutting, Fishing, Foraging, Cooking, Smithing, Alchemy, Woodworking and Slayer, each from level 1 to 99. Gather in Millbrook Meadow and beyond (up to Stormglass and Voidstone veins, Heartwood trees, cloud-fishing off Skyport and soul-fishing in the Hollow Deep), then craft bars, tools, food, potions, elixirs, amulets, wands and staffs at crafting stations, all the way to the level-95 Heartwood Greatstaff.
- **The Hollow Undercroft (dungeon):** a hand-built dungeon under Hollow Lane with puzzles (a lever, a rune-plate memory puzzle, a mirror-and-light-beam puzzle), a locked guard hall with elite waves, a swinging-blade gauntlet, and Morvain the Pale Warden, whose ward you break by shattering soul pylons. It scales to your level, has a Heroic mode, best times, and the Warden's gear set.
- **The Endless Rift (roguelike):** a dungeon that is different every run, with shrines that grant boons, chests, traps, merchants, elites and a guardian boss every 5 floors. Spend Rift Shards on permanent upgrades.
- **Your Homestead (Minecraft style):** a floating island where you build anything from 14 kinds of crafted blocks (wood, stone, brick, glass, lanterns, crystal, gold, dragonscale and more), with a ghost preview and step-up walking, plus your own crafting stations.
- **Gear sets, a bank and a second school:** thirteen gear sets with 2-, 3-, 4- and 6-piece bonuses, the Starfall Bank (plus a vault at your Homestead), and a second school of magic from level 10.
- **Gear, pets and side quests:** 90 gear pieces (drops, shops and crafting), 12 pets, 19 side quests (the Gatherers' Guild chain plus three in each of the four newest lands), and a quest journal.
- **Journal, Bestiary, Achievements and titles:** a bestiary with lore and hunter bonuses, 62 achievements, and titles like "the Dragonborn" or "the Rift Walker".
- **Slayer (a 9th skill):** kill assignments from Slayer Master Grimm, streaks, Slayer Points and slayer gear.
- **Companions:** hire one of six wizards from other schools to fight, heal, shield or buff at your side.
- **The Arena of Stars:** duel 13 rival wizards across five ranks (Bronze to Starfall Champion) for gold, Arena Tokens and gladiator gear, in a colosseum with a cheering crowd.
- **Mounts and fast travel:** seven mounts (Starfall Steed, Dire Wolf, Emberback, Frost Elk, Void Stalker, Sky Drake, Pale Nightmare), waystones across the world, and a World Atlas to fast-travel between them.
- **Day and night, weather:** a 15-minute day with a moving sun and moon, starry nights with night-only spirits and bonus XP, rain, thunderstorms, snow, blizzards and ashfall.
- **Endgame:** a level cap of 50, then up to 100 Archmage ranks; optional **world scaling** (Skyrim style) so every land keeps up with you; **New Game+** that restarts the story with everything you own against tougher, better-paying foes; and three **weekly challenges** every Monday.
- **Difficulty:** Normal, Heroic or Legendary.
- **Quality of life:** three save slots with export and import, a settings menu (volume, graphics quality, modern or classic controls, rebindable keys), a minimap, generated music, and a touch joystick on phones.
- **Accessibility:** a text and menu size slider, a colour-blind friendly mode (amber danger zones, striped health bars), reduce motion (no shake, hit-pause or flashes), and optional damage numbers.

## Code layout

```
index.html        page shell, HUD and title screen
css/style.css     all styling
src/data.js       ⭐ game content: schools, spells, enemies, NPCs, quests (start here to tweak!)
src/items.js      materials, food, potions and tools
src/skills.js     the 8 gathering/crafting skills, resource nodes and recipes
src/sidequests.js side quests (the Gatherers' Guild and more)
src/rift.js       the Endless Rift: floor generation, boons, upgrades
src/dungeon.js    the Hollow Undercroft: puzzles, gates, traps and the Pale Warden
src/shouts.js     dragon shouts
src/homestead.js  building with blocks on your floating island
src/gear.js       item rarities, bonus stats and legendary powers
src/talents.js    talent trees for every school
src/sky.js        day/night cycle and weather
src/achievements.js  the bestiary lore and achievements
src/slayer.js     Slayer tasks
src/companions.js hireable companions
src/arena.js      the Arena of Stars and rival wizards
src/challenges.js weekly challenges
src/lore.js       conversation topics and story choices
src/settings.js   settings and key bindings
src/state.js      player stats, levelling, quests, save/load
src/world.js      3D world (Three.js): map, movement, camera, enemies, spell effects
src/models.js     toon-shaded models built from code (outlines, faces, merging)
src/combat.js     real-time combat: spells, dodging, enemy AI, pets, boss phases
src/maps.js       Millbrook Meadow, Emberfall, Dragonspire, Glacierreach, Stormspire, Thornwood, the Hollow Deep and the Word Walls
src/skilling.js   the gathering loop
src/ui_*.js       windows for skills, the Rift and shouts
src/minimap.js    corner minimap
src/audio.js      synthesized sound effects and music
src/ui.js         dialogue, menus, cards
src/main.js       ties everything together
lib/              vendored Three.js (MIT licence)
gallery.html      model gallery: preview every model (?group=foes1, ?group=frost, ?group=storm, ?group=thorn, ?group=deep, ?model=knight)
.github/workflows GitHub Pages deploy
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
