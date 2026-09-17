import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts', 'scripts/**/*.test.ts'],
    exclude: ['**/*.live.test.ts', '**/node_modules/**', '**/dist/**'],
    coverage: {
      include: [
        'packages/domain/src/**/*.ts',
        'packages/simulation/src/**/*.ts',
        'packages/decision/src/**/*.ts',
      ],
      thresholds: {
        lines: 90,
        branches: 85,
      },
    },
  },
});
