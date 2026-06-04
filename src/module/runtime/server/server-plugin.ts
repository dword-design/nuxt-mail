import { defineNitroPlugin } from 'nitropack/runtime';

import checkOptions from '@@/src/check-options';
import normalizeOptions from '@@/src/normalize-options';
import { useRuntimeConfig } from '#imports';

const options = normalizeOptions(useRuntimeConfig().mail);

// For prod
export default defineNitroPlugin(() => {
  if (import.meta.prerender) {
    return;
  }

  checkOptions(options);
});
