const path = require('path')
const { defineConfig } = require('vite')

function minifySvg(svg) {
  return svg
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s*=\s*/g, '=')
    .trim()
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/\s*,\s*/g, ',')
    .replace(/;}/g, '}')
    .trim()
}

function minifyHtml(html) {
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
}

function minifyTemplateLiteral(code, exportName, minify) {
  const pattern = new RegExp(`(export const ${exportName}\\s*=\\s*\`)([\\s\\S]*?)(\`;?)`)
  return code.replace(pattern, (_, start, body, end) => `${start}${minify(body)}${end}`)
}

function minifyTemplateModule() {
  return {
    name: 'minify-template-module',
    apply: 'build',
    transform(code, id) {
      if (!id.endsWith(path.join('lib', 'template.js'))) return null

      let output = minifyTemplateLiteral(code, 'chevrons', minifySvg)

      output = output.replace(
        /(export const tmpl\s*=\s*`)([\s\S]*?)(`;?)/,
        (_, start, body, end) => {
          const styleMatch = body.match(/<style>([\s\S]*?)<\/style>([\s\S]*)/)
          if (!styleMatch) return `${start}${minifyHtml(body)}${end}`

          const [, css, html] = styleMatch
          return `${start}<style>${minifyCss(css)}</style>${minifyHtml(html)}${end}`
        }
      )

      return { code: output, map: null }
    }
  }
}

const DIST_TAG = 'dist/before-after.es.js'

// index.html ships pointing at dist/ because GitHub Pages serves this repo as-is.
// Dev should run the real source, so the tag is swapped on the way out of the server.
function devUsesSource() {
  return {
    name: 'dev-uses-source',
    apply: 'serve',
    transformIndexHtml(html) {
      // Loud on purpose: falling through would put the dev server back to serving
      // the built file, which is the exact stale-code trap this plugin removes.
      if (!html.includes(DIST_TAG)) {
        throw new Error(
          `dev-uses-source: no "${DIST_TAG}" in index.html — the dev server would ` +
          `silently serve the built file. Update DIST_TAG in vite.config.js.`
        )
      }

      return html.replaceAll(DIST_TAG, '/lib/main.js')
    }
  }
}

module.exports = defineConfig({
  plugins: [minifyTemplateModule(), devUsesSource()],
  build: {
    minify: 'terser',
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: 'before-after',
      // ESM only — the element self-registers, so there are no exports worth
      // require()-ing, and a UMD copy just doubles dist/ for no consumer.
      formats: ['es'],
      fileName: (format) => `before-after.${format}.js`
    },
  }
});
