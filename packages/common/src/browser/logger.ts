import { Format, LogLevel, setGlobalFormat, setGlobalLogLevel, useLogg } from '@guiiai/logg'
import ErrorStackParser from 'error-stack-parser'
import path from 'path-browserify-esm'

import { isBrowser } from './browser'
import { flags } from './flags'

export type Logger = ReturnType<typeof useLogg>
export { Format as LoggerFormat, LogLevel as LoggerLevel }

export function initLogger(
  level = flags.logLevel,
  format = flags.logFormat,
) {
  setGlobalLogLevel(level)
  setGlobalFormat(format)

  const logger = useLogg('logger').useGlobalConfig()
  logger.withFields({ level: LogLevel[level], format }).log('Logger initialized')
}

export function circularStringify(object: Record<string, any>) {
  const simpleObject: Record<string, any> = {}
  for (const prop in object) {
    if (!Object.prototype.hasOwnProperty.call(object, prop)) {
      continue
    }
    if (typeof (object[prop]) === 'object') {
      continue
    }
    if (typeof (object[prop]) == 'function') {
      continue
    }
    simpleObject[prop] = object[prop]
  }
  return JSON.stringify(simpleObject)
}

export function circularObject(object: Record<string, any>) {
  return JSON.parse(circularStringify(object))
}

export function useLogger(name?: string): Logger {
  // eslint-disable-next-line unicorn/error-message
  const stack = ErrorStackParser.parse(new Error())
  const currentStack = stack[1]
  const basePath = currentStack.fileName?.replace('async', '').trim() || ''
  const fileName = path.join(...basePath.split(path.sep).slice(-2))

  const nameToDisplay = name || `${fileName}:${currentStack.lineNumber}`
  const hyperlink = !isBrowser() ? `\x1B]8;;file://${basePath}\x1B\\${nameToDisplay}\x1B]8;;\x1B\\` : nameToDisplay
  return useLogg(hyperlink).useGlobalConfig()
}
