import nodemailer from 'nodemailer'

import options from './options'
import send from './send'

const transport = nodemailer.createTransport(options.smtp)

export default (context, inject) =>
  inject('mail', { send: message => send(message, { ...options, transport }) })