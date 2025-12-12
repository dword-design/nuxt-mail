import type { MailOptions } from './types';

export default (options: MailOptions) => {
  if (!options.smtp) {
    throw new Error('SMTP config is missing.');
  }

  if (options.message.length === 0) {
    throw new Error('You have to provide at least one config.');
  }

  if (options.message.some(c => !c.to && !c.cc && !c.bcc)) {
    throw new Error('You have to provide to/cc/bcc in all configs.');
  }
};
