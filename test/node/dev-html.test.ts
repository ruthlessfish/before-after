import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEV_TAG, DIST_TAG, rewriteDevHtml } from '../../build/plugins';
import { findPlugin } from './config';

const root = fileURLToPath(new URL('../..', import.meta.url));
const html = readFileSync(path.join(root, 'index.html'), 'utf8');

const transform = (input = html) => rewriteDevHtml(input);

/**
 * index.html is both the demo and the published GitHub Pages site, so the
 * committed copy has to point at dist/. This plugin swaps it to lib/ for the
 * dev server only, by matching a literal string in another file -- the same
 * kind of coupling as the template minifier, guarded the same way.
 */
describe('the plugin is wired up', () => {
  const plugin = findPlugin('dev-uses-source');

  it('is registered in the config', () => {
    expect(plugin).toBeTruthy();
    expect(plugin?.transformIndexHtml).toBeTruthy();
  });

  it('only runs in the dev server, so a build is never rewritten', () => {
    expect(plugin?.apply).toBe('serve');
  });
});

describe('the committed page still works on GitHub Pages', () => {
  it('loads the built file, which is what the site serves', () => {
    expect(html).toContain(`src="${DIST_TAG}"`);
  });

  it('carries the id the source listing looks up', () => {
    expect(html).toMatch(/<script[^>]*\bid="ba-source"[^>]*\bsrc="dist\/before-after\.es\.js"/);
  });
});

describe('the dev server gets the source', () => {
  const output = transform();

  it('points the module tag at the TypeScript entry', () => {
    expect(output).toContain(`src="${DEV_TAG}"`);
  });

  it('leaves no reference to the built file behind', () => {
    expect(output).not.toContain(DIST_TAG);
  });

  it('changes nothing else about the page', () => {
    // replaceAll, to mirror the plugin -- `replace` would pass only for as long
    // as index.html happens to reference the bundle exactly once.
    expect(output.replaceAll(DEV_TAG, DIST_TAG)).toBe(html);
  });
});

describe('degradation is caught rather than silent', () => {
  it('throws when the tag it rewrites is gone', () => {
    expect(() => transform('<html><body>no module tag</body></html>')).toThrow(/dist\/before-after\.es\.js/);
  });
});
