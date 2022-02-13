export default (context, inject) =>
  inject('mail', {
    send: async message => {
      try {
        await context.app.$axios.$post('/mail/send', message)
      } catch (error) {
        throw new Error(error.response.data)
      }
    },
  })
