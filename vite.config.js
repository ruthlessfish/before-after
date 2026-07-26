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

module.exports = defineConfig({
  plugins: [minifyTemplateModule()],
  build: {
    minify: 'terser',
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: 'before-after',
      fileName: (format) => `before-after.${format}.js`
    },
  }
});
