import nuxtPushPlugins from '@dword-design/nuxt-push-plugins'
import express from 'express'
import nodemailer from 'nodemailer'
import parsePkgName from 'parse-pkg-name'
import P from 'path'

import packageConfig from '@/package.json'

const packageName = parsePkgName(packageConfig.name).name

export default function (options) {
  options = { ...this.options.mail, ...options }
  if (!options.smtp) {
    throw new Error('SMTP config is missing.')
  }
  if (!options.to && !options.cc && !options.bcc) {
    throw new Error('No recipients configured.')
  }
  const app = express()
  const transport = nodemailer.createTransport(options.smtp)
  app.use(express.json())
  app.post('/send', async (req, res) => {
    try {
      await transport.sendMail(req.body)
    } catch (error) {
      return res.status(500).send(error)
    }
    return res.sendStatus(200)
  })
  this.addServerMiddleware({ handler: app, path: '/mail' })
  this.addTemplate({
    fileName: P.join(packageName, 'options.js'),
    options,
    src: require.resolve('./options.js.template'),
  })
  nuxtPushPlugins(this, {
    fileName: P.join(packageName, 'plugin.js'),
    src: require.resolve('./plugin'),
  })
}
