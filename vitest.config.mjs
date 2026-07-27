import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// Deliberately does not extend vite.config.js. That config's only plugin is the
// template minifier, which is `apply: 'build'` and so would never run here
// anyway; the node project below exercises it directly instead.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'browser',
          include: ['test/browser/**/*.test.js'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['test/node/**/*.test.js'],
        },
      },
    ],
  },
});
