import defaults from '@dword-design/defaults';
import { omit } from 'lodash-es';
import type { Transporter } from 'nodemailer';

import type {
  MailOptions,
  MessageWithConfig,
  MessageWithConfigInput,
} from './types';

const resolveConfig = (
  bodyInput: MessageWithConfigInput,
  options: MailOptions,
): MessageWithConfig => {
  const bodyWithDefaults = defaults(bodyInput, { config: 0 });

  if (typeof bodyWithDefaults.config === 'string') {
    const configIndex = options.message.findIndex(
      _ => _.name === bodyWithDefaults.config,
    );

    if (configIndex === -1) {
      throw new Error(
        `Message config with name '${bodyWithDefaults.config}' not found.`,
      );
    }

    return { ...bodyWithDefaults, config: configIndex };
  }

  return bodyWithDefaults as MessageWithConfig; // TODO: For some reason TypeScript doesn't detect that config cannot be a string here anymore
};

export default async (
  bodyInput: MessageWithConfigInput,
  options: MailOptions,
  transport: Transporter,
) => {
  const body = resolveConfig(bodyInput, options);

  if (!options.message[body.config]) {
    throw new Error(`Message config not found at index ${body.config}.`);
  }

  await transport.sendMail({
    ...omit(body, ['config', 'to', 'cc', 'bcc']),
    ...omit(options.message[body.config], ['name']),
  });
};
