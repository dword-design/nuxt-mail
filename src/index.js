import { some } from '@dword-design/functions';
import {
  addImports,
  addServerHandler,
  addTemplate,
  createResolver,
  isNuxt3 as isNuxt3Try,
  useRuntimeConfig,
} from '@nuxt/kit';
import express from 'express';
import fs from 'fs-extra';
import nodemailer from 'nodemailer';
import nuxtAliasPath from 'nuxt-alias-path';
import nuxtPushPlugins from 'nuxt-push-plugins';
import parsePackagejsonName from 'parse-packagejson-name';
import P from 'path';

import send from './send.js';

const resolver = createResolver(import.meta.url);
const packageConfig = fs.readJsonSync(resolver.resolve('../package.json'));
const moduleName = parsePackagejsonName(packageConfig.name).fullName;

export default function (moduleOptions, nuxt) {
  nuxt = nuxt || this;
  let isNuxt3 = true;

  try {
    isNuxt3 = isNuxt3Try();
  } catch {
    isNuxt3 = false;
  }

  const runtimeConfig = isNuxt3
    ? useRuntimeConfig()
    : nuxt.options.privateRuntimeConfig;

  const options = {
    ...runtimeConfig.mail,
    ...nuxt.options.mail,
    ...moduleOptions,
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

  if (isNuxt3) {
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
  } else {
    const app = express();
    const transport = nodemailer.createTransport(options.smtp);
    app.use(express.json());

    app.post('/send', async (req, res) => {
      try {
        await send(req.body, options, transport);
      } catch (error) {
        return res.status(500).send(error.message);
      }

      return res.sendStatus(200);
    });

    nuxt.addServerMiddleware({ handler: app, path: '/mail' });
  }

  nuxtPushPlugins(nuxt, resolver.resolve(`./plugin-nuxt${isNuxt3 ? 3 : 2}.js`));
}
