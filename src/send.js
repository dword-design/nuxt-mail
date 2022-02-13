import { omit } from '@dword-design/functions'

export default async (message, options = {}) => {
  if (options.forceConfig) {
    message = { config: 0, ...message }
  }
  if (message.config !== undefined) {
    if (typeof message.config === 'string') {
      const configIndex = options.message.findIndex(
        _ => _.name === message.config
      )
      if (configIndex === -1) {
        throw new Error(
          `Message config with name '${message.config}' not found.`
        )
      }
      message.config = configIndex
    } else if (!options.message[message.config]) {
      throw new Error(`Message config not found at index ${message.config}.`)
    }
  }
  if (options.forceConfig && message.config === undefined) {
    throw new Error('You have to specify a config in your message.')
  }

  const configuredMessage = options.message[message.config] || {}
  await options.transport.sendMail({
    ...omit(['config', ...(options.forceConfig ? ['to', 'cc', 'bcc'] : [])])(
      message
    ),
    ...omit(['name'])(configuredMessage),
  })
}
