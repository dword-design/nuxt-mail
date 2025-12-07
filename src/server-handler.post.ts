import { createError, defineEventHandler, readBody } from 'h3';
import nodemailer from 'nodemailer';

import options from '#mail/options';

import send from './send';

const transport = nodemailer.createTransport(options.smtp);

export default defineEventHandler(async event => {
  try {
    await send(await readBody(event), options, transport);
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : String(error),
    });
  }

  return '';
});
