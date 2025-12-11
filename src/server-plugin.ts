import { defineNitroPlugin } from 'nitropack/runtime';

import { useRuntimeConfig } from '#imports';

const { mail: options } = useRuntimeConfig();

export default defineNitroPlugin(() => {
  console.log(options);

  if (!options.smtp) {
    throw new Error('SMTP config is missing.');
  }

  if (options.message.length === 0) {
    throw new Error('You have to provide at least one config.');
  }

  if (options.message.some(c => !c.to && !c.cc && !c.bcc)) {
    throw new Error('You have to provide to/cc/bcc in all configs.');
  }
});
