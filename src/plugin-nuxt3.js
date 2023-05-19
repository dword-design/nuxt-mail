import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(() => ({
  provide: {
    mail: {
      send: async config => {
        try {
          await $fetch('/mail/send', { body: config, method: 'POST' })
        } catch (error) {
          throw new Error(error.response._data.statusMessage)
        }
      },
    },
  },
}))
