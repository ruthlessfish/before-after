import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../..', import.meta.url));

const config = require(path.join(root, 'vite.config.js'));
const plugin = config.plugins.flat().find((p) => p?.name === 'dev-uses-source');

const html = readFileSync(path.join(root, 'index.html'), 'utf8');

// The hook may be authored bare or as { order, handler }; both are valid Vite.
const hook = typeof plugin?.transformIndexHtml === 'function'
  ? plugin.transformIndexHtml
  : plugin?.transformIndexHtml?.handler;

const transform = (input = html) => hook.call({}, input);

/**
 * index.html is both the demo and the published GitHub Pages site, so the
 * committed copy has to point at dist/. This plugin swaps it to lib/ for the
 * dev server only, by matching a literal string in another file -- the same
 * kind of coupling as the template minifier, guarded the same way.
 */
describe('the plugin is wired up', () => {
  it('is registered in the config', () => {
    expect(plugin).toBeTruthy();
    expect(hook).toBeTypeOf('function');
  });

  it('only runs in the dev server, so a build is never rewritten', () => {
    expect(plugin.apply).toBe('serve');
  });
});

describe('the committed page still works on GitHub Pages', () => {
  it('loads the built file, which is what the site serves', () => {
    expect(html).toContain('src="dist/before-after.es.js"');
  });

  it('carries the id the source listing looks up', () => {
    expect(html).toMatch(/<script[^>]*\bid="ba-source"[^>]*\bsrc="dist\/before-after\.es\.js"/);
  });
});

describe('the dev server gets the source', () => {
  const output = transform();

  it('points the module tag at lib/main.js', () => {
    expect(output).toContain('src="/lib/main.js"');
  });

  it('leaves no reference to the built file behind', () => {
    expect(output).not.toContain('dist/before-after.es.js');
  });

  it('changes nothing else about the page', () => {
    expect(output.replace('/lib/main.js', 'dist/before-after.es.js')).toBe(html);
  });
});

describe('degradation is caught rather than silent', () => {
  it('throws when the tag it rewrites is gone', () => {
    expect(() => transform('<html><body>no module tag</body></html>')).toThrow(/dist\/before-after\.es\.js/);
  });
});
