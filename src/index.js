import { omit } from '@dword-design/functions'
import nuxtPushPlugins from '@dword-design/nuxt-push-plugins'
import express from 'express'
import nodemailer from 'nodemailer'

export default function (moduleOptions) {
  const options = { ...this.options.mail, ...moduleOptions }
  if (!options.smtp) {
    throw new Error('SMTP config is missing.')
  }
  
  if((Array.isArray(options.message) && options.message.length == 0) || !options.message) {
     throw new Error('You have to provide at least one config.')
  }
  
  if(!Array.isArray(options.message)) {
    options.message = [options.message]
  }
  
  if (options.message.some((c) => !c.to && !c.cc && !c.bcc)) {
    throw new Error('You have to provide to/cc/bcc in all configs.')
  }
  const app = express()
  const transport = nodemailer.createTransport(options.smtp)
  app.use(express.json())
  app.post('/send', async (req, res) => {  
    try {
      await transport.sendMail({
        ...(req.body |> omit(['to', 'cc', 'bcc'])),
        ...(options.message[req.body.type] ?? options.message[0]),
      })
    } catch (error) {
      return res.status(500).send(error)
    }
    return res.sendStatus(200)
  })
  this.addServerMiddleware({ handler: app, path: '/mail' })
  nuxtPushPlugins(this, require.resolve('./plugin'))
}
