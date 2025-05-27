import config from '@dword-design/eslint-config';
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt({ features: { standalone: false } }).prepend(
  config,
  {
    rules: {
      'import/no-unresolved': ['error', { ignore: ['#imports', '#mail'] }],
    },
  },
  {
    files: ['eslint.config.js'],
    rules: { 'import/no-extraneous-dependencies': 'off' },
  },
);
