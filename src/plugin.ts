import { FetchError } from 'ofetch';

import { defineNuxtPlugin } from '#imports';

import type { MessageWithConfigInput } from './types';

export default defineNuxtPlugin(() => ({
  provide: {
    mail: {
      send: async (config: MessageWithConfigInput) => {
        try {
          await $fetch('/mail/send', { body: config, method: 'POST' });
        } catch (error) {
          if (error instanceof FetchError) {
            throw new TypeError(error.response?._data.statusMessage);
          }

          throw error;
        }
      },
    },
  },
}));
