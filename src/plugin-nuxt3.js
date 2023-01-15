import { defineNuxtPlugin, useFetch } from '#app'

export default defineNuxtPlugin(() => ({
  provide: {
    mail: {
      send: async config => {
        try {
          await useFetch('/mail/send', { body: config, method: 'POST' })
        } catch (error) {
          throw new Error(error.response.data)
        }
      },
    },
  },
}))
