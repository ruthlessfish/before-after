import { tmpl, chevrons } from './template';

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = tmpl;

const clamp = (n: number) => Math.min(100, Math.max(0, n));

type Side = 'before' | 'after';
type Orientation = 'horizontal' | 'vertical';

// Attribute names are `<side>-<thing>`; the side is always the first segment.
const sideOf = (name: string) => name.slice(0, name.indexOf('-')) as Side;

// Throws rather than returning null: a missing node means the template and this
// file have drifted apart, which is a build-time mistake, not a runtime state.
const must = <T extends Element>(root: ParentNode, sel: string): T => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`before-after: template is missing ${sel}`);
  return el;
};

class BeforeAfter extends HTMLElement {
  // `step` and `grab` are deliberately absent: both are read at the moment they
  // are used, so observing them would only schedule a pointless #syncA11y().
  static observedAttributes = [
    'value', 'orientation', 'disabled', 'aspect', 'label',
    'before-src', 'after-src', 'before-alt', 'after-alt', 'before-label', 'after-label',
  ];

  // Held rather than read off `this.shadowRoot`, which is nullable.
  #root: ShadowRoot;
  #frame: HTMLDivElement;
  #rail: HTMLDivElement;
  #handle: HTMLButtonElement;
  #img: Record<Side, HTMLImageElement>;
  #chip: Record<Side, HTMLSpanElement>;
  #value = 50;
  #dragging = false;
  #dirty = false;
  // Kept so a drag can be torn down without a pointer event to read an id off.
  #pointerId = -1;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(TEMPLATE.content.cloneNode(true));
    this.#root = root;
    this.#frame = must(root, '.frame');
    this.#rail = must(root, '.rail');
    this.#handle = must(root, '.handle');
    this.#handle.innerHTML = chevrons;
    this.#img = {
      before: must(root, 'img.before'),
      after: must(root, 'img.after'),
    };
    this.#chip = {
      before: must(root, '.label.before'),
      after: must(root, '.label.after'),
    };
  }

  connectedCallback() {
    this.#frame.addEventListener('pointerdown', this.#onDown);
    this.#frame.addEventListener('pointermove', this.#onMove);
    this.#frame.addEventListener('pointerup', this.#onUp);
    this.#frame.addEventListener('pointercancel', this.#onUp);
    this.#handle.addEventListener('keydown', this.#onKeyDown);
    this.#handle.addEventListener('keyup', this.#onKeyUp);
    this.#handle.addEventListener('blur', this.#onBlur);
    this.#handle.addEventListener('dragstart', this.#stop);
    for (const slot of this.#root.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', this.#syncBox);
    }
    // Unconditional, and idempotent when a `value` attribute already placed it:
    // this is the only thing that writes the initial aria-valuenow.
    this.#place(this.#value);
    this.#syncA11y();
    this.#syncBox();
  }

  disconnectedCallback() {
    this.#frame.removeEventListener('pointerdown', this.#onDown);
    this.#frame.removeEventListener('pointermove', this.#onMove);
    this.#frame.removeEventListener('pointerup', this.#onUp);
    this.#frame.removeEventListener('pointercancel', this.#onUp);
    this.#handle.removeEventListener('keydown', this.#onKeyDown);
    this.#handle.removeEventListener('keyup', this.#onKeyUp);
    this.#handle.removeEventListener('blur', this.#onBlur);
    this.#handle.removeEventListener('dragstart', this.#stop);
    for (const slot of this.#root.querySelectorAll('slot')) {
      slot.removeEventListener('slotchange', this.#syncBox);
    }
    // A drag in flight when the element leaves the document never gets its
    // pointerup -- this callback has already unbound the listener by the time
    // the browser would fire one. Left set, #dragging would make the next
    // pointermove after a reconnect drag with no press behind it, and a stale
    // #dirty would commit as somebody else's `change`.
    this.#endDrag();
    this.#dirty = false;
  }

  attributeChangedCallback(name: string, old: string | null, val: string | null) {
    if (old === val) return;
    switch (name) {
      case 'value':
        this.#place(clamp(parseFloat(val ?? '')) || 0);
        break;
      case 'before-src':
      case 'after-src':
        this.#setImageSrc(name, val);
        this.#syncBox();
        break;
      case 'before-alt':
      case 'after-alt':
        this.#img[sideOf(name)].alt = val || '';
        break;
      case 'before-label':
      case 'after-label': {
        const chip = this.#chip[sideOf(name)];
        chip.textContent = val || '';
        chip.hidden = !val;
        break;
      }
      case 'aspect':
        this.#syncBox();
        break;
      default:
        this.#syncA11y();
    }
  }

  // The getters are annotated so declaration emit reports what reading the
  // property actually gives you, rather than widening to the setter's type.
  get value(): number { return this.#value; }
  set value(v: number | string) { this.#place(clamp(parseFloat(String(v))) || 0); }

  get orientation(): Orientation { return this.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal'; }
  // Setter stays wide: it normalises anything, which is behaviour the tests pin.
  set orientation(v: string) { this.setAttribute('orientation', v === 'vertical' ? 'vertical' : 'horizontal'); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v: boolean) { this.toggleAttribute('disabled', Boolean(v)); }

  get step(): number { return parseFloat(this.getAttribute('step') ?? '') || 1; }
  // Reflects, like `orientation` and `disabled`, so the property round-trips.
  set step(v: number | string) { this.setAttribute('step', String(v)); }

  /* --- internals --- */

  #place(next: number) {
    this.#value = next;
    this.#frame.style.setProperty('--_p', next + '%');
    this.#handle.setAttribute('aria-valuenow', String(Math.round(next)));
    this.#handle.setAttribute('aria-valuetext', Math.round(next) + '% revealed');
  }

  #move(next: number) {
    const before = this.#value;
    this.#place(clamp(next));
    if (this.#value === before) return;
    this.#dirty = true;
    this.#send('input');
  }

  // A gesture that never moved the divider is not a change.
  #commit() {
    if (!this.#dirty) return;
    this.#dirty = false;
    this.#send('change');
  }

  #send(type: 'input' | 'change') {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true, composed: true, detail: { value: this.#value },
    }));
  }

  #syncA11y() {
    this.#handle.setAttribute('aria-orientation', this.orientation);
    this.#handle.setAttribute('aria-label', this.getAttribute('label') || 'Before and after comparison');
    this.#handle.disabled = this.disabled;
  }

  #syncBox = () => {
    this.style.removeProperty('--_ar');
    const forced = this.getAttribute('aspect');
    if (forced) { this.style.setProperty('--_ar', forced); return; }
    // An aspect-ratio set by author CSS beats anything measured here.
    if (getComputedStyle(this).aspectRatio !== 'auto') return;
    const img = this.#firstImage();
    if (!img) return;
    if (img.complete && img.naturalWidth) {
      this.style.setProperty('--_ar', img.naturalWidth + ' / ' + img.naturalHeight);
    } else {
      img.addEventListener('load', this.#syncBox, { once: true });
    }
  };

  #setImageSrc(name: string, src: string | null) {
    const img = this.#img[sideOf(name)];
    if (src) {
      img.src = src;
      img.hidden = false;
    } else {
      img.removeAttribute('src');
      img.hidden = true;
    }
  }

  #firstImage(): HTMLImageElement | null {
    for (const side of ['before', 'after'] as const) {
      if (!this.#img[side].hidden) return this.#img[side];
    }
    for (const slot of this.#root.querySelectorAll('slot')) {
      for (const el of slot.assignedElements()) {
        // `el.tagName === 'IMG'` reads fine but does not narrow -- tagName is string.
        if (el instanceof HTMLImageElement) return el;
        const nested = el.querySelector('img');
        if (nested) return nested;
      }
    }
    return null;
  }

  #fromPointer(e: PointerEvent) {
    const box = this.#frame.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) {
      return;
    }
    const ratio = this.orientation === 'vertical'
      ? (e.clientY - box.top) / box.height
      : (e.clientX - box.left) / box.width;
    this.#move(ratio * 100);
  }

  #stop = (e: Event) => e.preventDefault();

  // Teardown only -- never emits, so it is safe to call from anywhere the
  // gesture ends, including a disconnect that will never see a pointerup.
  #endDrag() {
    if (!this.#dragging) return;
    this.#dragging = false;
    this.#frame.classList.remove('is-dragging');
    if (this.#pointerId !== -1 && this.#frame.hasPointerCapture(this.#pointerId)) {
      this.#frame.releasePointerCapture(this.#pointerId);
    }
    this.#pointerId = -1;
  }

  #onDown = (e: PointerEvent) => {
    if (this.disabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const onRail = e.composedPath().includes(this.#rail);
    if (!onRail && this.getAttribute('grab') !== 'anywhere') return;
    e.preventDefault();
    this.#dragging = true;
    this.#pointerId = e.pointerId;
    this.#frame.classList.add('is-dragging');
    try { this.#frame.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    this.#handle.classList.add('by-pointer');
    this.#handle.focus({ preventScroll: true });
    this.#fromPointer(e);
  };

  // Re-reads `disabled` rather than trusting the check in #onDown: disabling
  // mid-gesture has to freeze the divider, not just refuse the next press.
  #onMove = (e: PointerEvent) => {
    if (this.#dragging && !this.disabled) this.#fromPointer(e);
  };

  // Commits even when disabled: whatever movement set #dirty happened while
  // the element was live, and swallowing it would leave a `change`-only
  // listener never hearing about a real move.
  #onUp = () => {
    if (!this.#dragging) return;
    this.#endDrag();
    this.#commit();
  };

  #onBlur = () => this.#handle.classList.remove('by-pointer');

  #onKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    this.#handle.classList.remove('by-pointer');
    const step = this.step;
    let next: number | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = this.#value - step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = this.#value + step;
    else if (e.key === 'PageUp') next = this.#value - step * 10;
    else if (e.key === 'PageDown') next = this.#value + step * 10;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 100;
    if (next === null) return;
    e.preventDefault();
    this.#move(next);
  };

  #onKeyUp = (e: KeyboardEvent) => {
    if (e.key.indexOf('Arrow') === 0 || e.key === 'PageUp' || e.key === 'PageDown'
      || e.key === 'Home' || e.key === 'End') this.#commit();
  };
}

declare global {
  interface HTMLElementTagNameMap { 'before-after': BeforeAfter }
}

customElements.define('before-after', BeforeAfter);
export default BeforeAfter;
