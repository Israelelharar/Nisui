/**
 * A small physical tap under the finger. Android has navigator.vibrate; iPhone
 * Safari doesn't, but since iOS 17.4 toggling a native switch input plays the
 * system haptic, so on iPhone we click a hidden one. Must run inside a tap.
 */
let label: HTMLLabelElement | null = null;
let last = 0;

function iosSwitch() {
  if (label) return label;
  const l = document.createElement('label');
  l.setAttribute('aria-hidden', 'true');
  l.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  l.appendChild(input);
  document.body.appendChild(l);
  label = l;
  return l;
}

export const tap = (ms = 8) => {
  const now = performance.now();
  if (now - last < 45) return;
  last = now;
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
      return;
    }
    if (/iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) iosSwitch().click();
  } catch {
    /* unsupported */
  }
};
