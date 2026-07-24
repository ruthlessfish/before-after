export const chevrons =  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10.5 7.5 6 12l4.5 4.5"></path><path d="M13.5 7.5 18 12l-4.5 4.5"></path></svg>`;

export const tmpl = `
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
</div>`;
