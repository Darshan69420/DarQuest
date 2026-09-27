Original prompt: I want u to keep working and make the game better
Latest request: Go all out and make it 10/10

## Current focus

- Complete the roadmap's movement-and-camera milestone with camera-relative strafing, sprinting, clearer interaction guidance, fullscreen support, and deterministic browser-test hooks.
- Preserve existing click-to-move, mounts, combat dodge, and save compatibility.

## Baseline

- Continued from `codex/rift-contracts` at `11b95f5`.
- The prior suite reports 17 passing checks; rendered gameplay still needs local Playwright validation.

## Implemented

- Added camera-relative WASD movement with diagonal normalization and Shift sprint/gallop.
- Preserved classic arrow-key turning and click/tap pathing.
- Added fullscreen control (`V` and HUD button), updated onboarding/help, and exposed browser-test hooks.

## Validation

- `npm run check`: 17/17 tests pass; Rift and Archive seed/content validation passes.
- Playwright created a new Blaze character, dismissed onboarding, exercised walk, sprint and strafe input, and captured live academy gameplay with no browser console errors.
- Reviewed `work/playtest-movement-short/shot-0.png`: player, Headmaster quest marker, HUD, minimap, hotbar and fullscreen button are visible and unobstructed at 1280×720.

## Next suggestions

- Add a camera shoulder-swap/lock-on option, then playtest narrow Archive corridors and mounted turns.
- Continue milestone 4 with a choice-driven settlement quest after the movement pass is tested on a physical phone.

## This pass: touch play and camera reliability

- Added analog thumb-stick movement and hold-to-sprint for touch screens. The nearby interaction prompt is now tappable.
- Repositioned the narrow-screen quest card, sprint button and zone label to avoid overlap. Dialogues hide touch movement controls and clear held input.
- Fixed camera collapse when its look-ahead point crosses scenery near a valid player position.
- Corrected camera yaw while casting and backward/sideways dodge direction. Movement vectors now share one tested calculation.
- Capped phone render resolution and shadow map size to reduce GPU load on high-density touch devices.
- Browser checks at 390×844 and 1280×720 exercised movement, sprint, dodge input, interaction and dialogue; screenshots were inspected. A physical phone and a full Archive combat run remain open.
