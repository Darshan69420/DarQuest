# DarQuest: world RPG + roguelike roadmap

## Direction

Build a third-person fantasy RPG with the sense of place, discovery, quests and character identity that players enjoy in open-world games. Add repeatable runs with changing encounters and temporary builds so exploration stays interesting after the main story. Use original characters, places, art, music and mechanics.

Keep two different rhythms: persistent **adventure** progress (level, story, gear, spells, pets) and temporary **run** progress (random targets, chosen boons, escalating danger). A failed run clears its temporary power, while the character and story remain intact.

## Current playable foundation

- Two hand-built zones, 14 quests, combat, six schools, equipment, pets, difficulty settings and browser saves.
- One-use spell scrolls available through drops and a shop, plus Astral Pulse, a close-range area spell learnable by every school. Two rideable stags bought at the academy, with faster travel and automatic combat dismount. Magic cast sigils add a short readable anticipation cue.
- Rift Contracts: talk to Vale at Starfall Academy. Complete three stages against enemies in a chosen unlocked zone; choose one of three offered boons before each stage. Targets deal 15% more damage per stage. Return for a payout after stage three, or lose the temporary boons on defeat. A run resumes after reload.
- The Rift system is **not** a generated dungeon yet. It uses existing maps and enemies. That is the next substantial game feature.

## Next milestones and acceptance criteria

| Order | Feature | Playable acceptance criteria | Quality gate |
| --- | --- | --- | --- |
| 1 | Movement and camera | Strafing, sprinting and a clear interact prompt work with keyboard, mouse and touch. Mount animation and camera remain readable around narrow paths. | Play from new game to first fight on desktop and narrow mobile viewport; no stuck movement or unreadable HUD. |
| 2 | First dungeon | A portal leads to a small, seeded dungeon with a sequence of rooms, encounters, a rest choice and a final guardian. Exits return to the world. | Same seed produces the same room sequence; every room has a walkable path; reloading safely restores or abandons the run. |
| 3 | Run variety | Enemy groups, room events and two mutually exclusive rewards change the next decision. Builds have visible strengths and limits. | Simulate at least 1,000 seeds; no impossible enemy or room combination; verify reward caps and death cleanup. |
| 4 | World agency | One new settlement, explorable side areas, NPC schedules or reactions, and at least one quest with a meaningful choice and consequence. | Save/load both outcomes; every branch reaches a conclusion; optional path is signposted in game. |
| 5 | Character depth | Small skill trees for the six schools, equipment comparisons, crafting materials and a respec path. | Each build can clear a standard run; tooltips match the damage calculations; old saves migrate. |
| 6 | Presentation and release | Replace key procedural models with original animated assets, add settings and accessibility options, then publish a stable web build. | Performance budget and device coverage below; no errors in a complete chapter and dungeon run. |

Milestones are ordered to keep each release playable. Complete the dungeon prototype before adding more enemy counts or more story chapters.

## Dungeon design for milestone 2

Start with **The Shattered Archive**, an academy portal that appears after Hollow Lane. A seed chooses a short route: entrance, two combat rooms, one event or rest room, a guardian, exit. Each room uses authored geometry pieces assembled in a valid graph. A run modifier changes encounter rules, not just enemy health. Rewards are offered between rooms and removed on death. The final guardian pays persistent XP, gold and one modest item chance. Limit a run to around 15–25 minutes.

The technical boundary: `src/rifts.js` owns the run data and deterministic choices; a new dungeon map module owns room geometry and collision; combat only reads a narrow run modifier interface. Store the seed and room index, never every generated mesh. Keep save migration centralized in `src/state.js`.

## Quality checks

Run `npm run check` for contract state tests and content references. Before shipping a milestone, also check:

1. **New and old saves:** begin a new character; continue an older save; reload during each run stage; claim once; abandon; die; reset.
2. **Progression:** story quest and Rift target can count from the same kill; locked Emberfall stays locked; rewards do not repeat on reload; temporary stats leave after the run.
3. **Controls and UI:** keyboard, mouse and touch can open the Riftkeeper dialogue, choose boons and reach the target; small screens display both story and run progress.
4. **Combat balance:** try each school at early and late levels; verify resistance, heals, haste and stage danger affect the actual numbers; tune reward rate against story quests.
5. **Performance:** measure frame pacing during a boss fight with pet, labels and spell effects. Target 60 fps on an ordinary desktop and a stable 30 fps on a midrange phone with graphics settings if needed.
6. **Release:** verify a static server and hosted URL load all modules; check browser console, save recovery, WebGL fallback messaging and original asset licenses.
7. **Travel and magic:** buy and equip both stags; mount and dismount on both sides of a portal; engage an enemy while mounted; cast a self scroll without mana; attempt an attack scroll without a target; verify scroll caps and reloads.

## Reference notes

- [Hades development notes from Supergiant](https://www.supergiantgames.com/blog/hades-the-nighty-night-update-patch-notes/) discuss keeping combat effects readable during fast encounters. DarQuest uses brief ground sigils before casts so spell color is recognizable without covering the target.
- [Skyrim's official launch details](https://elderscrolls.bethesda.net/en-US/news/4cHsGJ5fssgCaAUEwaMAWO/the-elder-scrolls-v-skyrim-vr-and-skyrim-for-nintendo-switch-launch-details) include horseback travel in the world. DarQuest mounts are original stags built from its toon shapes, used for travel between fights.
- [Diablo IV's official site](https://diablo4.blizzard.com/) describes mounts as part of world traversal and persistent progression. DarQuest keeps mount ownership across reloads while dismounting for combat.
- Hades' [boons and upgrades](https://www.supergiantgames.com/blog/gear-up-for-the-high-speed-update/) inform the temporary build choices in Rift Contracts. DarQuest's characters and art remain original.

## Guardrails for scope

No multiplayer until the single-player dungeon, saves and combat balance are stable. A multiplayer server changes authority, cheating, state sync, accounts and hosting cost. A huge seamless map can follow smaller zones once encounter density and performance hold up. Keep the game fun in one room before adding a whole continent.
