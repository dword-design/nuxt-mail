import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import config from '@dword-design/eslint-config';
import { globalIgnores } from 'eslint/config';
import type { Linter } from 'eslint';

/**
 * TODO: Otherwise getting this error in the project using this package:
 * error TS2742: The inferred type of 'default' cannot be named without a reference to '~/node_modules/@eslint/core/dist/cjs/types.cjs'. This is likely not portable. A type annotation is necessary.
 **/
const result: Linter.Config[] = await createConfigForNuxt({ features: { standalone: false } })
  .prepend(
    config,
    {
      rules: {
        'import-x/no-unresolved': ["error", { ignore: ['#imports'] }],
      },
    },
    globalIgnores(['eslint.config.ts', 'eslint.lint-staged.config.ts']),
  )
  .toConfigs();

export default result;
