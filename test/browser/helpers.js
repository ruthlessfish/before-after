import { afterEach } from 'vitest';
import '../../lib/main.js';

const mounted = new Set();

afterEach(() => {
  for (const el of mounted) el.remove();
  mounted.clear();
});

/**
 * Create and connect a <before-after>. Given an explicit box, because the
 * element is `display: block` with no intrinsic size and pointer math bails
 * out on a zero-area frame.
 */
export function mount({ size = [400, 200], html = '', ...attrs } = {}) {
  const el = document.createElement('before-after');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    el.setAttribute(name, value === true ? '' : String(value));
  }
  if (html) el.innerHTML = html;
  if (size) {
    el.style.width = `${size[0]}px`;
    el.style.height = `${size[1]}px`;
  }
  document.body.append(el);
  mounted.add(el);
  return el;
}

/** The shadow internals the tests need to poke at. */
export function parts(el) {
  const root = el.shadowRoot;
  return {
    root,
    frame: root.querySelector('.frame'),
    rail: root.querySelector('.rail'),
    handle: root.querySelector('.handle'),
    line: root.querySelector('.line'),
    before: root.querySelector('.pane.before'),
    after: root.querySelector('.pane.after'),
    img: {
      before: root.querySelector('img.before'),
      after: root.querySelector('img.after'),
    },
    chip: {
      before: root.querySelector('.label.before'),
      after: root.querySelector('.label.after'),
    },
  };
}

/**
 * The divider position as the CSS sees it. This is the real positioning
 * contract -- `clip-path` and the rail offset are both derived from it, and
 * unlike them it is not subject to the 180ms transition.
 */
export function cssPosition(el) {
  const raw = parts(el).frame.style.getPropertyValue('--_p');
  return raw === '' ? null : parseFloat(raw);
}

/** Record every `input`/`change` the element emits. */
export function listen(el) {
  const log = [];
  for (const type of ['input', 'change']) {
    el.addEventListener(type, (e) => log.push({ type, value: e.detail.value }));
  }
  return {
    log,
    get types() { return log.map((e) => e.type); },
    get values() { return log.map((e) => e.value); },
    of(type) { return log.filter((e) => e.type === type); },
    clear() { log.length = 0; },
  };
}

let nextPointerId = 1;

/**
 * Dispatch a pointer gesture. `pointerdown` has to be aimed at a real element
 * so that `composedPath()` reflects where the press landed -- the `grab`
 * check depends on whether the rail is in that path. Later events go to the
 * frame, which is where the listeners live and where a real browser would
 * retarget them once pointer capture is taken.
 */
export function pointer(el, target) {
  const { frame } = parts(el);
  const pointerId = nextPointerId++;

  const send = (type, node, { x = 0, y = 0, button = 0, pointerType = 'mouse' } = {}) => {
    node.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerId,
      button,
      pointerType,
    }));
  };

  return {
    down(at, opts) { send('pointerdown', target, { ...at, ...opts }); return this; },
    move(at) { send('pointermove', frame, at); return this; },
    up(at = {}) { send('pointerup', frame, at); return this; },
    cancel(at = {}) { send('pointercancel', frame, at); return this; },
  };
}

/** Viewport coordinates for a fraction (0..1) across the element's frame. */
export function at(el, fraction, axis = 'x') {
  const box = parts(el).frame.getBoundingClientRect();
  return axis === 'y'
    ? { x: box.left + box.width / 2, y: box.top + box.height * fraction }
    : { x: box.left + box.width * fraction, y: box.top + box.height / 2 };
}

export function key(el, k, type = 'keydown') {
  parts(el).handle.dispatchEvent(new KeyboardEvent(type, {
    key: k, bubbles: true, composed: true, cancelable: true,
  }));
}

/** A full press-and-release, which is what actually produces a `change`. */
export function press(el, k) {
  key(el, k, 'keydown');
  key(el, k, 'keyup');
}

/** A real raster image of known dimensions, for aspect-ratio inference. */
export function imageUrl(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas.toDataURL('image/png');
}
