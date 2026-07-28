import { describe, expect, it } from 'vitest';
import { at, listen, mount, parts, pointer } from './helpers.js';

describe('dragging', () => {
  it('jumps to where the press landed', () => {
    const el = mount();
    pointer(el, parts(el).rail).down(at(el, 0.25));
    expect(el.value).toBeCloseTo(25, 5);
  });

  it('tracks the pointer as it moves', () => {
    const el = mount();
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    drag.move(at(el, 0.75));
    expect(el.value).toBeCloseTo(75, 5);
    drag.move(at(el, 0.1));
    expect(el.value).toBeCloseTo(10, 5);
  });

  it('clamps a drag that leaves the frame', () => {
    const el = mount();
    const box = parts(el).frame.getBoundingClientRect();
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    drag.move({ x: box.right + 500, y: box.top });
    expect(el.value).toBe(100);
    drag.move({ x: box.left - 500, y: box.top });
    expect(el.value).toBe(0);
  });

  it('ignores movement before a press', () => {
    const el = mount();
    pointer(el, parts(el).rail).move(at(el, 0.9));
    expect(el.value).toBe(50);
  });

  it('stops tracking after release', () => {
    const el = mount();
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    drag.up(at(el, 0.5));
    drag.move(at(el, 0.9));
    expect(el.value).toBeCloseTo(50, 5);
  });

  it('stops tracking after the gesture is cancelled', () => {
    const el = mount();
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    drag.cancel();
    drag.move(at(el, 0.9));
    expect(el.value).toBeCloseTo(50, 5);
  });

  it('marks the frame while dragging, which is what suspends the transition', () => {
    const el = mount();
    const { frame, rail } = parts(el);
    const drag = pointer(el, rail);
    drag.down(at(el, 0.5));
    expect(frame.classList.contains('is-dragging')).toBe(true);
    drag.up();
    expect(frame.classList.contains('is-dragging')).toBe(false);
  });

  it('focuses the handle so the keyboard can take over', () => {
    const el = mount();
    const { rail, handle } = parts(el);
    pointer(el, rail).down(at(el, 0.5));
    expect(parts(el).root.activeElement).toBe(handle);
  });

  it('suppresses the native drag of slotted images', () => {
    const el = mount();
    const event = new Event('dragstart', { bubbles: true, cancelable: true });
    parts(el).handle.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('vertical orientation', () => {
  it('reads the position off the Y axis', () => {
    const el = mount({ orientation: 'vertical' });
    pointer(el, parts(el).rail).down(at(el, 0.25, 'y'));
    expect(el.value).toBeCloseTo(25, 5);
  });

  it('ignores horizontal movement', () => {
    const el = mount({ orientation: 'vertical' });
    const box = parts(el).frame.getBoundingClientRect();
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5, 'y'));
    drag.move({ x: box.right, y: box.top + box.height * 0.5 });
    expect(el.value).toBeCloseTo(50, 5);
  });
});

describe('grab', () => {
  const slotted = '<div slot="before" id="pane" style="height:200px"></div>';

  it('defaults to starting drags only from the handle', () => {
    const el = mount({ html: slotted });
    pointer(el, el.querySelector('#pane')).down(at(el, 0.2));
    expect(el.value).toBe(50);
  });

  it('starts from the rail under the default', () => {
    const el = mount({ html: slotted });
    pointer(el, parts(el).rail).down(at(el, 0.2));
    expect(el.value).toBeCloseTo(20, 5);
  });

  it('starts from the handle itself under the default', () => {
    const el = mount({ html: slotted });
    pointer(el, parts(el).handle).down(at(el, 0.2));
    expect(el.value).toBeCloseTo(20, 5);
  });

  it('starts from anywhere in the frame when asked to', () => {
    const el = mount({ html: slotted, grab: 'anywhere' });
    pointer(el, el.querySelector('#pane')).down(at(el, 0.2));
    expect(el.value).toBeCloseTo(20, 5);
  });

  it('leaves clicks on slotted controls alone under the default', () => {
    const el = mount({ html: '<div slot="before"><button id="cta">Go</button></div>' });
    const button = el.querySelector<HTMLButtonElement>('#cta')!;
    let clicked = false;
    button.addEventListener('click', () => { clicked = true; });
    const event = new PointerEvent('pointerdown', {
      bubbles: true, composed: true, cancelable: true, clientX: 0, clientY: 0, pointerId: 55,
    });
    button.dispatchEvent(event);
    button.click();
    expect(event.defaultPrevented).toBe(false);
    expect(clicked).toBe(true);
  });
});

describe('press filtering', () => {
  it('ignores secondary mouse buttons', () => {
    const el = mount();
    pointer(el, parts(el).rail).down(at(el, 0.2), { button: 2 });
    expect(el.value).toBe(50);
  });

  it('accepts a touch press', () => {
    const el = mount();
    pointer(el, parts(el).rail).down(at(el, 0.2), { pointerType: 'touch', button: -1 });
    expect(el.value).toBeCloseTo(20, 5);
  });

  it('does nothing while disabled', () => {
    const el = mount({ disabled: true });
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.2));
    drag.move(at(el, 0.9));
    expect(el.value).toBe(50);
  });

  it('emits nothing while disabled', () => {
    const el = mount({ disabled: true });
    const events = listen(el);
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.2));
    drag.up();
    expect(events.types).toEqual([]);
  });

  it('prevents the default action so text selection does not start', () => {
    const el = mount();
    const { rail } = parts(el);
    const event = new PointerEvent('pointerdown', {
      bubbles: true, composed: true, cancelable: true, clientX: 0, clientY: 0, pointerId: 56,
    });
    rail.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('a gesture interrupted by disconnection', () => {
  it('does not leave a drag running to be resumed on reconnect', () => {
    const el = mount();
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    el.remove();
    document.body.append(el);
    drag.move(at(el, 0.9));
    expect(el.value).toBeCloseTo(50, 5);
  });

  it('clears the dragging class, which would otherwise suspend the transition forever', () => {
    const el = mount();
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    el.remove();
    expect(parts(el).frame.classList.contains('is-dragging')).toBe(false);
  });

  it('leaves no pending change for the next gesture to emit', () => {
    const el = mount();
    const first = pointer(el, parts(el).rail);
    first.down(at(el, 0.5));
    first.move(at(el, 0.8));
    el.remove();
    document.body.append(el);

    const events = listen(el);
    const second = pointer(el, parts(el).rail);
    second.down(at(el, 0.8));
    second.up();
    expect(events.of('change')).toHaveLength(0);
  });
});

describe('disabled part-way through a drag', () => {
  it('freezes the divider where it stood', () => {
    const el = mount();
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    drag.move(at(el, 0.6));
    el.disabled = true;
    drag.move(at(el, 0.9));
    expect(el.value).toBeCloseTo(60, 5);
  });

  it('still reports the movement that happened while it was live', () => {
    const el = mount();
    const events = listen(el);
    const drag = pointer(el, parts(el).rail);
    drag.down(at(el, 0.5));
    drag.move(at(el, 0.6));
    el.disabled = true;
    drag.up();
    expect(events.of('change')).toHaveLength(1);
    expect(events.of('change')[0].value).toBeCloseTo(60, 5);
  });
});

describe('a frame with no area', () => {
  it('is left alone rather than being driven to a nonsense position', () => {
    const el = mount({ size: null });
    expect(parts(el).frame.getBoundingClientRect().height).toBe(0);
    pointer(el, parts(el).rail).down({ x: 0, y: 0 });
    expect(el.value).toBe(50);
  });
});
