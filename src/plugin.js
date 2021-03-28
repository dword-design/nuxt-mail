import options from './options'

export default (context, inject) => {
  inject('mail', {
    send: config =>
      context.app.$axios.$post('/mail/send', {
        ...config,
        bcc: options.bcc,
        cc: options.cc,
        to: options.to,
      }),
  })
}
