// Taps that iOS Safari (iPad, iPhone) would otherwise swallow.
//
// When a tap begins, iOS first sends the page a hover and waits a moment. If anything on
// the page changes in that moment, it decides the tap was meant as a hover: the button only
// shows its :hover / focus look, and no click follows. While a song plays the page changes
// every frame (the playing-position marks, channel view, scope), so most taps were lost.
//
// Here a short, still tap on a control is turned into its click at touchend (which iOS
// counts as a user action, so sound, file pickers and the keyboard still open), and the
// click iOS may send afterwards for the same tap is dropped so nothing happens twice.

const TAPPABLE = 'button, summary, a[href], label, [role="button"], input[type="checkbox"], input[type="radio"]';
const SLOP = 10;      // px a finger may move and still tap
const LONG = 700;     // ms; a longer press is left to the browser
const ECHO = 800;     // ms during which the browser's own click for the tap is dropped

export function installTouchTaps(target = window) {
  let down = null;    // { el, x, y, t } of the touch in progress
  let tapped = null;  // { x, y, t } of the last tap turned into a click

  target.addEventListener('touchstart', (e) => {
    const touch = e.touches.length === 1 ? e.touches[0] : null;
    const el = touch && e.target.closest?.(TAPPABLE);
    down = el && !el.disabled ? { el, x: touch.clientX, y: touch.clientY, t: e.timeStamp } : null;
  }, { capture: true, passive: true });

  target.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (down && (!touch || Math.hypot(touch.clientX - down.x, touch.clientY - down.y) > SLOP)) down = null;
  }, { capture: true, passive: true });

  target.addEventListener('touchcancel', () => { down = null; }, { capture: true, passive: true });

  target.addEventListener('touchend', (e) => {
    const d = down;
    down = null;
    if (!d || e.touches.length || e.timeStamp - d.t > LONG) return;
    const touch = e.changedTouches[0];
    if (!touch || Math.hypot(touch.clientX - d.x, touch.clientY - d.y) > SLOP) return;
    if (d.el.disabled || !d.el.isConnected) return;
    tapped = { x: touch.clientX, y: touch.clientY, t: performance.now() };
    d.el.click();
  }, { capture: true, passive: true });

  // The browser's click for the same tap, if it still comes: on the control that was just
  // pressed, or on whatever the press opened under the finger.
  target.addEventListener('click', (e) => {
    if (!tapped || !e.isTrusted) return;
    const late = performance.now() - tapped.t > ECHO;
    const here = Math.hypot(e.clientX - tapped.x, e.clientY - tapped.y) <= SLOP * 3;
    if (late || here) tapped = null;
    if (!late && here) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
}
