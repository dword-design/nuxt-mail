import {
  addImports,
  addPlugin,
  addServerHandler,
  addServerPlugin,
  createResolver,
  defineNuxtModule,
  useRuntimeConfig,
} from '@nuxt/kit';
import defu from 'defu';

import checkOptions from './check-options';
import type { MailOptions, MailOptionsInput } from './types';

const resolver = createResolver(import.meta.url);
declare module '@nuxt/schema' {
  interface RuntimeConfig {
    mail: MailOptions;
  }
}

const normalizeMessage = (message: MailOptionsInput['message']) => {
  if (Array.isArray(message)) {
    return message;
  }

  return [message];
};

export default defineNuxtModule<MailOptionsInput>({
  meta: {
    compatibility: { nuxt: '>=3.0.0' },
    configKey: 'mail',
    name: 'nuxt-mail',
  },
  setup: (optionsInput, nuxt) => {
    const options = defu(optionsInput, nuxt.options.runtimeConfig.mail, {
      message: [],
      smtp: null,
    });

    nuxt.options.runtimeConfig.mail = {
      ...options,
      message: normalizeMessage(options.message),
    };

    if (!nuxt.options._prepare) {
      const resolvedOptions = useRuntimeConfig().mail;
      checkOptions(resolvedOptions); // For dev
    }

    addServerPlugin(resolver.resolve('./server-plugin'));

    addServerHandler({
      handler: resolver.resolve('./server-handler.post'),
      route: '/mail/send',
    });

    addImports([{ from: resolver.resolve('./composable'), name: 'useMail' }]);
    addPlugin(resolver.resolve(`./plugin`));
  },
});
