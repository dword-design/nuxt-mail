import type { SendMailOptions } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface MailOptions {
  message: Message[];
  smtp: SMTPTransport.Options | null;
}

export type Message = Omit<SendMailOptions, 'to' | 'cc' | 'bcc'> &
  (
    | { to: SendMailOptions['to'] }
    | { cc: SendMailOptions['cc'] }
    | { bcc: SendMailOptions['bcc'] }
  ) & { name?: string };

export interface MailOptionsInput extends Omit<MailOptions, 'message'> {
  message: MailOptions['message'] | Message;
  smtp: SMTPTransport.Options;
}

export interface MessageWithConfig extends Message {
  config: number;
}

export interface MessageWithConfigInput extends Omit<
  MessageWithConfig,
  'config'
> {
  config?: MessageWithConfig['config'] | string;
}
