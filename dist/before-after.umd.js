(function(e,t){typeof exports==`object`&&typeof module<`u`?module.exports=t():typeof define==`function`&&define.amd?define([],t):(e=typeof globalThis<`u`?globalThis:e||self,e[`before-after`]=t())})(this,function(){var e=`
<style>
:host {
    display: block;
    position: relative;
    touch-action: pan-y;
    aspect-ratio: var(--_ar, auto);
  }
  :host([hidden]) { display: none; }

  .frame {
    --_p: 50%;
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    height: 100%;
    overflow: hidden;
    border-radius: var(--ba-radius, 0);
    background: var(--ba-background, transparent);
    isolation: isolate;
  }

  .pane {
    grid-area: 1 / 1;
    position: relative;
    min-width: 0;
    overflow: hidden;
  }

  .pane.before { clip-path: inset(0 calc(100% - var(--_p)) 0 0); }
  :host([orientation="vertical"]) .pane.before { clip-path: inset(0 0 calc(100% - var(--_p)) 0); }

  img.auto,
  ::slotted(img), ::slotted(video), ::slotted(canvas), ::slotted(svg) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: var(--ba-object-fit, cover);
    user-select: none;
    -webkit-user-drag: none;
  }
  img[hidden] { display: none; }

  .label {
    position: absolute;
    top: 0;
    margin: .6rem;
    padding: .2em .6em;
    border-radius: 2px;
    background: var(--ba-label-bg, rgb(0 0 0 / .55));
    color: var(--ba-label-color, #fff);
    font: 500 11px/1.6 var(--ba-label-font, ui-monospace, SFMono-Regular, Menlo, monospace);
    letter-spacing: .08em;
    text-transform: uppercase;
    white-space: nowrap;
    backdrop-filter: blur(3px);
    pointer-events: none;
  }
  .label.before { left: 0; }
  .label.after { right: 0; }
  :host([orientation="vertical"]) .label.after { top: auto; bottom: 0; right: 0; }
  .label[hidden] { display: none; }

  .rail {
    position: absolute;
    top: 0;
    bottom: 0;
    left: var(--_p);
    width: max(var(--ba-handle-size, 44px), 44px);
    transform: translateX(-50%);
    display: grid;
    place-items: center;
    cursor: col-resize;
    touch-action: none;
  }

  :host([orientation="vertical"]) .rail {
    top: var(--_p);
    bottom: auto;
    left: 0;
    right: 0;
    width: auto;
    height: max(var(--ba-handle-size, 44px), 44px);
    transform: translateY(-50%);
    cursor: row-resize;
  }

  :host([disabled]) .rail { cursor: default; }

  .line {
    position: absolute;
    background: var(--ba-divider-color, #fff);
    box-shadow: 0 0 0 1px rgb(0 0 0 / .16);
    top: 0;
    bottom: 0;
    width: var(--ba-divider-width, 2px);
    left: 50%;
    transform: translateX(-50%);
  }

  :host([orientation="vertical"]) .line {
    top: 50%;
    bottom: auto;
    left: 0;
    right: 0;
    width: auto;
    height: var(--ba-divider-width, 2px);
    transform: translateY(-50%);
  }

  .handle {
    position: relative;
    width: var(--ba-handle-size, 44px);
    height: var(--ba-handle-size, 44px);
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--ba-handle-bg, #fff);
    color: var(--ba-handle-color, #111);
    box-shadow: 0 1px 3px rgb(0 0 0 / .3), 0 0 0 1px rgb(0 0 0 / .08);
    display: grid;
    place-items: center;
    cursor: inherit;
    touch-action: none;
  }

  .handle svg { width: 60%; height: 60%; display: block; }
  :host([orientation="vertical"]) .handle svg { transform: rotate(90deg); }

  .handle:focus-visible {
    outline: 2px solid var(--ba-focus-ring, #0aa);
    outline-offset: 3px;
  }

  /* Focus taken by a drag is not focus the user asked to see. */
  .handle.by-pointer:focus-visible { outline: none; }

  :host([disabled]) .handle { opacity: .45; }

  .frame:not(.is-dragging) .pane.before { transition: clip-path .18s ease; }
  .frame:not(.is-dragging) .rail { transition: left .18s ease, top .18s ease; }

  @media (prefers-reduced-motion: reduce) {
    .frame .pane.before, .frame .rail { transition: none; }
  }
</style>
<div class="frame" part="frame">
  <div class="pane after" part="pane after">
    <img class="auto after" part="image" hidden alt="">
    <slot name="after"></slot>
    <span class="label after" part="label" hidden></span>
  </div>
  <div class="pane before" part="pane before">
    <img class="auto before" part="image" hidden alt="">
    <slot name="before"></slot>
    <span class="label before" part="label" hidden></span>
  </div>
  <div class="rail">
    <span class="line" part="divider"></span>
    <button class="handle" part="handle" type="button" role="slider"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></button>
  </div>
</div>`,t=document.createElement(`template`);t.innerHTML=e;var n=e=>Math.min(100,Math.max(0,e)),r=class extends HTMLElement{static observedAttributes=[`value`,`orientation`,`disabled`,`aspect`,`step`,`label`,`grab`,`before-src`,`after-src`,`before-alt`,`after-alt`,`before-label`,`after-label`];#e;#t;#n;#r={};#i={};#a=50;#o=!1;#s=!1;constructor(){super();let e=this.attachShadow({mode:`open`});e.append(t.content.cloneNode(!0)),this.#e=e.querySelector(`.frame`),this.#t=e.querySelector(`.rail`),this.#n=e.querySelector(`.handle`),this.#n.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10.5 7.5 6 12l4.5 4.5"></path><path d="M13.5 7.5 18 12l-4.5 4.5"></path></svg>`,this.#r.before=e.querySelector(`img.before`),this.#r.after=e.querySelector(`img.after`),this.#i.before=e.querySelector(`.label.before`),this.#i.after=e.querySelector(`.label.after`)}connectedCallback(){this.#e.addEventListener(`pointerdown`,this.#v),this.#e.addEventListener(`pointermove`,this.#y),this.#e.addEventListener(`pointerup`,this.#b),this.#e.addEventListener(`pointercancel`,this.#b),this.#n.addEventListener(`keydown`,this.#S),this.#n.addEventListener(`keyup`,this.#C),this.#n.addEventListener(`blur`,this.#x),this.#n.addEventListener(`dragstart`,this.#_);for(let e of this.shadowRoot.querySelectorAll(`slot`))e.addEventListener(`slotchange`,this.#p);this.hasAttribute(`value`)||this.#c(this.#a),this.#f(),this.#p()}disconnectedCallback(){this.#e.removeEventListener(`pointerdown`,this.#v),this.#e.removeEventListener(`pointermove`,this.#y),this.#e.removeEventListener(`pointerup`,this.#b),this.#e.removeEventListener(`pointercancel`,this.#b),this.#n.removeEventListener(`keydown`,this.#S),this.#n.removeEventListener(`keyup`,this.#C),this.#n.removeEventListener(`blur`,this.#x),this.#n.removeEventListener(`dragstart`,this.#_);for(let e of this.shadowRoot.querySelectorAll(`slot`))e.removeEventListener(`slotchange`,this.#p)}attributeChangedCallback(e,t,r){if(t!==r)switch(e){case`value`:this.#c(n(parseFloat(r))||0);break;case`before-src`:case`after-src`:this.#m(e,r),this.#p();break;case`before-alt`:case`after-alt`:this.#r[e.slice(0,e.indexOf(`-`))].alt=r||``;break;case`before-label`:case`after-label`:let t=this.#i[e.slice(0,e.indexOf(`-`))];t.textContent=r||``,t.hidden=!r;break;case`aspect`:this.#p();break;default:this.#f()}}get value(){return this.#a}set value(e){this.#c(n(parseFloat(e))||0)}get orientation(){return this.getAttribute(`orientation`)===`vertical`?`vertical`:`horizontal`}set orientation(e){this.setAttribute(`orientation`,e===`vertical`?`vertical`:`horizontal`)}get disabled(){return this.hasAttribute(`disabled`)}set disabled(e){this.toggleAttribute(`disabled`,!!e)}get step(){return parseFloat(this.getAttribute(`step`))||1}#c(e){this.#a=e,this.#e.style.setProperty(`--_p`,e+`%`),this.#n.setAttribute(`aria-valuenow`,Math.round(e)),this.#n.setAttribute(`aria-valuetext`,Math.round(e)+`% revealed`)}#l(e){let t=this.#a;this.#c(n(e)),this.#a!==t&&(this.#s=!0,this.#d(`input`))}#u(){this.#s&&(this.#s=!1,this.#d(`change`))}#d(e){this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0,detail:{value:this.#a}}))}#f(){this.#n.setAttribute(`aria-orientation`,this.orientation),this.#n.setAttribute(`aria-label`,this.getAttribute(`label`)||`Before and after comparison`),this.#n.disabled=this.disabled}#p=()=>{this.style.removeProperty(`--_ar`);let e=this.getAttribute(`aspect`);if(e){this.style.setProperty(`--_ar`,e);return}if(getComputedStyle(this).aspectRatio!==`auto`)return;let t=this.#h();t&&(t.complete&&t.naturalWidth?this.style.setProperty(`--_ar`,t.naturalWidth+` / `+t.naturalHeight):t.addEventListener(`load`,this.#p,{once:!0}))};#m(e,t){let n=e.slice(0,e.indexOf(`-`)),r=this.#r[n];t?(r.src=t,r.hidden=!1):(r.removeAttribute(`src`),r.hidden=!0)}#h(){for(let e of[`before`,`after`])if(!this.#r[e].hidden)return this.#r[e];for(let e of this.shadowRoot.querySelectorAll(`slot`))for(let t of e.assignedElements()){if(t.tagName===`IMG`)return t;let e=t.querySelector(`img`);if(e)return e}return null}#g(e){let t=this.#e.getBoundingClientRect();if(t.width===0||t.height===0)return;let n=this.orientation===`vertical`?(e.clientY-t.top)/t.height:(e.clientX-t.left)/t.width;this.#l(n*100)}#_=e=>e.preventDefault();#v=e=>{if(!this.disabled&&!(e.pointerType===`mouse`&&e.button!==0)&&!(!e.composedPath().includes(this.#t)&&this.getAttribute(`grab`)!==`anywhere`)){e.preventDefault(),this.#o=!0,this.#e.classList.add(`is-dragging`);try{this.#e.setPointerCapture(e.pointerId)}catch{}this.#n.classList.add(`by-pointer`),this.#n.focus({preventScroll:!0}),this.#g(e)}};#y=e=>{this.#o&&this.#g(e)};#b=e=>{this.#o&&(this.#o=!1,this.#e.classList.remove(`is-dragging`),this.#e.hasPointerCapture(e.pointerId)&&this.#e.releasePointerCapture(e.pointerId),this.#u())};#x=()=>this.#n.classList.remove(`by-pointer`);#S=e=>{if(this.disabled)return;this.#n.classList.remove(`by-pointer`);let t=this.step,n=null;e.key===`ArrowLeft`||e.key===`ArrowUp`?n=this.#a-t:e.key===`ArrowRight`||e.key===`ArrowDown`?n=this.#a+t:e.key===`PageUp`?n=this.#a-t*10:e.key===`PageDown`?n=this.#a+t*10:e.key===`Home`?n=0:e.key===`End`&&(n=100),n!==null&&(e.preventDefault(),this.#l(n))};#C=e=>{(e.key.indexOf(`Arrow`)===0||e.key===`PageUp`||e.key===`PageDown`||e.key===`Home`||e.key===`End`)&&this.#u()}};return customElements.define(`before-after`,r),r});