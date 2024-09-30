export const useMail = () => ({
  send: async config => {
    try {
      await $fetch('/mail/send', { body: config, method: 'POST' });
    } catch (error) {
      throw new Error(error.response._data.statusMessage);
    }
  },
});
