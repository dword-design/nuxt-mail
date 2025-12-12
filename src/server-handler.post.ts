import { createError, defineEventHandler, readBody } from 'h3';
import nodemailer, { type Transporter } from 'nodemailer';

import { useRuntimeConfig } from '#imports';

import send from './send';

const { mail: options } = useRuntimeConfig();
let transport: Transporter | null = null;

export default defineEventHandler(async event => {
  if (!transport) {
    transport = nodemailer.createTransport(options.smtp!);
  }

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
