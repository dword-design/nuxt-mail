import { createError, defineEventHandler, readBody } from 'h3';
import nodemailer from 'nodemailer';
import options from '#mail/options.js';
import send from '#mail/send.js';
const transport = nodemailer.createTransport(options.smtp);
export default defineEventHandler(async event => {
  try {
    await send(await readBody(event), options, transport);
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    });
  }
});