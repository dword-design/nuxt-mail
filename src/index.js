import { some } from '@dword-design/functions'
import express from 'express'
import nodemailer from 'nodemailer'
import nuxtPushPlugins from 'nuxt-push-plugins'
import P from 'path'

import send from './send'

export default function (moduleOptions) {
  const options = { message: [], ...this.options.mail, ...moduleOptions }
  if (!options.smtp) {
    throw new Error('SMTP config is missing.')
  }
  if (typeof options.message === 'object' && !Array.isArray(options.message)) {
    options.message = [options.message]
  }
  if (options.message |> some(c => !c.to && !c.cc && !c.bcc)) {
    throw new Error('You have to provide to/cc/bcc in all configs.')
  }

  const transport = nodemailer.createTransport(options.smtp)

  const app = express()
  app.use(express.json())
  app.post('/send', async (req, res) => {
    try {
      await send(req.body, { ...options, forceConfig: true, transport })
    } catch (error) {
      return res.status(400).send(error.message)
    }

    return res.sendStatus(200)
  })
  this.addServerMiddleware({ handler: app, path: '/mail' })
  this.addTemplate({
    fileName: P.join('nuxt-mail', 'options.js'),
    options,
    src: require.resolve('./options.js.template'),
  })
  this.addTemplate({
    fileName: P.join('nuxt-mail', 'send.js'),
    options,
    src: require.resolve('./send'),
  })
  nuxtPushPlugins(this, {
    fileName: P.join('nuxt-mail', 'plugin.client.js'),
    src: require.resolve('./plugin.client'),
  })
  nuxtPushPlugins(this, {
    fileName: P.join('nuxt-mail', 'plugin.server.js'),
    src: require.resolve('./plugin.server'),
  })
}
