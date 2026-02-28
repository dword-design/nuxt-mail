import { defineNitroPlugin } from 'nitropack/runtime';

import { useRuntimeConfig } from '#imports';

import checkOptions from './check-options';
import normalizeOptions from './normalize-options';

const options = normalizeOptions(useRuntimeConfig().mail);

// For prod
export default defineNitroPlugin(() => {
  if (import.meta.prerender) {
    return;
  }

  checkOptions(options);
});
