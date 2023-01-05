import { useFetch } from '#app';
export default ((context, inject) => inject('mail', {
  send: async config => {
    try {
      await useFetch('/mail/send', {
        body: config,
        method: 'POST'
      });
    } catch (error) {
      throw new Error(error.response.data);
    }
  }
}));