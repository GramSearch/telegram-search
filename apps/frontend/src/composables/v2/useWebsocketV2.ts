import type { WsEventToServer, WsMessageToClient } from '@tg-search/server'

import { useWebSocket } from '@vueuse/core'
import { watch } from 'vue'

import { WS_API_BASE } from '../../constants'
import { useConnectionStore } from './useConnection'

let wsContext: ReturnType<typeof createWebsocketV2Context>

export function createWebsocketV2Context(sessionId?: string) {
  const url = sessionId ? `${WS_API_BASE}?sessionId=${sessionId}` : WS_API_BASE
  const socket = useWebSocket<string>(url.toString())
  const connectionStore = useConnectionStore()

  function createWsMessage<T extends keyof WsEventToServer>(
    type: T,
    data: Parameters<WsEventToServer[T]>[0],
  ): Extract<WsMessageToClient, { type: T }> {
    return { type, data } as Extract<WsMessageToClient, { type: T }>
  }

  // https://github.com/moeru-ai/airi/blob/b55a76407d6eb725d74c5cd4bcb17ef7d995f305/apps/realtime-audio/src/pages/index.vue#L29-L37
  function sendEvent<T extends keyof WsEventToServer>(event: T, data: Parameters<WsEventToServer[T]>[0]) {
    // eslint-disable-next-line no-console
    console.log('[WebSocket] Sending event', event, data)

    socket.send(JSON.stringify(createWsMessage(event, data)))
  }

  // https://github.com/moeru-ai/airi/blob/b55a76407d6eb725d74c5cd4bcb17ef7d995f305/apps/realtime-audio/src/pages/index.vue#L95-L123
  watch(socket.data, (rawMessage) => {
    if (!rawMessage)
      return

    try {
      const message = JSON.parse(rawMessage)

      // eslint-disable-next-line no-console
      console.log('[WebSocket] Message received', message)

      try {
        switch (message.type) {
          case 'server:connected':
            connectionStore.setConnection(message.data.sessionId, {})
            connectionStore.activeSessionId = message.data.sessionId
            break

          case 'auth:needCode':
            connectionStore.auth.needCode = true
            break

          case 'auth:needPassword':
            connectionStore.auth.needPassword = true
            break

          default:
          // eslint-disable-next-line no-console
            console.log('[WebSocket] Unknown message', message)
        }
      }
      catch (error) {
        console.error('[WebSocket] Failed to process message', error)
      }
    }
    catch {
      console.error('[WebSocket] Invalid message', rawMessage)
    }
  })

  return {
    sendEvent,
  }
}

export function useWebsocketV2(sessionId?: string) {
  if (!wsContext)
    wsContext = createWebsocketV2Context(sessionId)

  return wsContext
}
