import type { ClientState } from '../app'
import type { WsMessage } from './ws-event'

import { useLogger } from '@tg-search/common'

import { sendWsError, sendWsEvent } from './ws-event'

export function handleConnectionEvent(
  state: ClientState,
  message: WsMessage,
) {
  const logger = useLogger()

  const { peer, ctx } = state
  if (!ctx) {
    sendWsError(peer, 'Client not initialized')
    return
  }

  const { emitter } = ctx

  logger.withFields(message).debug('handleConnectionEvent')

  switch (message.type) {
    case 'auth:login':
      emitter.emit('auth:login', message.data)

      emitter.once('auth:connected', () => {
        sendWsEvent(peer, 'auth:connected', {})
      })

      emitter.once('auth:needCode', () => {
        sendWsEvent(peer, 'auth:needCode', undefined)
      })
      emitter.once('auth:needPassword', () => {
        sendWsEvent(peer, 'auth:needPassword', undefined)
      })
      break
    case 'auth:code':
      emitter.emit('auth:code', message.data)
      break
    case 'auth:password':
      emitter.emit('auth:password', message.data)
      break
    case 'auth:logout':
      emitter.emit('auth:logout')
      break
    default:
      message.type.startsWith('auth:') && sendWsError(peer, 'Unknown message type')
  }
}
