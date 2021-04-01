import { findIndex, omit, some } from '@dword-design/functions'
import nuxtPushPlugins from '@dword-design/nuxt-push-plugins'
import express from 'express'
import nodemailer from 'nodemailer'

export default function (moduleOptions) {
  const options = { ...this.options.mail, ...moduleOptions }
  if (!options.smtp) {
    throw new Error('SMTP config is missing.')
  }
  if (
    (Array.isArray(options.message) && options.message.length === 0) ||
    !options.message
  ) {
    throw new Error('You have to provide at least one config.')
  }
  if (!Array.isArray(options.message)) {
    options.message = [options.message]
  }
  if (options.message |> some(c => !c.to && !c.cc && !c.bcc)) {
    throw new Error('You have to provide to/cc/bcc in all configs.')
  }
  const app = express()
  const transport = nodemailer.createTransport(options.smtp)
  app.use(express.json())
  app.post('/send', async (req, res) => {
    req.body = { config: 0, ...req.body }
    try {
      if (typeof req.body.config === 'string') {
        const configIndex =
          options.message |> findIndex(_ => _.name === req.body.config)
        if (configIndex === -1) {
          throw new Error(
            `Message config with name '${req.body.config}' not found.`
          )
        }
        req.body.config = configIndex
      } else if (!options.message[req.body.config]) {
        throw new Error(`Message config not found at index ${req.body.config}.`)
      }
      await transport.sendMail({
        ...(req.body |> omit(['config', 'to', 'cc', 'bcc'])),
        ...(options.message[req.body.config] |> omit(['name'])),
      })
    } catch (error) {
      return res.status(500).send(error.message)
    }
    return res.sendStatus(200)
  })
  this.addServerMiddleware({ handler: app, path: '/mail' })
  nuxtPushPlugins(this, require.resolve('./plugin'))
}
