export default ((context, inject) => inject('mail', {
  send: async config => {
    try {
      await context.app.$axios.$post('/mail/send', config);
    } catch (error) {
      throw new Error(error.response.data);
    }
  }
}));