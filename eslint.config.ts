import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import config from '@dword-design/eslint-config';
import { globalIgnores } from "eslint/config";

export default createConfigForNuxt({ features: { standalone: false } })
  .prepend(
    config,
    {
      rules: {
        'import-x/no-unresolved': ["error", { ignore: ['#imports', '#mail'] }],
      },
    },
    globalIgnores(['eslint.config.ts']),
  );
