import { describe, expect, it, vi } from 'vitest';
import { imageUrl, mount, parts } from './helpers.js';

describe('image shorthand', () => {
  it('shows a pane image when given a src', () => {
    const el = mount({ 'before-src': imageUrl(4, 4) });
    const { img } = parts(el);
    expect(img.before.hidden).toBe(false);
    expect(img.after.hidden).toBe(true);
  });

  it('handles both sides', () => {
    const el = mount({ 'before-src': imageUrl(4, 4), 'after-src': imageUrl(4, 4) });
    const { img } = parts(el);
    expect(img.before.hidden).toBe(false);
    expect(img.after.hidden).toBe(false);
  });

  it('hides the image again when the src is removed', () => {
    const el = mount({ 'before-src': imageUrl(4, 4) });
    el.removeAttribute('before-src');
    const { img } = parts(el);
    expect(img.before.hidden).toBe(true);
    expect(img.before.hasAttribute('src')).toBe(false);
  });

  it('hides the image when the src is emptied', () => {
    const el = mount({ 'before-src': imageUrl(4, 4) });
    el.setAttribute('before-src', '');
    expect(parts(el).img.before.hidden).toBe(true);
  });

  it('swaps the src in place', () => {
    const first = imageUrl(4, 4);
    const second = imageUrl(8, 8);
    const el = mount({ 'after-src': first });
    el.setAttribute('after-src', second);
    expect(parts(el).img.after.getAttribute('src')).toBe(second);
  });
});

describe('alt text', () => {
  it('applies to the matching side', () => {
    const el = mount({ 'before-alt': 'Straight out of camera', 'after-alt': 'Graded' });
    const { img } = parts(el);
    expect(img.before.alt).toBe('Straight out of camera');
    expect(img.after.alt).toBe('Graded');
  });

  it('defaults to empty, marking the image decorative', () => {
    const { img } = parts(mount({ 'before-src': imageUrl(4, 4) }));
    expect(img.before.alt).toBe('');
    expect(img.before.hasAttribute('alt')).toBe(true);
  });

  it('empties when the attribute is removed', () => {
    const el = mount({ 'before-alt': 'Before' });
    el.removeAttribute('before-alt');
    expect(parts(el).img.before.alt).toBe('');
  });
});

describe('caption chips', () => {
  it('stay hidden until given text', () => {
    const { chip } = parts(mount());
    expect(chip.before.hidden).toBe(true);
    expect(chip.after.hidden).toBe(true);
  });

  it('show the label text', () => {
    const el = mount({ 'before-label': 'Original', 'after-label': 'Graded' });
    const { chip } = parts(el);
    expect(chip.before.textContent).toBe('Original');
    expect(chip.after.textContent).toBe('Graded');
    expect(chip.before.hidden).toBe(false);
  });

  it('update in place', () => {
    const el = mount({ 'before-label': 'Original' });
    el.setAttribute('before-label', 'Raw');
    expect(parts(el).chip.before.textContent).toBe('Raw');
  });

  it('hide again when emptied', () => {
    const el = mount({ 'before-label': 'Original' });
    el.setAttribute('before-label', '');
    const { chip } = parts(el);
    expect(chip.before.hidden).toBe(true);
    expect(chip.before.textContent).toBe('');
  });

  it('hide again when the attribute is removed', () => {
    const el = mount({ 'after-label': 'Graded' });
    el.removeAttribute('after-label');
    expect(parts(el).chip.after.hidden).toBe(true);
  });

  it('sit inside their own pane, so each wipes away with it', () => {
    const el = mount({ 'before-label': 'Original', 'after-label': 'Graded' });
    const { chip, before, after } = parts(el);
    expect(before.contains(chip.before)).toBe(true);
    expect(after.contains(chip.after)).toBe(true);
  });

  it('do not swallow pointer events aimed at the panes', () => {
    const el = mount({ 'before-label': 'Original' });
    expect(getComputedStyle(parts(el).chip.before).pointerEvents).toBe('none');
  });
});

describe('aspect ratio', () => {
  it('is forced by the aspect attribute', () => {
    const el = mount({ aspect: '16 / 9', size: null });
    expect(getComputedStyle(el).aspectRatio).toBe('16 / 9');
  });

  it('updates when the attribute changes', () => {
    const el = mount({ aspect: '16 / 9', size: null });
    el.setAttribute('aspect', '1 / 1');
    expect(getComputedStyle(el).aspectRatio).toBe('1 / 1');
  });

  it('falls back to auto when the attribute is removed and there is nothing to measure', () => {
    const el = mount({ aspect: '16 / 9', size: null });
    el.removeAttribute('aspect');
    expect(getComputedStyle(el).aspectRatio).toBe('auto');
  });

  it('is inferred from the first image once it loads', async () => {
    const el = mount({ 'before-src': imageUrl(300, 100), size: null });
    await vi.waitFor(() => {
      expect(getComputedStyle(el).aspectRatio).toBe('300 / 100');
    });
  });

  it('is inferred from the after image when only that side has one', async () => {
    const el = mount({ 'after-src': imageUrl(100, 400), size: null });
    await vi.waitFor(() => {
      expect(getComputedStyle(el).aspectRatio).toBe('100 / 400');
    });
  });

  it('is inferred from a slotted image', async () => {
    const el = mount({ size: null, html: `<img alt=""  slot="before" src="${imageUrl(200, 50)}">` });
    await vi.waitFor(() => {
      expect(getComputedStyle(el).aspectRatio).toBe('200 / 50');
    });
  });

  it('is inferred from an image nested inside slotted markup', async () => {
    const el = mount({ size: null, html: `<div slot="after"><img alt=""  src="${imageUrl(120, 60)}"></div>` });
    await vi.waitFor(() => {
      expect(getComputedStyle(el).aspectRatio).toBe('120 / 60');
    });
  });

  it('lets the aspect attribute win over a loaded image', async () => {
    const el = mount({ 'before-src': imageUrl(300, 100), aspect: '2 / 1', size: null });
    await vi.waitFor(() => {
      expect(getComputedStyle(el).aspectRatio).toBe('2 / 1');
    });
  });

  it('lets author CSS win over a measured image', async () => {
    const el = mount({ 'before-src': imageUrl(300, 100), size: null });
    el.style.aspectRatio = '4 / 3';
    el.setAttribute('before-src', imageUrl(300, 100));
    await vi.waitFor(() => {
      expect(getComputedStyle(el).aspectRatio).toBe('4 / 3');
    });
  });
});

describe('slotted content', () => {
  it('renders into the matching pane', () => {
    const el = mount({
      html: '<p slot="before" id="b">before</p><p slot="after" id="a">after</p>',
    });
    const { root } = parts(el);
    const assigned = (name: string) => root.querySelector<HTMLSlotElement>(`slot[name="${name}"]`)!
      .assignedElements().map((n) => n.id);
        expect(assigned('before')).toEqual(['b']);
        expect(assigned('after')).toEqual(['a']);
      });

  it('leaves unslotted children unrendered', () => {
    const el = mount({ html: '<p id="stray">stray</p>' });
    const { root } = parts(el);
    const anySlotTook = [...root.querySelectorAll('slot')]
      .some((s) => s.assignedElements().length > 0);
    expect(anySlotTook).toBe(false);
  });
});
