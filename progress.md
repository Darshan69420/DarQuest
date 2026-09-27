Original prompt: I want u to keep working and make the game better

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

- Add a dedicated virtual joystick and sprint toggle for players who prefer direct touch movement over tap-to-move.
- Add a camera shoulder-swap/lock-on option, then playtest narrow Archive corridors and mounted turns.
- Continue milestone 4 with a choice-driven settlement quest after the movement pass is tested on a physical phone.
