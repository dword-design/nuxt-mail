import { some } from '@dword-design/functions';
import {
  addImports,
  addServerHandler,
  addTemplate,
  createResolver,
  defineNuxtConfig,
} from '@nuxt/kit';
import fs from 'fs-extra';
import nuxtAliasPath from 'nuxt-alias-path';
import nuxtPushPlugins from 'nuxt-push-plugins';
import parsePackagejsonName from 'parse-packagejson-name';
import P from 'path';

const resolver = createResolver(import.meta.url);
const packageConfig = fs.readJsonSync(resolver.resolve('../package.json'));
const moduleName = parsePackagejsonName(packageConfig.name).fullName;

export default defineNuxtConfig({
  setup: (options, nuxt) => {
    options = {
      ...nuxt.options.runtimeConfig.mail,
      ...nuxt.options.mail,
      ...options,
    };

    if (!options.smtp) {
      throw new Error('SMTP config is missing.');
    }

    if (
      (Array.isArray(options.message) && options.message.length === 0) ||
      !options.message
    ) {
      throw new Error('You have to provide at least one config.');
    }

    if (!Array.isArray(options.message)) {
      options.message = [options.message];
    }

    if (some(c => !c.to && !c.cc && !c.bcc)(options.message)) {
      throw new Error('You have to provide to/cc/bcc in all configs.');
    }

    addTemplate({
      filename: P.join(moduleName, 'options.mjs'),
      getContents: () =>
        `export default ${JSON.stringify(options, undefined, 2)}`,
      write: true,
    });

    addTemplate({
      filename: P.join(moduleName, 'send.mjs'),
      getContents: () => fs.readFile(resolver.resolve('./send.js'), 'utf8'),
      write: true,
    });

    nuxt.options.alias['#mail'] = nuxtAliasPath(moduleName, nuxt);

    addServerHandler({
      handler: resolver.resolve('./server-handler.post.js'),
      route: '/mail/send',
    });

    addImports([
      { from: resolver.resolve('./composable.js'), name: 'useMail' },
    ]);

    nuxtPushPlugins(nuxt, resolver.resolve(`./plugin.js`));
  },
});
