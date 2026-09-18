import { defineConfig } from 'oxlint';

export default defineConfig({
  options: {
    typeAware: true,
  },
  plugins: ['typescript', 'react', 'jsx-a11y', 'import', 'unicorn', 'vitest', 'node', 'promise'],
  categories: {
    correctness: 'error',
    suspicious: 'error',
  },
  env: {
    node: true,
  },
  rules: {
    'typescript/no-explicit-any': 'error',
    'no-unused-vars': 'error',
    'react/react-in-jsx-scope': 'off',
    'unicorn/no-array-fill-with-reference-type': 'off',
    'unicorn/no-array-sort': 'off',
    'typescript/no-unsafe-type-assertion': 'off',
    'typescript/no-unnecessary-type-assertion': 'off',
    'typescript/consistent-return': 'off',
    'typescript/no-base-to-string': 'off',
    'import/no-unassigned-import': 'off',
    'import/no-named-as-default-member': 'off',
    'promise/always-return': 'off',
    'vitest/require-to-throw-message': 'off',
    'vitest/expect-expect': 'off',
  },
  ignorePatterns: ['**/dist/**', '**/node_modules/**', 'runs/**', '**/*.d.ts'],
  overrides: [
    {
      files: [
        'apps/hundred-web/**/*.{ts,tsx}',
        'apps/shogi-web/**/*.{ts,tsx}',
        'apps/lab-web/**/*.{ts,tsx}',
      ],
      env: {
        browser: true,
      },
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        vitest: true,
      },
    },
    {
      files: ['apps/hundred-server/**/*.ts', 'apps/shogi-server/**/*.ts', 'scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['packages/domain/**/*.ts'],
      rules: {
        'no-console': 'error',
      },
    },
  ],
});
