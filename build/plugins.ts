import type { Plugin } from 'vite';

/* --- template minification --- */

function minifySvg(svg: string): string {
  return svg
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s*=\s*/g, '=')
    .trim()
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/\s*,\s*/g, ',')
    .replace(/;}/g, '}')
    .trim()
}

function minifyHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
}

function minifyTemplateLiteral(code: string, exportName: string, minify: (s: string) => string): string {
  const pattern = new RegExp(`(export const ${exportName}\\s*=\\s*\`)([\\s\\S]*?)(\`;?)`)
  return code.replace(pattern, (_, start: string, body: string, end: string) => `${start}${minify(body)}${end}`)
}

export const TEMPLATE_MODULE = 'lib/template.ts'

/**
 * Rewrites the bodies of the `chevrons` and `tmpl` template literals in the
 * *source text* of lib/template.ts. Returns null for every other module.
 *
 * Exported on its own so the tests can exercise it as a plain function rather
 * than reaching through Vite's ObjectHook union.
 */
export function minifyTemplateSource(code: string, id: string): string | null {
  // Vite ids are POSIX-normalised even on Windows, so compare that way.
  if (!id.replace(/\\/g, '/').endsWith(TEMPLATE_MODULE)) return null

  let output = minifyTemplateLiteral(code, 'chevrons', minifySvg)

  output = output.replace(
    /(export const tmpl\s*=\s*`)([\s\S]*?)(`;?)/,
    (_, start: string, body: string, end: string) => {
      const styleMatch = body.match(/<style>([\s\S]*?)<\/style>([\s\S]*)/)
      if (!styleMatch) return `${start}${minifyHtml(body)}${end}`

      const [, css, html] = styleMatch
      return `${start}<style>${minifyCss(css!)}</style>${minifyHtml(html!)}${end}`
    }
  )

  return output
}

export function minifyTemplateModule(): Plugin {
  return {
    name: 'minify-template-module',
    apply: 'build',
    // Load-bearing. Without it this runs *after* vite:oxc, which strips type
    // annotations -- so `export const tmpl: string` would miss in the source but
    // match in the transformed output, hiding the breakage from the tests below.
    enforce: 'pre',
    transform(code, id) {
      const output = minifyTemplateSource(code, id)
      return output === null ? null : { code: output, map: null }
    }
  }
}

/* --- dev source swap --- */

export const DIST_TAG = 'dist/before-after.es.js'
export const DEV_TAG = '/lib/main.ts'

/**
 * index.html ships pointing at dist/ because GitHub Pages serves this repo as-is.
 * Dev should run the real source, so the tag is swapped on the way out of the server.
 */
export function rewriteDevHtml(html: string): string {
  // Loud on purpose: falling through would put the dev server back to serving
  // the built file, which is the exact stale-code trap this plugin removes.
  if (!html.includes(DIST_TAG)) {
    throw new Error(
      `dev-uses-source: no "${DIST_TAG}" in index.html — the dev server would ` +
      `silently serve the built file. Update DIST_TAG in build/plugins.ts.`
    )
  }

  return html.replaceAll(DIST_TAG, DEV_TAG)
}

export function devUsesSource(): Plugin {
  return {
    name: 'dev-uses-source',
    apply: 'serve',
    transformIndexHtml(html) {
      return rewriteDevHtml(html)
    }
  }
}
