import { describe, expect, it } from 'vitest';
import { at, key, listen, mount, parts, pointer, press } from './helpers.js';

describe('input', () => {
  it('fires on every arrow key press', () => {
    const el = mount();
    const events = listen(el);
    key(el, 'ArrowRight');
    key(el, 'ArrowRight');
    expect(events.of('input').map((e) => e.value)).toEqual([51, 52]);
  });

  it('fires on every step of a drag', () => {
    const el = mount();
    const events = listen(el);
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    drag.move(at(el, 0.6));
    drag.move(at(el, 0.7));
    expect(events.of('input')).toHaveLength(2);
  });

  it('carries the position in detail.value', () => {
    const el = mount();
    const events = listen(el);
    key(el, 'End');
    expect(events.of('input')[0].value).toBe(100);
  });

  it('does not fire when the position did not actually change', () => {
    const el = mount({ value: 40 });
    const events = listen(el);
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.4));
    drag.move(at(el, 0.4));
    expect(events.of('input')).toHaveLength(0);
  });

  it('does not fire when the value property is set', () => {
    const el = mount();
    const events = listen(el);
    el.value = 20;
    expect(events.types).toEqual([]);
  });

  it('does not fire when the value attribute is set', () => {
    const el = mount();
    const events = listen(el);
    el.setAttribute('value', '20');
    expect(events.types).toEqual([]);
  });
});

describe('change', () => {
  it('fires once when a drag ends', () => {
    const el = mount();
    const events = listen(el);
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    drag.move(at(el, 0.6));
    drag.move(at(el, 0.7));
    drag.up();
    expect(events.of('change')).toHaveLength(1);
  });

  it('reports the final position, not an intermediate one', () => {
    const el = mount();
    const events = listen(el);
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    drag.move(at(el, 0.9));
    drag.up();
    expect(events.of('change')[0].value).toBeCloseTo(90, 5);
  });

  it('fires after the last input, not before', () => {
    const el = mount();
    const events = listen(el);
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.7));
    drag.up();
    expect(events.types.at(-1)).toBe('change');
  });

  it('fires when a key is released', () => {
    const el = mount();
    const events = listen(el);
    press(el, 'ArrowRight');
    expect(events.types).toEqual(['input', 'change']);
  });

  it('fires once for a held key that repeated, not once per repeat', () => {
    const el = mount();
    const events = listen(el);
    key(el, 'ArrowRight');
    key(el, 'ArrowRight');
    key(el, 'ArrowRight');
    key(el, 'ArrowRight', 'keyup');
    expect(events.of('input')).toHaveLength(3);
    expect(events.of('change')).toHaveLength(1);
  });

  it('does not fire for a gesture that never moved the divider', () => {
    const el = mount({ value: 40 });
    const events = listen(el);
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.4));
    drag.up();
    expect(events.of('change')).toHaveLength(0);
  });

  it('does not fire for an arrow press that was already at the bound', () => {
    const el = mount({ value: 0 });
    const events = listen(el);
    press(el, 'ArrowLeft');
    expect(events.of('change')).toHaveLength(0);
  });

  it('does not fire twice when a second gesture moved nothing', () => {
    const el = mount();
    const events = listen(el);
    press(el, 'ArrowRight');
    events.clear();
    press(el, 'End');
    events.clear();
    press(el, 'End');
    expect(events.types).toEqual([]);
  });

  it('fires when a drag is cancelled mid-gesture', () => {
    const el = mount();
    const events = listen(el);
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.8));
    drag.cancel();
    expect(events.of('change')).toHaveLength(1);
  });
});

describe('event plumbing', () => {
  it.each(['input', 'change'])('%s escapes the shadow root and bubbles', (type) => {
    const el = mount();
    const seen: Event[] = [];
    document.body.addEventListener(type, (e) => seen.push(e));
    press(el, 'ArrowRight');
    expect(seen).toHaveLength(1);
    expect(seen[0].bubbles).toBe(true);
    expect(seen[0].composed).toBe(true);
    expect(seen[0].target).toBe(el);
  });
});
