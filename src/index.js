import { omit } from '@dword-design/functions'
import nuxtPushPlugins from '@dword-design/nuxt-push-plugins'
import express from 'express'
import nodemailer from 'nodemailer'

export default function (moduleOptions) {
  const options = { ...this.options.mail, ...moduleOptions }
  if (!options.smtp) {
    throw new Error('SMTP config is missing.')
  }
  if (!options.message?.to && !options.message?.cc && !options.message?.bcc) {
    throw new Error('You have to provide to/cc/bcc in config.')
  }

  const app = express()

  const transport = nodemailer.createTransport(options.smtp)
  app.use(express.json())
  app.post('/send', async (req, res) => {
    try {
      await transport.sendMail({
        ...(req.body |> omit(['to', 'cc', 'bcc'])),
        ...options.message,
      })
    } catch (error) {
      return res.status(500).send(error)
    }

    return res.sendStatus(200)
  })
  this.addServerMiddleware({ handler: app, path: '/mail' })
  nuxtPushPlugins(this, require.resolve('./plugin'))
}
