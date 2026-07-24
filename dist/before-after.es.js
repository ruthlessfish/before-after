//#region lib/template.js
var e = "\n<style>\n:host {\n    display: block;\n    position: relative;\n    touch-action: pan-y;\n    aspect-ratio: var(--_ar, auto);\n  }\n  :host([hidden]) { display: none; }\n\n  .frame {\n    --_p: 50%;\n    position: relative;\n    display: grid;\n    grid-template-columns: minmax(0, 1fr);\n    height: 100%;\n    overflow: hidden;\n    border-radius: var(--ba-radius, 0);\n    background: var(--ba-background, transparent);\n    isolation: isolate;\n  }\n\n  .pane {\n    grid-area: 1 / 1;\n    position: relative;\n    min-width: 0;\n    overflow: hidden;\n  }\n\n  .pane.before { clip-path: inset(0 calc(100% - var(--_p)) 0 0); }\n  :host([orientation=\"vertical\"]) .pane.before { clip-path: inset(0 0 calc(100% - var(--_p)) 0); }\n\n  img.auto,\n  ::slotted(img), ::slotted(video), ::slotted(canvas), ::slotted(svg) {\n    display: block;\n    width: 100%;\n    height: 100%;\n    object-fit: var(--ba-object-fit, cover);\n    user-select: none;\n    -webkit-user-drag: none;\n  }\n  img[hidden] { display: none; }\n\n  .label {\n    position: absolute;\n    top: 0;\n    margin: .6rem;\n    padding: .2em .6em;\n    border-radius: 2px;\n    background: var(--ba-label-bg, rgb(0 0 0 / .55));\n    color: var(--ba-label-color, #fff);\n    font: 500 11px/1.6 var(--ba-label-font, ui-monospace, SFMono-Regular, Menlo, monospace);\n    letter-spacing: .08em;\n    text-transform: uppercase;\n    white-space: nowrap;\n    backdrop-filter: blur(3px);\n    pointer-events: none;\n  }\n  .label.before { left: 0; }\n  .label.after { right: 0; }\n  :host([orientation=\"vertical\"]) .label.after { top: auto; bottom: 0; right: 0; }\n  .label[hidden] { display: none; }\n\n  .rail {\n    position: absolute;\n    top: 0;\n    bottom: 0;\n    left: var(--_p);\n    width: max(var(--ba-handle-size, 44px), 44px);\n    transform: translateX(-50%);\n    display: grid;\n    place-items: center;\n    cursor: col-resize;\n    touch-action: none;\n  }\n\n  :host([orientation=\"vertical\"]) .rail {\n    top: var(--_p);\n    bottom: auto;\n    left: 0;\n    right: 0;\n    width: auto;\n    height: max(var(--ba-handle-size, 44px), 44px);\n    transform: translateY(-50%);\n    cursor: row-resize;\n  }\n\n  :host([disabled]) .rail { cursor: default; }\n\n  .line {\n    position: absolute;\n    background: var(--ba-divider-color, #fff);\n    box-shadow: 0 0 0 1px rgb(0 0 0 / .16);\n    top: 0;\n    bottom: 0;\n    width: var(--ba-divider-width, 2px);\n    left: 50%;\n    transform: translateX(-50%);\n  }\n\n  :host([orientation=\"vertical\"]) .line {\n    top: 50%;\n    bottom: auto;\n    left: 0;\n    right: 0;\n    width: auto;\n    height: var(--ba-divider-width, 2px);\n    transform: translateY(-50%);\n  }\n\n  .handle {\n    position: relative;\n    width: var(--ba-handle-size, 44px);\n    height: var(--ba-handle-size, 44px);\n    padding: 0;\n    border: 0;\n    border-radius: 50%;\n    background: var(--ba-handle-bg, #fff);\n    color: var(--ba-handle-color, #111);\n    box-shadow: 0 1px 3px rgb(0 0 0 / .3), 0 0 0 1px rgb(0 0 0 / .08);\n    display: grid;\n    place-items: center;\n    cursor: inherit;\n    touch-action: none;\n  }\n\n  .handle svg { width: 60%; height: 60%; display: block; }\n  :host([orientation=\"vertical\"]) .handle svg { transform: rotate(90deg); }\n\n  .handle:focus-visible {\n    outline: 2px solid var(--ba-focus-ring, #0aa);\n    outline-offset: 3px;\n  }\n\n  /* Focus taken by a drag is not focus the user asked to see. */\n  .handle.by-pointer:focus-visible { outline: none; }\n\n  :host([disabled]) .handle { opacity: .45; }\n\n  .frame:not(.is-dragging) .pane.before { transition: clip-path .18s ease; }\n  .frame:not(.is-dragging) .rail { transition: left .18s ease, top .18s ease; }\n\n  @media (prefers-reduced-motion: reduce) {\n    .frame .pane.before, .frame .rail { transition: none; }\n  }\n</style>\n<div class=\"frame\" part=\"frame\">\n  <div class=\"pane after\" part=\"pane after\">\n    <img class=\"auto after\" part=\"image\" hidden alt=\"\">\n    <slot name=\"after\"></slot>\n    <span class=\"label after\" part=\"label\" hidden></span>\n  </div>\n  <div class=\"pane before\" part=\"pane before\">\n    <img class=\"auto before\" part=\"image\" hidden alt=\"\">\n    <slot name=\"before\"></slot>\n    <span class=\"label before\" part=\"label\" hidden></span>\n  </div>\n  <div class=\"rail\">\n    <span class=\"line\" part=\"divider\"></span>\n    <button class=\"handle\" part=\"handle\" type=\"button\" role=\"slider\"\n      aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"50\"></button>\n  </div>\n</div>", t = document.createElement("template");
t.innerHTML = e;
var n = (e) => Math.min(100, Math.max(0, e)), r = class extends HTMLElement {
	static observedAttributes = [
		"value",
		"orientation",
		"disabled",
		"aspect",
		"step",
		"label",
		"grab",
		"before-src",
		"after-src",
		"before-alt",
		"after-alt",
		"before-label",
		"after-label"
	];
	#e;
	#t;
	#n;
	#r = {};
	#i = {};
	#a = 50;
	#o = !1;
	#s = !1;
	constructor() {
		super();
		let e = this.attachShadow({ mode: "open" });
		e.append(t.content.cloneNode(!0)), this.#e = e.querySelector(".frame"), this.#t = e.querySelector(".rail"), this.#n = e.querySelector(".handle"), this.#n.innerHTML = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\" fill=\"none\"\n  stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n  <path d=\"M10.5 7.5 6 12l4.5 4.5\"></path><path d=\"M13.5 7.5 18 12l-4.5 4.5\"></path></svg>", this.#r.before = e.querySelector("img.before"), this.#r.after = e.querySelector("img.after"), this.#i.before = e.querySelector(".label.before"), this.#i.after = e.querySelector(".label.after");
	}
	connectedCallback() {
		this.#e.addEventListener("pointerdown", this.#v), this.#e.addEventListener("pointermove", this.#y), this.#e.addEventListener("pointerup", this.#b), this.#e.addEventListener("pointercancel", this.#b), this.#n.addEventListener("keydown", this.#S), this.#n.addEventListener("keyup", this.#C), this.#n.addEventListener("blur", this.#x), this.#n.addEventListener("dragstart", this.#_);
		for (let e of this.shadowRoot.querySelectorAll("slot")) e.addEventListener("slotchange", this.#p);
		this.hasAttribute("value") || this.#c(this.#a), this.#f(), this.#p();
	}
	disconnectedCallback() {
		this.#e.removeEventListener("pointerdown", this.#v), this.#e.removeEventListener("pointermove", this.#y), this.#e.removeEventListener("pointerup", this.#b), this.#e.removeEventListener("pointercancel", this.#b), this.#n.removeEventListener("keydown", this.#S), this.#n.removeEventListener("keyup", this.#C), this.#n.removeEventListener("blur", this.#x), this.#n.removeEventListener("dragstart", this.#_);
		for (let e of this.shadowRoot.querySelectorAll("slot")) e.removeEventListener("slotchange", this.#p);
	}
	attributeChangedCallback(e, t, r) {
		if (t !== r) switch (e) {
			case "value":
				this.#c(n(parseFloat(r)) || 0);
				break;
			case "before-src":
			case "after-src":
				this.#m(e, r), this.#p();
				break;
			case "before-alt":
			case "after-alt":
				this.#r[e.slice(0, e.indexOf("-"))].alt = r || "";
				break;
			case "before-label":
			case "after-label":
				let t = this.#i[e.slice(0, e.indexOf("-"))];
				t.textContent = r || "", t.hidden = !r;
				break;
			case "aspect":
				this.#p();
				break;
			default: this.#f();
		}
	}
	get value() {
		return this.#a;
	}
	set value(e) {
		this.#c(n(parseFloat(e)) || 0);
	}
	get orientation() {
		return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
	}
	set orientation(e) {
		this.setAttribute("orientation", e === "vertical" ? "vertical" : "horizontal");
	}
	get disabled() {
		return this.hasAttribute("disabled");
	}
	set disabled(e) {
		this.toggleAttribute("disabled", !!e);
	}
	get step() {
		return parseFloat(this.getAttribute("step")) || 1;
	}
	#c(e) {
		this.#a = e, this.#e.style.setProperty("--_p", e + "%"), this.#n.setAttribute("aria-valuenow", Math.round(e)), this.#n.setAttribute("aria-valuetext", Math.round(e) + "% revealed");
	}
	#l(e) {
		let t = this.#a;
		this.#c(n(e)), this.#a !== t && (this.#s = !0, this.#d("input"));
	}
	#u() {
		this.#s && (this.#s = !1, this.#d("change"));
	}
	#d(e) {
		this.dispatchEvent(new CustomEvent(e, {
			bubbles: !0,
			composed: !0,
			detail: { value: this.#a }
		}));
	}
	#f() {
		this.#n.setAttribute("aria-orientation", this.orientation), this.#n.setAttribute("aria-label", this.getAttribute("label") || "Before and after comparison"), this.#n.disabled = this.disabled;
	}
	#p = () => {
		this.style.removeProperty("--_ar");
		let e = this.getAttribute("aspect");
		if (e) {
			this.style.setProperty("--_ar", e);
			return;
		}
		if (getComputedStyle(this).aspectRatio !== "auto") return;
		let t = this.#h();
		t && (t.complete && t.naturalWidth ? this.style.setProperty("--_ar", t.naturalWidth + " / " + t.naturalHeight) : t.addEventListener("load", this.#p, { once: !0 }));
	};
	#m(e, t) {
		let n = e.slice(0, e.indexOf("-")), r = this.#r[n];
		t ? (r.src = t, r.hidden = !1) : (r.removeAttribute("src"), r.hidden = !0);
	}
	#h() {
		for (let e of ["before", "after"]) if (!this.#r[e].hidden) return this.#r[e];
		for (let e of this.shadowRoot.querySelectorAll("slot")) for (let t of e.assignedElements()) {
			if (t.tagName === "IMG") return t;
			let e = t.querySelector("img");
			if (e) return e;
		}
		return null;
	}
	#g(e) {
		let t = this.#e.getBoundingClientRect();
		if (t.width === 0 || t.height === 0) return;
		let n = this.orientation === "vertical" ? (e.clientY - t.top) / t.height : (e.clientX - t.left) / t.width;
		this.#l(n * 100);
	}
	#_ = (e) => e.preventDefault();
	#v = (e) => {
		if (!this.disabled && !(e.pointerType === "mouse" && e.button !== 0) && !(!e.composedPath().includes(this.#t) && this.getAttribute("grab") !== "anywhere")) {
			e.preventDefault(), this.#o = !0, this.#e.classList.add("is-dragging");
			try {
				this.#e.setPointerCapture(e.pointerId);
			} catch {}
			this.#n.classList.add("by-pointer"), this.#n.focus({ preventScroll: !0 }), this.#g(e);
		}
	};
	#y = (e) => {
		this.#o && this.#g(e);
	};
	#b = (e) => {
		this.#o && (this.#o = !1, this.#e.classList.remove("is-dragging"), this.#e.hasPointerCapture(e.pointerId) && this.#e.releasePointerCapture(e.pointerId), this.#u());
	};
	#x = () => this.#n.classList.remove("by-pointer");
	#S = (e) => {
		if (this.disabled) return;
		this.#n.classList.remove("by-pointer");
		let t = this.step, n = null;
		e.key === "ArrowLeft" || e.key === "ArrowUp" ? n = this.#a - t : e.key === "ArrowRight" || e.key === "ArrowDown" ? n = this.#a + t : e.key === "PageUp" ? n = this.#a - t * 10 : e.key === "PageDown" ? n = this.#a + t * 10 : e.key === "Home" ? n = 0 : e.key === "End" && (n = 100), n !== null && (e.preventDefault(), this.#l(n));
	};
	#C = (e) => {
		(e.key.indexOf("Arrow") === 0 || e.key === "PageUp" || e.key === "PageDown" || e.key === "Home" || e.key === "End") && this.#u();
	};
};
customElements.define("before-after", r);
//#endregion
export { r as default };
