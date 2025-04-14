import { createError, defineEventHandler, readBody } from 'h3';
import nodemailer from 'nodemailer';

import options from '#mail/options.mjs';
import send from '#mail/send.mjs';

const transportType = options.transport || 'smtp';
const transport = nodemailer.createTransport(options[transportType]);

export default defineEventHandler(async event => {
  try {
    await send(await readBody(event), options, transport);
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return '';
});
