export default (context, inject) => {
  inject('mail', {
    send: config => context.app.$axios.$post('/mail/send', config),
  })
}
