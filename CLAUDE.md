# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build     # Vite library build -> dist/before-after.es.js (ESM only)
npm run dev       # Vite dev server for index.html (the demo page)
npm run preview   # Serve the built output

npm test          # Both projects, once
npm run test:watch
npm run test:browser        # Component tests only
npm run test:node           # Build-plugin guard only

npx vitest run test/browser/keyboard.test.js     # A single file
npx vitest run -t 'clamps'                       # A single test by name
```

First checkout needs `npx playwright install chromium`. There is no linter or formatter configured.

`npm run dev` serves `lib/` — edit and reload, no build step. The committed `index.html` points at `dist/before-after.es.js`; the `dev-uses-source` plugin swaps that for `/lib/main.js` in the dev server's response only.

`dist/` is committed intentionally — `homepage` is a GitHub Pages site served from the repo, and the published page loads the built file. Rebuild and commit `dist/` alongside source changes, even though you no longer need to for local work.

## Tests

Vitest, split into two projects by `vitest.config.mjs`:

- **browser** (`test/browser/`) — the component, in real headless Chromium via Playwright. Not jsdom, deliberately: most of what this element does is `clip-path`, `getComputedStyle` aspect-ratio inference, pointer capture, `:focus-visible` and shadow DOM, all of which jsdom either stubs or lacks. Tests run against `lib/`, not `dist/`.
- **node** (`test/node/`) — `build-plugin.test.js`, which requires `vite.config.js`, pulls out the `minify-template-module` plugin and calls its `transform` directly against the real `lib/template.js`. The plugin itself fails open, so this is the guard that makes the coupling described below loud; if you change `template.js`'s shape, this is what tells you.

`vitest.config.mjs` does not extend `vite.config.js` (the minifier is `apply: 'build'` and would not run under Vitest anyway). It is `.mjs` because `package.json` sets `"type": "commonjs"`.

`test/browser/helpers.js` holds the shared kit: `mount()` gives the element an explicit box because it is `display: block` with no intrinsic size and the pointer math bails out on a zero-area frame; `parts()` reaches into the shadow root; `pointer()` synthesises gestures. Aim `pointerdown` at a real node — the `grab` check reads `composedPath()`, so a press dispatched straight at the frame behaves like `grab="anywhere"` and will not test what you think.

Assert positions against `cssPosition()` (the `--_p` custom property), not computed `clip-path`. `--_p` is set synchronously; `clip-path` is behind a 180ms transition and will be mid-flight.

## Architecture

A single custom element, `<before-after>`, that clips one pane over another. Vanilla JS, no runtime dependencies, no framework.

- `lib/main.js` — the `BeforeAfter` class and `customElements.define`. Everything behavioral lives here.
- `lib/template.js` — two exported template literals: `tmpl` (the full `<style>` + shadow DOM markup) and `chevrons` (the handle SVG). No logic.
- `vite.config.js` — library build plus two custom plugins, one per mode: `minify-template-module` (`apply: 'build'`) and `dev-uses-source` (`apply: 'serve'`).
- `index.html` — the demo/docs page, also the published site. Not part of the library build.

`vite.config.js` uses CommonJS (`require`) because `package.json` sets `"type": "commonjs"`; `lib/` is ESM and Vite handles it. `tsconfig.json` is vestigial — it points at a nonexistent `./src` and nothing runs `tsc`.

### The template minification plugin

`minifyTemplateModule()` in `vite.config.js` regex-matches the *source text* of `lib/template.js` at build time and rewrites the bodies of the `chevrons` and `tmpl` template literals — SVG, CSS, and HTML each get their own minifier, with `tmpl` split on its `<style>` block.

This couples the plugin to the exact shape of `lib/template.js`. On its own it fails *open* — every mismatch below degrades or skips minification without a build error. `test/node/build-plugin.test.js` is what makes that coupling loud: it asserts each expectation directly against the real source, so changing `template.js`'s shape fails a test instead of quietly growing `dist/`.

- The exports must stay as `export const chevrons = \`...\`` and `export const tmpl = \`...\`` — renaming them, changing to `let`, or splitting the literal skips minification.
- The literals must contain no `${}` interpolation and no backticks.
- `tmpl` must keep its single leading `<style>...</style>` block, or the whole thing falls through to HTML-only minification and the CSS goes unminified.
- The `transform` hook matches on the path ending in `lib/template.js`. Moving or renaming that file breaks the plugin.

Failing open is the right default here, unlike in `dev-uses-source` below: this plugin runs on every build, and the whole stake is ~200 gzipped bytes (1,622 → 1,417 on a 3.1 kB bundle). A hard throw would turn a cosmetic size regression into a broken build. That size delta is also the budget for any future hardening — don't spend an AST rewrite on it.

### The dev source-swap plugin

`index.html` has to ship pointing at `dist/` — GitHub Pages serves this repo as-is. `devUsesSource()` rewrites that one tag to `/lib/main.js` in `transformIndexHtml`, so the dev server runs real source while the committed file stays correct for the published site.

It matches the literal `DIST_TAG` string, so it is coupled to `index.html` the same way the minifier is coupled to `template.js` — but it **throws** when the string is missing rather than falling through, because a silent no-op here restores exactly the stale-code problem it exists to prevent. Changing the script tag's `src` means changing `DIST_TAG`.

The demo's Source panel reads `document.getElementById('ba-source').src` and fetches it, so it follows the swap: readable `lib/main.js` in dev, the built file on Pages. Keep that `id` on the tag.

`test/node/dev-html.test.js` guards both directions — that dev gets `lib/`, and that the committed HTML still points at `dist/`.

### Positioning model

The divider is a single CSS custom property, `--_p`, set on `.frame` as a percentage. `#place()` writes it; CSS does the rest — `clip-path: inset(...)` on `.pane.before` and `left`/`top` on `.rail`. Nothing is measured or repositioned on resize, and orientation is a pure CSS concern driven by `:host([orientation="vertical"])` selectors. Keep new positioning work in CSS off `--_p` rather than adding JS measurement.

The aspect ratio is a second property, `--_ar`, set on the host by `#syncBox()`. Precedence: the `aspect` attribute wins; otherwise an author-set `aspect-ratio` in CSS wins (detected via `getComputedStyle`); otherwise it is derived from the first image found, waiting on `load` if needed.

### Interaction

Pointer events are bound on `.frame` (with pointer capture, so drags survive leaving the element); keyboard events are bound on `.handle`. The handle is a real `<button type="button">` carrying `role="slider"` — it is focusable and form-safe by construction, so avoid replacing it with a div.

`grab="handle"` (the default) requires the pointerdown path to include `.rail`, which is what keeps clicks on slotted links and buttons working. `grab="anywhere"` drops that check.

Two events, deliberately distinct: `input` fires from `#move()` on every position change; `change` fires from `#commit()` only at the end of a gesture and only if `#dirty` was set. A gesture that never moved the divider emits nothing.

The `.by-pointer` class on the handle suppresses the focus ring for focus that a drag took rather than the user requesting it; it is cleared on blur and on any keydown.

### Conventions

Private class fields (`#frame`, `#move()`, …) throughout. Handlers that need a stable identity for `removeEventListener` are arrow-function fields (`#onDown = (e) => …`); plain methods are used only for internal calls. `connectedCallback`/`disconnectedCallback` mirror each other exactly — adding a listener to one means removing it in the other.

Any new attribute must be added to `static observedAttributes` and given a case in `attributeChangedCallback`; the `default` branch falls through to `#syncA11y()`.

Comments in this codebase are sparse and explain *why* a non-obvious choice was made, not what the line does. Match that.

## Docs

`README.md` is the API reference (attributes, properties, events, custom properties, shadow parts, keyboard map). It carries an inline `TODO` about the API section. Changes to attributes, events, CSS custom properties, or shadow parts should update both `README.md` and the demo/docs content in `index.html`.
