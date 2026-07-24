import {tmpl, chevrons} from "./template";

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = tmpl;

const clamp = (n) => Math.min(100, Math.max(0, n));

class BeforeAfter extends HTMLElement {
  static observedAttributes = [
    'value', 'orientation', 'disabled', 'aspect', 'step', 'label', 'grab',
    'before-src', 'after-src', 'before-alt', 'after-alt', 'before-label', 'after-label',
  ];

  #frame;
  #rail;
  #handle;
  #img = {};
  #chip = {};
  #value = 50;
  #dragging = false;
  #dirty = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(TEMPLATE.content.cloneNode(true));
    this.#frame = root.querySelector('.frame');
    this.#rail = root.querySelector('.rail');
    this.#handle = root.querySelector('.handle');
    this.#handle.innerHTML = chevrons;
    this.#img.before = root.querySelector('img.before');
    this.#img.after = root.querySelector('img.after');
    this.#chip.before = root.querySelector('.label.before');
    this.#chip.after = root.querySelector('.label.after');
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
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', this.#syncBox);
    }
    if (!this.hasAttribute('value')) this.#place(this.#value);
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
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      slot.removeEventListener('slotchange', this.#syncBox);
    }
  }

  attributeChangedCallback(name, old, val) {
    if (old === val) return;
    switch (name) {
      case 'value':
        this.#place(clamp(parseFloat(val)) || 0);
        break;
      case 'before-src':
      case 'after-src':
        this.#setImageSrc(name, val);
        this.#syncBox();
        break;
      case 'before-alt':
      case 'after-alt':
        this.#img[name.slice(0, name.indexOf('-'))].alt = val || '';
        break;
      case 'before-label':
      case 'after-label':
        const chip = this.#chip[name.slice(0, name.indexOf('-'))];
        chip.textContent = val || '';
        chip.hidden = !val;
        break;
      case 'aspect':
        this.#syncBox();
        break;
      default:
        this.#syncA11y();
    }
  }

  get value() { return this.#value; }
  set value(v) { this.#place(clamp(parseFloat(v)) || 0); }

  get orientation() { return this.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal'; }
  set orientation(v) { this.setAttribute('orientation', v === 'vertical' ? 'vertical' : 'horizontal'); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { this.toggleAttribute('disabled', Boolean(v)); }

  get step() { return parseFloat(this.getAttribute('step')) || 1; }

  /* --- internals --- */

  #place(next) {
    this.#value = next;
    this.#frame.style.setProperty('--_p', next + '%');
    this.#handle.setAttribute('aria-valuenow', Math.round(next));
    this.#handle.setAttribute('aria-valuetext', Math.round(next) + '% revealed');
  }

  #move(next) {
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

  #send(type) {
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

  #setImageSrc(name, src) {
    const side = name.slice(0, name.indexOf('-'));
    const img = this.#img[side];
    if (src) {
      img.src = src;
      img.hidden = false;
    } else {
      img.removeAttribute('src');
      img.hidden = true;
    }
  }

  #firstImage() {
    for (const side of ['before', 'after']) {
      if (!this.#img[side].hidden) return this.#img[side];
    }
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      for (const el of slot.assignedElements()) {
        if (el.tagName === 'IMG') return el;
        const nested = el.querySelector('img');
        if (nested) return nested;
      }
    }
    return null;
  }

  #fromPointer(e) {
    const box = this.#frame.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) {
      return;
    }
    const ratio = this.orientation === 'vertical'
      ? (e.clientY - box.top) / box.height
      : (e.clientX - box.left) / box.width;
    this.#move(ratio * 100);
  }

  #stop = (e) => e.preventDefault();

  #onDown = (e) => {
    if (this.disabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const onRail = e.composedPath().includes(this.#rail);
    if (!onRail && this.getAttribute('grab') !== 'anywhere') return;
    e.preventDefault();
    this.#dragging = true;
    this.#frame.classList.add('is-dragging');
    try { this.#frame.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    this.#handle.classList.add('by-pointer');
    this.#handle.focus({ preventScroll: true });
    this.#fromPointer(e);
  };

  #onMove = (e) => {
    if (this.#dragging) this.#fromPointer(e);
  };

  #onUp = (e) => {
    if (!this.#dragging) return;
    this.#dragging = false;
    this.#frame.classList.remove('is-dragging');
    if (this.#frame.hasPointerCapture(e.pointerId)) this.#frame.releasePointerCapture(e.pointerId);
    this.#commit();
  };

  #onBlur = () => this.#handle.classList.remove('by-pointer');

  #onKeyDown = (e) => {
    if (this.disabled) return;
    this.#handle.classList.remove('by-pointer');
    const step = this.step;
    let next = null;
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

  #onKeyUp = (e) => {
    if (e.key.indexOf('Arrow') === 0 || e.key === 'PageUp' || e.key === 'PageDown'
      || e.key === 'Home' || e.key === 'End') this.#commit();
  };
}

customElements.define('before-after', BeforeAfter);
export default BeforeAfter;
