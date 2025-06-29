import type { CorePagination } from '@tg-search/common/utils/pagination'
// https://github.com/moeru-ai/airi/blob/main/services/telegram-bot/src/models/chat-message.ts

import type { CoreMessage } from '../../../core/src'
import type { DBRetrievalMessages } from './utils/message'

import { Ok } from '@tg-search/common/utils/monad'
import { desc, eq } from 'drizzle-orm'

import { withDb } from '../drizzle'
import { chatMessagesTable } from '../schemas/chat_messages'
import { findPhotosByMessageIds, recordPhotosByMessages } from './photos'
import { convertToCoreMessageFromDB, convertToDBInsertMessage } from './utils/message'
import { convertDBPhotoToCoreMessageMedia } from './utils/photos'
import { retrieveJieba } from './utils/retrieve-jieba'
import { retrieveVector } from './utils/retrieve-vector'

export async function recordMessages(messages: CoreMessage[]) {
  const dbMessages = messages.map(convertToDBInsertMessage)

  if (dbMessages.length === 0) {
    return
  }

  return withDb(async db => db
    .insert(chatMessagesTable)
    .values(dbMessages)
    .onConflictDoNothing({
      // TODO: on conflict replace
      target: [chatMessagesTable.platform, chatMessagesTable.platform_message_id, chatMessagesTable.in_chat_id],
    }),
  )
}

export async function recordMessagesWithPhotos(messages: CoreMessage[]): Promise<void> {
  if (messages.length === 0) {
    return
  }

  // First, record the messages
  await recordMessages(messages)

  // Then, collect and record photos that are linked to messages
  const allPhotoMedia = messages
    .filter(message => message.media && message.media.length > 0)
    .flatMap(message =>
      message.media?.filter(media => media.type === 'photo') || [],
    )

  if (allPhotoMedia.length > 0) {
    await recordPhotosByMessages(allPhotoMedia)
  }
}

export async function fetchMessages(chatId: string, pagination: CorePagination): Promise<CoreMessage[]> {
  const dbMessagesResults = (await withDb(db => db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.in_chat_id, chatId))
    .orderBy(desc(chatMessagesTable.created_at))
    .limit(pagination.limit)
    .offset(pagination.offset),
  )).expect('Failed to fetch messages')

  const coreMessages = dbMessagesResults.map(convertToCoreMessageFromDB)

  return coreMessages
}

export async function fetchMessagesWithPhotos(chatId: string, pagination: CorePagination) {
  const dbMessagesResults = (await withDb(db => db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.in_chat_id, chatId))
    .orderBy(desc(chatMessagesTable.created_at))
    .limit(pagination.limit)
    .offset(pagination.offset),
  )).expect('Failed to fetch messages')

  const coreMessages = dbMessagesResults.map(convertToCoreMessageFromDB)

  // Fetch photos for all messages in batch
  const messageIds = dbMessagesResults.map(msg => msg.id)
  const photos = await findPhotosByMessageIds(messageIds)

  // Group photos by message_id
  const photosByMessage = Object.groupBy(
    photos.filter(photo => photo.message_id),
    photo => photo.message_id!,
  )

  // Attach photos to messages with proper type conversion
  return Ok(coreMessages.map((message, index) => ({
    ...message,
    media: (photosByMessage[dbMessagesResults[index].id] || [])
      .map(convertDBPhotoToCoreMessageMedia),
  }) satisfies CoreMessage))
}

export async function retrieveMessages(
  chatId: string | undefined,
  content: {
    text?: string
    embedding?: number[]
  },
  pagination?: CorePagination,
) {
  const retrievalMessages: DBRetrievalMessages[] = []

  if (content.text) {
    const relevantMessages = await retrieveJieba(chatId, content.text, pagination)
    retrievalMessages.push(...relevantMessages)
  }

  if (content.embedding && content.embedding.length !== 0) {
    const relevantMessages = await retrieveVector(chatId, content.embedding, pagination)
    retrievalMessages.push(...relevantMessages)
  }

  return Ok(retrievalMessages)
}
