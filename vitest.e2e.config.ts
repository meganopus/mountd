import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/e2e-dist.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
  },
});

