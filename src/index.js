import nuxtPushPlugins from '@dword-design/nuxt-push-plugins'
import express from 'express'
import nodemailer from 'nodemailer'

export default function (moduleOptions) {
  const options = { ...this.options.mail, ...moduleOptions }
  if (!options.smtp) {
    throw new Error('SMTP config is missing.')
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
  nuxtPushPlugins(this, require.resolve('./plugin'))
}
