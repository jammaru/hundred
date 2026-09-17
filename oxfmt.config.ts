import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 100,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  sortImports: {},
  ignorePatterns: ['**/dist/**', '**/node_modules/**', 'pnpm-lock.yaml', 'runs/**'],
});
