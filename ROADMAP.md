# DarQuest Roadmap

The plan to take DarQuest from a two-chapter demo to a full RPG. Each phase ends with a playable, pushed build.

## Where it stands now

Built so far (see the README for the full feature list):

- **Seven story chapters, 51 main quests, 9 bosses and an ending:** Starfall Academy and Hollow Lane, the Emberfall Wilds, the Dragonspire Peaks (Vorathrax), Glacierreach (Queen Sylvara), Stormspire (Voltaris), Thornwood (the Thornmother) and the Hollow Deep (Malvoren, the Pale Magister, with echoes of earlier bosses), plus the Hollow Undercroft dungeon.
- **Real-time combat:** 6 schools, 100+ spells, dodging, combos, ground telegraphs, flying and summoning bosses, and six dragon shouts.
- **RPG depth:** talent trees (3 branches per school), gear rarities with random bonus stats and legendary powers, 8 gear slots, 9 pets, companions.
- **RuneScape-style skills:** 9 skills from 1 to 99, gathering nodes, crafting stations and recipes.
- **Roguelike and endgame:** the Endless Rift with boons and permanent upgrades, the Arena of Stars, Slayer tasks.
- **World systems:** day/night with weather, mounts, waystones and fast travel, a Minecraft-style Homestead, a bestiary, 45 achievements and titles.
- **Shipping:** save slots, settings and rebindable keys, a GitHub Pages workflow and an installable web manifest.
- **Still to tune:** balance. It has only been tested in a slow headless browser, not played by hand.

### Progress by phase

| Phase | Status |
| --- | --- |
| 1. Solid foundation | ✅ Done (settings, key binding, save slots, telegraphs, combat feel) |
| 2. RPG depth | ✅ Talents, gear rarity, crafting, a secondary school, gear set bonuses, a bank |
| 3. World and story | ✅ Seven lands, 51 main quests, a finale and an ending. Possible extras: branching dialogue, more side quests |
| 4. Dungeons and bosses | ✅ The Endless Rift, and the Hollow Undercroft: puzzles, traps, elites, a ward-and-pylon boss, Heroic mode. More dungeons can follow the same pattern |
| 5. Companions and systems | ✅ Companions, mounts, bestiary, achievements, titles, housing (Homestead) |
| 6. Endgame | ✅ Level cap 50 with Archmage ranks, world scaling, New Game+, weekly challenges, the Arena and Slayer |
| 7. Presentation | 🟡 Per-zone music, weather, aurora, accessibility (text size, colour-blind mode, reduce motion). Still to do: more animation |
| 8. Ship it | 🟡 Pages workflow and manifest ready. Turn on Pages in the repo settings |
| 9. Multiplayer | ⬜ Not started |

## The vision

A cozy-looking but deep wizard RPG. You master one school of magic and dabble in others. You travel between worlds through Spiral Doors, clear dungeons, collect gear and pets, and follow a main story from apprentice to archmage. Level cap 50, with about 20–30 hours of content.

## Phase 1: Solid foundation

- **Combat tuning:** damage, cooldowns, enemy speed and mana costs, with hit sounds, knockback and a combo feel.
- **Settings menu:** remappable keys, volume sliders, graphics quality (so it runs on weak laptops), and a virtual joystick for phones.
- **Saves:** 3 save slots, plus export and import of your save file.
- **Tutorial:** a short opening quest that teaches moving, attacking, dodging and the spellbook.
- **Fixes:** bug and performance passes.

## Phase 2: RPG depth

- **Stats and talent trees:** each school gets a talent tree with 3 branches (for example Blaze: Inferno, Phoenix and Ember-Knight). You earn a point every level.
- **Secondary school:** at level 10 you pick a second school and can learn some of its spells.
- **Gear overhaul:** rarity tiers from common to legendary, random bonus stats, set bonuses, 8 gear slots, and a sortable inventory with item comparison tooltips.
- **Crafting:** gather reagents from nodes and enemies, then craft potions, scrolls and gear at a workbench.
- **Economy:** item prices, a sell-junk button, and a bank.

## Phase 3: A real world and story

- **Six worlds**, one per school, each with a town, 2–3 outdoor areas and a boss:

| World | School | Theme |
| --- | --- | --- |
| Starfall Academy | Arcane | Hub |
| Emberfall | Blaze | Volcano |
| Glacierreach | Frost | Ice city |
| Stormspire | Tempest | Floating islands |
| Thornwood | Verdant | Giant forest |
| The Hollow Deep | Umbral | Underworld |

- **Main story:** about 60 quests across 6 chapters, with a recurring villain behind Hollowmere and Pyrrhon.
- **Side content:** optional quests, collectibles and hidden areas.
- **Dialogue:** branching conversations with choices, a quest journal, and simple cutscenes with camera moves.
- **Travel:** a world map with fast travel through Spiral Doors, and a day/night cycle.

## Phase 4: Dungeons and bosses

- **Dungeons:** one or two per world, each with rooms, traps, puzzles (like levers and light beams), and elites with special abilities.
- **Boss mechanics:** things you dodge on the floor, adds to kill, and shields to break.
- **Loot:** tables with guaranteed drops per boss, plus rare dungeon sets.
- **Heroic versions** of each dungeon for endgame.

## Phase 5: Companions and systems

- **Companions:** hire an NPC wizard from another school to fight beside you, with simple orders.
- **Pets:** pets level up, learn new tricks, and can be trained.
- **Mounts:** faster travel between towns.
- **Collections:** a bestiary that fills in as you defeat enemies, achievements, and titles.
- **Housing:** your own dorm room to decorate with furniture you find.

## Phase 6: Endgame

- **Level cap 50**, with endgame gear and talents.
- **Tower of Trials:** endless floors with a leaderboard of your best runs.
- **Arena:** duel AI rival wizards for ranks and rewards.
- **Weekly challenges**, and **New Game+** that keeps your gear with tougher enemies.

## Phase 7: Presentation

- **Animation:** proper character animation (cast, hit, run and death poses), and optionally real 3D art in glTF format replacing the shapes built in code.
- **Audio:** one music theme per world, plus richer spell effects and sound.
- **Polish:** UI polish, accessibility options (colourblind mode, text size), and loading screens.

## Phase 8: Ship it

- **Publish:** put it on GitHub Pages or itch.io so anyone can play from a link.
- **Playtesting:** a feedback round with friends, and a balance spreadsheet.

## Phase 9 (optional): Multiplayer

- A small server so friends can see each other in towns and team up for dungeons. This is a big step: it needs hosting and a backend.

## Suggested order

Phase 1 → 2 → 3 (one world at a time) → 4 → 5 → 6 → 7 → 8. Phase 1 matters most, because every later system builds on combat that feels good. Phase 3 is the biggest; each new world is roughly one big session of work.
