import { flatMap, omit } from '@dword-design/functions'

export default async (...args) => {
  const argsWithoutOptions = args.slice(0, -1)

  const configName = argsWithoutOptions.find(arg => typeof arg === 'string')

  const message = argsWithoutOptions.find(arg => typeof arg === 'object') || {}
  let options = args[args.length - 1]
  options = { configs: {}, ...options }
  if (options.clientSideCall && configName === undefined) {
    throw new Error('You have to specify a config in your message.')
  }
  if (configName !== undefined && options.configs[configName] === undefined) {
    throw new Error(`Message config with name '${configName}' not found.`)
  }

  const config = options.configs[configName]
  let processedMessages = await (() => {
    if (config === undefined) {
      return message
    }
    if (typeof config === 'function') {
      return config(message)
    }

    return flatMap(_message =>
      [].concat(config).map(configMessage => ({
        ...configMessage,
        ...omit(options.clientSideCall ? ['to', 'cc', 'bcc'] : [])(_message),
      }))
    )([].concat(message))
  })()
  if (!Array.isArray(processedMessages)) {
    processedMessages = [processedMessages]
  }
  await Promise.all(
    processedMessages.map(_message => options.transport.sendMail(_message))
  )
}
