import { defineEventHandler, readBody } from 'h3'
import nodemailer from 'nodemailer'

import options from '#mail/options.js'
import send from '#mail/send.js'

const transport = nodemailer.createTransport(options.smtp)

export default defineEventHandler(async event => {
  await send(await readBody(event), options, transport)

  return ''
})
