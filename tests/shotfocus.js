// HUD with keyboard focus visible on a HUD button (for accessibility screenshots).
//   node tests/run.cjs tests/shotfocus.js --low --shot=hud-focus
await sleep(600); dq.UI.closeDialog();
const b = document.getElementById('btn-char');
b.focus();
await sleep(150);
log.push('focused: ' + (document.activeElement && document.activeElement.id) + ' matchesFocusVisible=' + b.matches(':focus-visible'));
