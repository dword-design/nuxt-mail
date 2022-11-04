import { findIndex, omit } from '@dword-design/functions'
import { createError, defineEventHandler, readBody } from 'h3'
import nodemailer from 'nodemailer'

import options from '#mail'

const transport = nodemailer.createTransport(options.smtp)

export default defineEventHandler(async event => {
  let body = await readBody(event)
  body = { config: 0, ...body }
  try {
    if (typeof body.config === 'string') {
      const configIndex = findIndex(_ => _.name === body.config)(
        options.message
      )
      if (configIndex === -1) {
        throw new Error(`Message config with name '${body.config}' not found.`)
      }
      body.config = configIndex
    } else if (!options.message[body.config]) {
      throw new Error(`Message config not found at index ${body.config}.`)
    }
    await transport.sendMail({
      ...omit(['config', 'to', 'cc', 'bcc'])(body),
      ...omit(['name'])(options.message[body.config]),
    })
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }
})
