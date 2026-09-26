# DarQuest playtest log

## 2026-09-26: Shattered Archive route

**Result:** scripted progression and static HTTP checks pass. A rendered browser playthrough remains open. The cloud browser rejected local HTTP with `ERR_BLOCKED_BY_CLIENT` before the game loaded, so there are no genuine gameplay screenshots yet. The [route diagram](archive-route.svg) shows the current chamber sequence from source data and is labeled as a diagram.

### Checks completed

- `npm run check`: 17 passing tests, including 1,200 seeded four-room runs, exact foe restoration, one-time rewards, Folio decisions, Rune cleanup and the combat values for encounter rules.
- Static server returned HTTP 200 for the page, game modules, stylesheet and route diagram.
- Found and fixed missing retreat paths: all four chambers now have a reachable Return Gate.
- Archive enemies no longer advance unrelated story objectives or Rift Contracts.

### Browser session still needed

1. Start a new character, finish Hollow Lane and enter the Archive Gate in the courtyard. Capture the gate and first combat chamber.
2. Clear two encounter rooms with keyboard and touch controls. Check foe positions, door prompts, telegraphs, target selection, labels and camera clipping. Capture a fight.
3. Reload after defeating the second foe first. Check that only the untouched foe returns and that XP, gold and item drops do not repeat.
4. After the second fight, seal the Folio or take its secret in separate runs. Reload before choosing and after choosing; verify no reroll or repeated payout. Compare Curator health and damage. Capture the Folio choice.
5. In the Quiet Alcove, inspect all five dialog buttons on desktop and a narrow phone viewport. Choose each Rune across separate runs, then verify its stat change, save restoration and removal on a Return Gate, defeat and payout. Capture the choice screen.
6. Try every Return Gate. Confirm it lands in Starfall and the next run starts in chamber one.
7. Fight the Curator in all difficulties, dodge its cast and claim the payout once. Capture the guardian and post-run HUD.

### How to run locally

From the project root, run `python3 -m http.server 8000` and open `http://localhost:8000`. Use a browser with WebGL. Run `npm run check` after edits. The game stores a character in localStorage; use the title-screen reset control for a fresh save. Save any real screenshots in `docs/screenshots/` and document the browser and viewport used.
