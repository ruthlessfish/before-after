import { describe, expect, it, vi } from 'vitest';
import { cdp } from 'vitest/browser';
import { key, mount, parts } from './helpers.js';

describe('the handle', () => {
  it('is a real button, so it is tabbable without a tabindex', () => {
    const { handle } = parts(mount());
    expect(handle.tagName).toBe('BUTTON');
    expect(handle.hasAttribute('tabindex')).toBe(false);
  });

  it('is type=button, so it cannot submit a surrounding form', () => {
    expect(parts(mount()).handle.type).toBe('button');
  });

  it('carries the slider role and range', () => {
    const { handle } = parts(mount());
    expect(handle.getAttribute('role')).toBe('slider');
    expect(handle.getAttribute('aria-valuemin')).toBe('0');
    expect(handle.getAttribute('aria-valuemax')).toBe('100');
  });

  it('takes focus programmatically', () => {
    const el = mount();
    const { handle } = parts(el);
    handle.focus();
    expect(el.shadowRoot.activeElement).toBe(handle);
  });
});

describe('announced position', () => {
  it('starts at the initial value', () => {
    const { handle } = parts(mount({ value: 30 }));
    expect(handle.getAttribute('aria-valuenow')).toBe('30');
    expect(handle.getAttribute('aria-valuetext')).toBe('30% revealed');
  });

  it('follows the value property', () => {
    const el = mount();
    el.value = 75;
    expect(parts(el).handle.getAttribute('aria-valuenow')).toBe('75');
  });

  it('follows keyboard movement', () => {
    const el = mount();
    key(el, 'End');
    expect(parts(el).handle.getAttribute('aria-valuenow')).toBe('100');
    expect(parts(el).handle.getAttribute('aria-valuetext')).toBe('100% revealed');
  });

  it('rounds a fractional position rather than announcing decimals', () => {
    const el = mount();
    el.value = 33.7;
    const { handle } = parts(el);
    expect(handle.getAttribute('aria-valuenow')).toBe('34');
    expect(handle.getAttribute('aria-valuetext')).toBe('34% revealed');
  });
});

describe('accessible name', () => {
  it('has a sensible default', () => {
    expect(parts(mount()).handle.getAttribute('aria-label'))
      .toBe('Before and after comparison');
  });

  it('is overridden by the label attribute', () => {
    const el = mount({ label: 'Kitchen renovation' });
    expect(parts(el).handle.getAttribute('aria-label')).toBe('Kitchen renovation');
  });

  it('updates when the label changes', () => {
    const el = mount({ label: 'Kitchen renovation' });
    el.setAttribute('label', 'Bathroom renovation');
    expect(parts(el).handle.getAttribute('aria-label')).toBe('Bathroom renovation');
  });

  it('returns to the default when the label is removed', () => {
    const el = mount({ label: 'Kitchen renovation' });
    el.removeAttribute('label');
    expect(parts(el).handle.getAttribute('aria-label')).toBe('Before and after comparison');
  });
});

describe('announced orientation', () => {
  it('defaults to horizontal', () => {
    expect(parts(mount()).handle.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('follows the orientation attribute', () => {
    const el = mount({ orientation: 'vertical' });
    expect(parts(el).handle.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('updates when orientation changes after mount', () => {
    const el = mount();
    el.orientation = 'vertical';
    expect(parts(el).handle.getAttribute('aria-orientation')).toBe('vertical');
  });
});

describe('decoration', () => {
  it('hides the chevron icon from assistive technology', () => {
    const svg = parts(mount()).handle.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
  });
});

describe('reduced motion', () => {
  const emulate = (value) => cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value }],
  });

  it('drops the eased transition when the user asks for less motion', async () => {
    const { before } = parts(mount());
    expect(getComputedStyle(before).transitionDuration).not.toBe('0s');

    try {
      await emulate('reduce');
      // The emulation lands a frame or so after the CDP call resolves.
      await vi.waitFor(() => {
        expect(getComputedStyle(before).transitionDuration).toBe('0s');
      });
    } finally {
      await emulate('no-preference');
    }
  });
});
