const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: 'before-after',
      fileName: (format) => `before-after.${format}.js`
    },
    minify: true
  }
});
