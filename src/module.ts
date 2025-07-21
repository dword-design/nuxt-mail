import P from 'node:path';

import {
  addImports,
  addPlugin,
  addServerHandler,
  addTemplate,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit';
import fs from 'fs-extra';
import nuxtAliasPath from 'nuxt-alias-path';
import parsePackagejsonName from 'parse-packagejson-name';
import type { TransportOptions, SendMailOptions } from 'nodemailer';

const resolver = createResolver(import.meta.url);
const packageConfig = fs.readJsonSync(resolver.resolve('../package.json'));
const moduleName = parsePackagejsonName(packageConfig.name).fullName;

type Message = SendMailOptions & { name?: string };

type MailOptions = { message?: Message | Message[]; smtp: TransportOptions };

export default defineNuxtModule({
  setup: async (options, nuxt) => {
    options = {
      ...nuxt.options.runtimeConfig.mail,
      ...nuxt.options.mail,
      ...options,
    };

    if (!nuxt.options._prepare) {
      if (!options.smtp) {
        throw new Error('SMTP config is missing.');
      }

      if (
        (Array.isArray(options.message) && options.message.length === 0) ||
        !options.message
      ) {
        throw new Error('You have to provide at least one config.');
      }
    }

    if (!Array.isArray(options.message)) {
      options.message = [options.message];
    }

    if (
      !nuxt.options._prepare &&
      options.message.some(c => !c.to && !c.cc && !c.bcc)
    ) {
      throw new Error('You have to provide to/cc/bcc in all configs.');
    }

    addTemplate({
      filename: P.join(moduleName, 'options.mjs'),
      getContents: () =>
        `export default ${JSON.stringify(options, undefined, 2)}`,
      write: true,
    });

    const sendTemplatePathWithoutExt = resolver.resolve('./send');

    const sendTemplatePath = (await fs.exists(
      `${sendTemplatePathWithoutExt}.ts`,
    ))
      ? `${sendTemplatePathWithoutExt}.ts`
      : `${sendTemplatePathWithoutExt}.js`;

    addTemplate({
      filename: P.join(moduleName, 'send.mjs'),
      getContents: () => fs.readFile(sendTemplatePath, 'utf8'),
      write: true,
    });

    nuxt.options.alias['#mail'] = nuxtAliasPath(moduleName, nuxt);

    addServerHandler({
      handler: resolver.resolve('./server-handler.post'),
      route: '/mail/send',
    });

    addImports([{ from: resolver.resolve('./composable'), name: 'useMail' }]);
    addPlugin(resolver.resolve(`./plugin`));
  },
});
declare module '@nuxt/schema' {
  interface NuxtConfig {
    ['mail']?: MailOptions;
  }
  interface NuxtOptions {
    ['mail']?: MailOptions;
  }
  interface RuntimeConfig {
    mail?: MailOptions;
  }
}
