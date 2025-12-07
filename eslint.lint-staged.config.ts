import { defineConfig } from 'eslint/config';
import parent from './eslint.config';

export default defineConfig([
  ...parent,
  {
    files: ['**/*.spec.ts'],
    rules: { 'playwright/no-focused-test': 'error' },
  },
]);
