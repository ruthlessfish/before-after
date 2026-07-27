import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { devUsesSource, minifyTemplateModule } from './build/plugins'

export default defineConfig({
  plugins: [minifyTemplateModule(), devUsesSource()],
  build: {
    minify: 'terser',
    lib: {
      entry: fileURLToPath(new URL('lib/main.ts', import.meta.url)),
      name: 'before-after',
      // ESM only — the element self-registers, so there are no exports worth
      // require()-ing, and a UMD copy just doubles dist/ for no consumer.
      formats: ['es'],
      fileName: (format) => `before-after.${format}.js`
    },
  },
});
