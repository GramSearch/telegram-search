import type { App, H3Event } from 'h3'
import type { SearchParams } from '../types'

import { useLogger } from '@tg-search/common'
import { createRouter, defineEventHandler, readBody } from 'h3'

import { CommandManager } from '../services/command-manager'
import { embedCommandSchema } from '../services/commands/embed'
import { exportCommandSchema } from '../services/commands/export'
import { searchCommandSchema } from '../services/commands/search'
import { syncChatsCommandSchema } from '../services/commands/syncChats'
import { syncMetadataCommandSchema } from '../services/commands/syncMetadata'
import { useTelegramClient } from '../services/telegram'
import { createSSEResponse } from '../utils/sse'

const logger = useLogger()

/**
 * Setup command routes
 */
export function setupCommandRoutes(app: App) {
  const commandRouter = createRouter()
  const commandManager = new CommandManager()

  commandRouter.post('/search', defineEventHandler(async (event: H3Event) => {
    const body = await readBody<SearchParams>(event)
    const validatedBody = searchCommandSchema.parse(body)

    logger.withFields(validatedBody).debug('Search request received')

    return createSSEResponse(async (controller) => {
      await commandManager.executeCommand('search', null, validatedBody, controller)
    })
  }))

  commandRouter.post('/sync', defineEventHandler(async (event: H3Event) => {
    const body = await readBody(event)
    const vaildatedBody = syncMetadataCommandSchema.parse(body)
    logger.withFields(vaildatedBody).debug('Sync metadata request received')

    const client = await useTelegramClient()
    if (!await client.isConnected()) {
      await client.connect()
    }

    const params = { ...vaildatedBody }
    return createSSEResponse(async (controller) => {
      await commandManager.executeCommand('syncMetadata', client, params, controller)
    })
  }))

  // Add multi-sync route
  commandRouter.post('/sync-chats', defineEventHandler(async (event: H3Event) => {
    const body = await readBody(event)
    const vaildatedBody = syncChatsCommandSchema.parse(body)
    logger.withFields(vaildatedBody).debug('Sync chats request received')

    const client = await useTelegramClient()
    if (!await client.isConnected()) {
      await client.connect()
    }

    const params = { ...vaildatedBody }
    return createSSEResponse(async (controller) => {
      await commandManager.executeCommand('syncChats', client, params, controller)
    })
  }))

  commandRouter.post('/export', defineEventHandler(async (event: H3Event) => {
    const body = await readBody(event)
    const validatedBody = exportCommandSchema.parse(body)

    logger.withFields(validatedBody).debug('Export request received')

    const client = await useTelegramClient()
    if (!await client.isConnected()) {
      await client.connect()
    }

    // Get chat metadata
    const chats = await client.getDialogs()
    const chat = chats.find(c => c.id === validatedBody.chatId)
    if (!chat) {
      throw new Error(`Chat ${validatedBody.chatId} not found`)
    }

    // Parse params
    const params = {
      ...validatedBody,
      startTime: validatedBody.startTime ? new Date(validatedBody.startTime) : undefined,
      endTime: validatedBody.endTime ? new Date(validatedBody.endTime) : undefined,
      chatMetadata: {
        id: chat.id,
        title: chat.title,
        type: chat.type,
      },
    }

    // Execute export with SSE
    return createSSEResponse(async (controller) => {
      await commandManager.executeCommand('export', client, params, controller)
    })
  }))

  // Add embed route
  commandRouter.post('/embed', defineEventHandler(async (event: H3Event) => {
    const body = await readBody(event)
    const validatedBody = embedCommandSchema.parse(body)

    logger.withFields(validatedBody).debug('Embed request received')

    const client = await useTelegramClient()
    if (!await client.isConnected()) {
      await client.connect()
    }

    // Get chat metadata to verify chat exists
    const chats = await client.getDialogs()
    const chat = chats.find(c => c.id === validatedBody.chatId)
    if (!chat) {
      throw new Error(`Chat ${validatedBody.chatId} not found`)
    }

    // Execute embed command with SSE
    return createSSEResponse(async (controller) => {
      await commandManager.executeCommand('embed', client, validatedBody, controller)
    })
  }))

  // Mount routes
  app.use('/commands', commandRouter.handler)
}
