import type { SendMailOptions } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { RequireAtLeastOne } from 'type-fest';

export type Message = RequireAtLeastOne<
  SendMailOptions,
  'to' | 'cc' | 'bcc'
> & { name?: string };

export interface MailOptions {
  message: Message[];
  smtp: SMTPTransport.Options | null;
}

export interface MailOptionsInput extends Omit<MailOptions, 'message'> {
  message: MailOptions['message'] | Message;
  smtp: SMTPTransport.Options;
}

export interface MessageWithConfig extends Omit<
  SendMailOptions,
  'to' | 'cc' | 'bcc'
> {
  config: number;
}

export interface MessageWithConfigInput extends Omit<
  MessageWithConfig,
  'config'
> {
  config?: MessageWithConfig['config'] | string;
}
