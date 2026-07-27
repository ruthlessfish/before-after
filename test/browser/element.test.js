import { describe, expect, it } from 'vitest';
import { cssPosition, mount, parts } from './helpers.js';

describe('registration', () => {
  it('defines itself on import, with no setup call', () => {
    expect(customElements.get('before-after')).toBeTypeOf('function');
  });

  it('upgrades an element that was already in the document', async () => {
    document.body.insertAdjacentHTML('beforeend', '<before-after id="late"></before-after>');
    const el = document.getElementById('late');
    await customElements.whenDefined('before-after');
    expect(el.shadowRoot).toBeTruthy();
    expect(el.value).toBe(50);
    el.remove();
  });

  it('exports the class as the default export', async () => {
    const { default: BeforeAfter } = await import('../../lib/main.js');
    expect(mount()).toBeInstanceOf(BeforeAfter);
  });
});

describe('shadow structure', () => {
  it('opens its shadow root', () => {
    expect(mount().shadowRoot).toBeTruthy();
  });

  it('exposes the documented parts', () => {
    const { root } = parts(mount());
    const exposed = [...root.querySelectorAll('[part]')]
      .flatMap((n) => n.getAttribute('part').split(/\s+/));
    for (const name of ['frame', 'pane', 'before', 'after', 'divider', 'handle', 'label']) {
      expect(exposed, `part="${name}"`).toContain(name);
    }
  });

  it('offers a before and an after slot', () => {
    const { root } = parts(mount());
    const names = [...root.querySelectorAll('slot')].map((s) => s.name);
    expect(names.sort()).toEqual(['after', 'before']);
  });

  it('stacks both panes in one grid cell so neither is cropped', () => {
    const el = mount({ html: '<div slot="before" style="height:300px"></div>' });
    const { before, after } = parts(el);
    expect(getComputedStyle(before).gridArea).toBe(getComputedStyle(after).gridArea);
  });

  it('renders the chevron icon into the handle', () => {
    expect(parts(mount()).handle.querySelector('svg')).toBeTruthy();
  });

  it('hides both images until a src is given', () => {
    const { img } = parts(mount());
    expect(img.before.hidden).toBe(true);
    expect(img.after.hidden).toBe(true);
  });
});

describe('value', () => {
  it('starts at 50 and writes that position to CSS', () => {
    const el = mount();
    expect(el.value).toBe(50);
    expect(cssPosition(el)).toBe(50);
  });

  it('honours a starting value attribute', () => {
    const el = mount({ value: 25 });
    expect(el.value).toBe(25);
    expect(cssPosition(el)).toBe(25);
  });

  it('moves when the attribute changes', () => {
    const el = mount();
    el.setAttribute('value', '80');
    expect(el.value).toBe(80);
    expect(cssPosition(el)).toBe(80);
  });

  it('moves when the property is set', () => {
    const el = mount();
    el.value = 10;
    expect(el.value).toBe(10);
    expect(cssPosition(el)).toBe(10);
  });

  it('accepts a numeric string', () => {
    const el = mount();
    el.value = '33';
    expect(el.value).toBe(33);
  });

  it('keeps fractional positions', () => {
    const el = mount();
    el.value = 12.5;
    expect(el.value).toBe(12.5);
    expect(cssPosition(el)).toBe(12.5);
  });

  it.each([
    ['above the range', 140, 100],
    ['below the range', -40, 0],
    ['non-numeric', 'nope', 0],
  ])('clamps %s', (_label, input, expected) => {
    const el = mount();
    el.value = input;
    expect(el.value).toBe(expected);
  });

  it('does not write the position back to the attribute', () => {
    const el = mount({ value: 30 });
    el.value = 70;
    expect(el.getAttribute('value')).toBe('30');
  });
});

describe('orientation', () => {
  it('defaults to horizontal', () => {
    expect(mount().orientation).toBe('horizontal');
  });

  it('reads vertical from the attribute', () => {
    expect(mount({ orientation: 'vertical' }).orientation).toBe('vertical');
  });

  it('treats any unrecognised value as horizontal', () => {
    expect(mount({ orientation: 'sideways' }).orientation).toBe('horizontal');
  });

  it('reflects the property to the attribute', () => {
    const el = mount();
    el.orientation = 'vertical';
    expect(el.getAttribute('orientation')).toBe('vertical');
    el.orientation = 'horizontal';
    expect(el.getAttribute('orientation')).toBe('horizontal');
  });

  it('normalises a bad property assignment', () => {
    const el = mount();
    el.orientation = 'diagonal';
    expect(el.getAttribute('orientation')).toBe('horizontal');
  });
});

describe('disabled', () => {
  it('defaults to false', () => {
    expect(mount().disabled).toBe(false);
  });

  it('reflects the property to the attribute', () => {
    const el = mount();
    el.disabled = true;
    expect(el.hasAttribute('disabled')).toBe(true);
    el.disabled = false;
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('disables the handle button, removing it from the tab order', () => {
    const el = mount({ disabled: true });
    expect(parts(el).handle.disabled).toBe(true);
  });

  it('re-enables the handle when the attribute goes away', () => {
    const el = mount({ disabled: true });
    el.disabled = false;
    expect(parts(el).handle.disabled).toBe(false);
  });
});

describe('step', () => {
  it('defaults to 1', () => {
    expect(mount().step).toBe(1);
  });

  it('reads the attribute', () => {
    expect(mount({ step: 5 }).step).toBe(5);
  });

  it('falls back to 1 for a value that is not a usable number', () => {
    expect(mount({ step: 'lots' }).step).toBe(1);
    expect(mount({ step: 0 }).step).toBe(1);
  });
});

describe('teardown', () => {
  it('stops responding to pointer input once disconnected', () => {
    const el = mount();
    const { rail } = parts(el);
    el.remove();
    rail.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, composed: true, cancelable: true, clientX: 0, clientY: 0, pointerId: 99,
    }));
    expect(el.value).toBe(50);
  });

  it('resumes working when reconnected', () => {
    const el = mount();
    el.remove();
    document.body.append(el);
    el.value = 20;
    expect(cssPosition(el)).toBe(20);
  });
});
