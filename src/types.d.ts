import type { SendMailOptions, TransportOptions } from 'nodemailer';

export interface MailOptions {
  message: Message[];
  smtp: TransportOptions | null;
}

export interface Message extends Omit<SendMailOptions, 'to' | 'cc' | 'bcc'> {
  to: SendMailOptions['to'];
  cc: SendMailOptions['cc'];
  bcc: SendMailOptions['bcc'];
  name?: string;
}

export interface MailOptionsInput extends Omit<MailOptions, 'message'> {
  message: MailOptions['message'] | Message;
  smtp: TransportOptions;
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
