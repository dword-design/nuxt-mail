import pathLib from 'node:path';

import {
  addImports,
  addPlugin,
  addServerHandler,
  addTemplate,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit';
import endent from 'endent';
import fs from 'fs-extra';
import parsePackagejsonName from 'parse-packagejson-name';

import type { MailOptionsInput } from './types';

const resolver = createResolver(import.meta.url);
const packageConfig = fs.readJsonSync(resolver.resolve('../package.json'));
const moduleName = parsePackagejsonName(packageConfig.name).fullName;

export default defineNuxtModule<MailOptionsInput>({
  meta: {
    compatibility: { nuxt: '>=3.0.0' },
    configKey: 'mail',
    name: 'nuxt-mail',
  },
  setup: (options, nuxt) => {
    if (nuxt.options._prepare) {
      options = {
        message: { bcc: 'prepare', cc: 'prepare', to: 'prepare' },
        smtp: {},
      };
    }

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

    if (
      !nuxt.options._prepare &&
      options.message.some(c => !c.to && !c.cc && !c.bcc)
    ) {
      throw new Error('You have to provide to/cc/bcc in all configs.');
    }

    addTemplate({
      filename: pathLib.join(moduleName, 'options.ts'),
      getContents: () => {
        const templatePath = pathLib.resolve(
          nuxt.options.buildDir,
          moduleName,
          'options.ts',
        );

        const typesPath = resolver.resolve('./types');

        const relativePath = pathLib.relative(
          pathLib.dirname(templatePath),
          typesPath,
        );

        return endent`
          import type { MailOptions } from '${relativePath}';

          const options: MailOptions = ${JSON.stringify(options, undefined, 2)};

          export default options;\n
        `;
      },
      write: true,
    });

    nuxt.options.alias['#mail'] = pathLib.resolve(
      nuxt.options.buildDir,
      moduleName,
    );

    addServerHandler({
      handler: resolver.resolve('./server-handler.post'),
      route: '/mail/send',
    });

    addImports([{ from: resolver.resolve('./composable'), name: 'useMail' }]);
    addPlugin(resolver.resolve(`./plugin`));
  },
});
