import { describe, expect, it } from 'vitest';
import { key, listen, mount, parts, press } from './helpers.js';

describe('arrow keys', () => {
  it.each([
    ['ArrowLeft', 49],
    ['ArrowUp', 49],
    ['ArrowRight', 51],
    ['ArrowDown', 51],
  ])('%s moves one step', (k, expected) => {
    const el = mount();
    key(el, k);
    expect(el.value).toBe(expected);
  });

  it('uses the step attribute', () => {
    const el = mount({ step: 5 });
    key(el, 'ArrowRight');
    expect(el.value).toBe(55);
  });

  it('accepts a fractional step', () => {
    const el = mount({ step: 0.5 });
    key(el, 'ArrowRight');
    expect(el.value).toBe(50.5);
  });

  it('picks up a step change made after mount', () => {
    const el = mount();
    el.setAttribute('step', '10');
    key(el, 'ArrowRight');
    expect(el.value).toBe(60);
  });
});

describe('page keys', () => {
  it('moves ten steps', () => {
    const el = mount();
    key(el, 'PageDown');
    expect(el.value).toBe(60);
    key(el, 'PageUp');
    expect(el.value).toBe(50);
  });

  it('scales with the step attribute', () => {
    const el = mount({ step: 2 });
    key(el, 'PageDown');
    expect(el.value).toBe(70);
  });
});

describe('home and end', () => {
  it('jumps to the extremes regardless of step', () => {
    const el = mount({ step: 7 });
    key(el, 'Home');
    expect(el.value).toBe(0);
    key(el, 'End');
    expect(el.value).toBe(100);
  });
});

describe('bounds', () => {
  it('stops at 100 rather than overshooting', () => {
    const el = mount({ value: 98, step: 5 });
    key(el, 'ArrowRight');
    expect(el.value).toBe(100);
  });

  it('stops at 0 rather than undershooting', () => {
    const el = mount({ value: 2, step: 5 });
    key(el, 'ArrowLeft');
    expect(el.value).toBe(0);
  });

  it('emits nothing when already pinned at the bound', () => {
    const el = mount({ value: 100 });
    const events = listen(el);
    press(el, 'ArrowRight');
    expect(events.types).toEqual([]);
  });
});

describe('unhandled keys', () => {
  it.each(['a', 'Enter', ' ', 'Tab', 'Escape'])('ignores %s', (k) => {
    const el = mount();
    const events = listen(el);
    press(el, k);
    expect(el.value).toBe(50);
    expect(events.types).toEqual([]);
  });

  it('leaves the default action alone for keys it ignores', () => {
    const el = mount();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab', bubbles: true, composed: true, cancelable: true,
    });
    parts(el).handle.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('prevents the default action for keys it handles, so the page does not scroll', () => {
    const el = mount();
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight', bubbles: true, composed: true, cancelable: true,
    });
    parts(el).handle.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('when disabled', () => {
  it('does not move', () => {
    const el = mount({ disabled: true });
    key(el, 'ArrowRight');
    key(el, 'End');
    expect(el.value).toBe(50);
  });

  it('emits nothing', () => {
    const el = mount({ disabled: true });
    const events = listen(el);
    press(el, 'ArrowRight');
    expect(events.types).toEqual([]);
  });

  it('moves again once re-enabled', () => {
    const el = mount({ disabled: true });
    el.disabled = false;
    key(el, 'ArrowRight');
    expect(el.value).toBe(51);
  });
});

describe('focus ring', () => {
  it('is suppressed for focus taken by a drag', () => {
    const el = mount();
    const { rail, handle } = parts(el);
    rail.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, composed: true, cancelable: true, clientX: 0, clientY: 0, pointerId: 77,
    }));
    expect(handle.classList.contains('by-pointer')).toBe(true);
  });

  it('comes back as soon as the keyboard is used', () => {
    const el = mount();
    const { rail, handle } = parts(el);
    rail.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, composed: true, cancelable: true, clientX: 0, clientY: 0, pointerId: 78,
    }));
    key(el, 'ArrowRight');
    expect(handle.classList.contains('by-pointer')).toBe(false);
  });

  it('is reset on blur', () => {
    const el = mount();
    const { rail, handle } = parts(el);
    rail.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, composed: true, cancelable: true, clientX: 0, clientY: 0, pointerId: 79,
    }));
    handle.dispatchEvent(new FocusEvent('blur'));
    expect(handle.classList.contains('by-pointer')).toBe(false);
  });
});
