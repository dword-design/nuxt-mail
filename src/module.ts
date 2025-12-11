import {
  addImports,
  addPlugin,
  addServerHandler,
  addServerPlugin,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit';
import defu from 'defu';

import type { MailOptions, MailOptionsInput } from './types';

const resolver = createResolver(import.meta.url);
declare module '@nuxt/schema' {
  interface RuntimeConfig {
    mail: MailOptions;
  }
}

export default defineNuxtModule<MailOptionsInput>({
  meta: {
    compatibility: { nuxt: '>=3.0.0' },
    configKey: 'mail',
    name: 'nuxt-mail',
  },
  setup: (optionsInput, nuxt) => {
    const options = defu(optionsInput, nuxt.options.runtimeConfig.mail, {
      smtp: null,
    });

    nuxt.options.runtimeConfig.mail = {
      ...options,
      message: Array.isArray(options.message)
        ? options.message
        : [options.message],
    };

    addServerPlugin(resolver.resolve('./server-plugin'));

    addServerHandler({
      handler: resolver.resolve('./server-handler.post'),
      route: '/mail/send',
    });

    addImports([{ from: resolver.resolve('./composable'), name: 'useMail' }]);
    addPlugin(resolver.resolve(`./plugin`));
  },
});
