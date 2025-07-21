import { omit } from 'lodash-es';

export default async (body, options, transport) => {
  body = { config: 0, ...body };

  if (typeof body.config === 'string') {
    const configIndex = options.message.findIndex(_ => _.name === body.config);

    if (configIndex === -1) {
      throw new Error(`Message config with name '${body.config}' not found.`);
    }

    body.config = configIndex;
  } else if (!options.message[body.config]) {
    throw new Error(`Message config not found at index ${body.config}.`);
  }

  await transport.sendMail({
    ...omit(body, ['config', 'to', 'cc', 'bcc']),
    ...omit(options.message[body.config], ['name']),
  });
};
