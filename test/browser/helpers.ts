import { afterEach } from 'vitest';
import '../../lib/main.js';

const mounted = new Set<Element>();

afterEach(() => {
  for (const el of mounted) el.remove();
  mounted.clear();
});

/** Like the component's own lookup: a missing node is a broken template, not a state. */
function q<T extends Element>(root: ParentNode, sel: string): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`test helper: no ${sel}`);
  return el;
}

type MountOptions = {
  size?: [number, number] | null;
  html?: string;
} & Record<string, unknown>;

/**
 * Create and connect a <before-after>. Given an explicit box, because the
 * element is `display: block` with no intrinsic size and pointer math bails
 * out on a zero-area frame.
 */
export function mount({ size = [400, 200], html = '', ...attrs }: MountOptions = {}) {
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
export function parts(el: Element) {
  const root = el.shadowRoot;
  if (!root) throw new Error('test helper: element has no shadow root');
  return {
    root,
    frame: q<HTMLDivElement>(root, '.frame'),
    rail: q<HTMLDivElement>(root, '.rail'),
    handle: q<HTMLButtonElement>(root, '.handle'),
    line: q<HTMLSpanElement>(root, '.line'),
    before: q<HTMLDivElement>(root, '.pane.before'),
    after: q<HTMLDivElement>(root, '.pane.after'),
    img: {
      before: q<HTMLImageElement>(root, 'img.before'),
      after: q<HTMLImageElement>(root, 'img.after'),
    },
    chip: {
      before: q<HTMLSpanElement>(root, '.label.before'),
      after: q<HTMLSpanElement>(root, '.label.after'),
    },
  };
}

/**
 * The divider position as the CSS sees it. This is the real positioning
 * contract -- `clip-path` and the rail offset are both derived from it, and
 * unlike them it is not subject to the 180ms transition.
 */
export function cssPosition(el: Element) {
  const raw = parts(el).frame.style.getPropertyValue('--_p');
  return raw === '' ? null : parseFloat(raw);
}

type Emitted = { type: string; value: number };

/** Record every `input`/`change` the element emits. */
export function listen(el: Element) {
  const log: Emitted[] = [];
  for (const type of ['input', 'change']) {
    el.addEventListener(type, (e) => {
      log.push({ type, value: (e as CustomEvent<{ value: number }>).detail.value });
    });
  }
  return {
    log,
    get types() { return log.map((e) => e.type); },
    get values() { return log.map((e) => e.value); },
    of(type: string) { return log.filter((e) => e.type === type); },
    clear() { log.length = 0; },
  };
}

let nextPointerId = 1;

type Point = { x?: number; y?: number };
type SendOptions = Point & { button?: number; pointerType?: string };

/**
 * Dispatch a pointer gesture. `pointerdown` has to be aimed at a real element
 * so that `composedPath()` reflects where the press landed -- the `grab`
 * check depends on whether the rail is in that path. Later events go to the
 * frame, which is where the listeners live and where a real browser would
 * retarget them once pointer capture is taken.
 */
export function pointer(el: Element, target: Element | null) {
  if (!target) throw new Error('test helper: pointerdown needs a real target');
  const { frame } = parts(el);
  const pointerId = nextPointerId++;

  const send = (type: string, node: Element, { x = 0, y = 0, button = 0, pointerType = 'mouse' }: SendOptions = {}) => {
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
    down(at: Point, opts?: SendOptions) { send('pointerdown', target, { ...at, ...opts }); return this; },
    move(at: Point) { send('pointermove', frame, at); return this; },
    up(at: Point = {}) { send('pointerup', frame, at); return this; },
    cancel(at: Point = {}) { send('pointercancel', frame, at); return this; },
  };
}

/** Viewport coordinates for a fraction (0..1) across the element's frame. */
export function at(el: Element, fraction: number, axis: 'x' | 'y' = 'x') {
  const box = parts(el).frame.getBoundingClientRect();
  return axis === 'y'
    ? { x: box.left + box.width / 2, y: box.top + box.height * fraction }
    : { x: box.left + box.width * fraction, y: box.top + box.height / 2 };
}

export function key(el: Element, k: string, type = 'keydown') {
  parts(el).handle.dispatchEvent(new KeyboardEvent(type, {
    key: k, bubbles: true, composed: true, cancelable: true,
  }));
}

/** A full press-and-release, which is what actually produces a `change`. */
export function press(el: Element, k: string) {
  key(el, k, 'keydown');
  key(el, k, 'keyup');
}

/** A real raster image of known dimensions, for aspect-ratio inference. */
export function imageUrl(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas.toDataURL('image/png');
}
