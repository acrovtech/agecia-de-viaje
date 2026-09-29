import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'apps/api/**'],
    testTimeout: 15000,
  },
});
