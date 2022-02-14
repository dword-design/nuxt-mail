import axios from 'axios'

export default (context, inject) =>
  inject('mail', {
    send: async (configName, message) => {
      try {
        await axios.post('/mail/send', { configName, message })
      } catch (error) {
        throw new Error(error.response.data)
      }
    },
  })
