import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/all.test.ts', 'test/e2e-dist.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
});
