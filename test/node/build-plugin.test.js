import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../..', import.meta.url));

const config = require(path.join(root, 'vite.config.js'));
const plugin = config.plugins.flat().find((p) => p?.name === 'minify-template-module');

const templatePath = path.join(root, 'lib', 'template.js');
const templateSource = readFileSync(templatePath, 'utf8');

/** Run the plugin the way Vite would. */
const transform = (code = templateSource, id = templatePath) =>
  plugin.transform.call({}, code, id)?.code ?? null;

/**
 * These tests guard a coupling that fails silently. The plugin rewrites the
 * *source text* of lib/template.js with regexes, so renaming an export, moving
 * the file, or introducing interpolation stops the minification without any
 * build error -- the bundle just quietly gets bigger.
 */
describe('the plugin is wired up', () => {
  it('is registered in the build config', () => {
    expect(plugin).toBeTruthy();
  });

  it('only runs during a build, leaving the dev server serving readable source', () => {
    expect(plugin.apply).toBe('build');
  });

  it('still matches lib/template.js at its current path', () => {
    expect(transform()).not.toBeNull();
  });

  it('ignores every other module', () => {
    expect(transform(templateSource, path.join(root, 'lib', 'main.js'))).toBeNull();
  });
});

describe('the template module still has the shape the plugin expects', () => {
  it('exports chevrons and tmpl as plain template literals', () => {
    expect(templateSource).toMatch(/export const chevrons\s*=\s*`/);
    expect(templateSource).toMatch(/export const tmpl\s*=\s*`/);
  });

  it('keeps a single leading style block in tmpl, which is what splits CSS from HTML', () => {
    const body = templateSource.match(/export const tmpl\s*=\s*`([\s\S]*?)`;?/)[1];
    expect(body.match(/<style>/g)).toHaveLength(1);
    expect(body.trimStart().startsWith('<style>')).toBe(true);
  });

  it('uses no interpolation, which the regexes cannot survive', () => {
    expect(templateSource).not.toMatch(/\$\{/);
  });
});

describe('minified output', () => {
  const output = transform();

  it('actually gets smaller', () => {
    expect(output.length).toBeLessThan(templateSource.length);
  });

  it('strips CSS comments', () => {
    const css = output.match(/<style>([\s\S]*?)<\/style>/)[1];
    expect(css).not.toContain('/*');
    expect(templateSource).toContain('/*');
  });

  it('collapses whitespace in the CSS', () => {
    const css = output.match(/<style>([\s\S]*?)<\/style>/)[1];
    expect(css).not.toMatch(/\n/);
    expect(css).not.toMatch(/\s{2}/);
    expect(css).toContain('display:block');
  });

  it('collapses whitespace between HTML tags', () => {
    const html = output.slice(output.indexOf('</style>'));
    expect(html).not.toMatch(/>\s+</);
  });

  it('collapses the SVG', () => {
    const svg = output.match(/export const chevrons\s*=\s*`([\s\S]*?)`/)[1];
    expect(svg).not.toMatch(/\n/);
    expect(svg.startsWith('<svg')).toBe(true);
  });

  it('keeps the markup the component queries for', () => {
    for (const selector of ['class="frame"', 'class="rail"', 'class="handle"', 'class="line"']) {
      expect(output).toContain(selector);
    }
    expect(output).toContain('name="before"');
    expect(output).toContain('name="after"');
  });

  it('keeps the custom properties the CSS API is built on', () => {
    for (const prop of ['--ba-divider-width', '--ba-handle-size', '--ba-focus-ring', '--_p', '--_ar']) {
      expect(output).toContain(prop);
    }
  });

  it('keeps the exposed part names', () => {
    for (const part of ['frame', 'divider', 'handle', 'label']) {
      expect(output).toMatch(new RegExp(`part="[^"]*\\b${part}\\b`));
    }
  });

  it('preserves media and state selectors', () => {
    expect(output).toContain('@media');
    expect(output).toContain(':host([orientation="vertical"])');
    expect(output).toContain(':host([disabled])');
    expect(output).toContain('.handle:focus-visible');
  });

  it('is stable, so a rebuild does not churn the committed dist', () => {
    expect(transform(output, templatePath)).toBe(output);
  });
});

describe('degradation is caught rather than silent', () => {
  it('notices a renamed tmpl export', () => {
    const renamed = templateSource.replace('export const tmpl', 'export const markup');
    const out = transform(renamed);
    expect(out).toContain('\n');
  });

  it('notices a moved template module', () => {
    expect(transform(templateSource, '/elsewhere/template.js')).toBeNull();
  });
});
