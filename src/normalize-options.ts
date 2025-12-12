import type { MailOptionsInput } from './types';

const normalizeMessage = (message: MailOptionsInput['message']) => {
  if (Array.isArray(message)) {
    return message;
  }

  return [message];
};

export default (options: MailOptionsInput) => ({
  ...options,
  message: normalizeMessage(options.message),
});
