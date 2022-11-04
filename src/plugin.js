export default (context, inject) =>
  inject('mail', {
    send: async config => {
      try {
        if (typeof useFetch === 'undefined') {
          await context.app.$axios.$post('/mail/send', config)
        } else {
          await useFetch('/mail/send', { body: config, method: 'POST' })
        }
      } catch (error) {
        throw new Error(error.response.data)
      }
    },
  })
