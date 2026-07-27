import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { minifyTemplateSource } from '../../build/plugins';
import { findPlugin } from './config';

const root = fileURLToPath(new URL('../..', import.meta.url));
const templatePath = path.join(root, 'lib', 'template.ts');
const templateSource = readFileSync(templatePath, 'utf8');

const transform = (code = templateSource, id = templatePath) => minifyTemplateSource(code, id);

/**
 * These tests guard a coupling that fails silently. The plugin rewrites the
 * *source text* of lib/template.ts with regexes, so renaming an export, moving
 * the file, or introducing interpolation stops the minification without any
 * build error -- the bundle just quietly gets bigger.
 */
describe('the plugin is wired up', () => {
  const plugin = findPlugin('minify-template-module');

  it('is registered in the build config', () => {
    expect(plugin).toBeTruthy();
  });

  it('only runs during a build, leaving the dev server serving readable source', () => {
    expect(plugin?.apply).toBe('build');
  });

  // Without `pre` this runs after vite:oxc, which strips type annotations --
  // so an annotated export would miss the source but match the transformed
  // output, quietly invalidating every source-shape assertion below.
  it('runs before the TypeScript transform, so it sees raw source', () => {
    expect(plugin?.enforce).toBe('pre');
  });

  it('still matches lib/template.ts at its current path', () => {
    expect(transform()).not.toBeNull();
  });

  it('ignores every other module', () => {
    expect(transform(templateSource, path.join(root, 'lib', 'main.ts'))).toBeNull();
  });
});

describe('the template module still has the shape the plugin expects', () => {
  it('exports chevrons and tmpl as plain template literals', () => {
    expect(templateSource).toMatch(/export const chevrons\s*=\s*`/);
    expect(templateSource).toMatch(/export const tmpl\s*=\s*`/);
  });

  it('keeps a single leading style block in tmpl, which is what splits CSS from HTML', () => {
    const body = templateSource.match(/export const tmpl\s*=\s*`([\s\S]*?)`;?/)![1]!;
    expect(body.match(/<style>/g)).toHaveLength(1);
    expect(body.trimStart().startsWith('<style>')).toBe(true);
  });

  it('uses no interpolation, which the regexes cannot survive', () => {
    expect(templateSource).not.toMatch(/\$\{/);
  });
});

describe('minified output', () => {
  const output = transform()!;

  it('actually gets smaller', () => {
    expect(output.length).toBeLessThan(templateSource.length);
  });

  it('strips CSS comments', () => {
    const css = output.match(/<style>([\s\S]*?)<\/style>/)![1]!;
    expect(css).not.toContain('/*');
    expect(templateSource).toContain('/*');
  });

  it('collapses whitespace in the CSS', () => {
    const css = output.match(/<style>([\s\S]*?)<\/style>/)![1]!;
    expect(css).not.toMatch(/\n/);
    expect(css).not.toMatch(/\s{2}/);
    expect(css).toContain('display:block');
  });

  it('collapses whitespace between HTML tags', () => {
    const html = output.slice(output.indexOf('</style>'));
    expect(html).not.toMatch(/>\s+</);
  });

  it('collapses the SVG', () => {
    const svg = output.match(/export const chevrons\s*=\s*`([\s\S]*?)`/)![1]!;
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
    expect(transform(renamed)).toContain('\n');
  });

  it('notices a moved template module', () => {
    expect(transform(templateSource, '/elsewhere/template.ts')).toBeNull();
  });
});
