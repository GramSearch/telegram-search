import type { Buffer } from 'node:buffer'
import type { UUID } from 'node:crypto'

import type { Result } from '@tg-search/common/utils/monad'

import { randomUUID } from 'node:crypto'

import { Err, Ok } from '@tg-search/common/utils/monad'
import { Api } from 'telegram'

export interface CoreMessage {
  uuid: UUID

  platform: 'telegram'
  platformMessageId: string
  chatId: string

  fromId: string
  fromName: string

  content: string
  media?: CoreMessageMedia[]

  reply: CoreMessageReply
  forward: CoreMessageForward
  vectors: CoreMessageVector
  jiebaTokens: string[]

  platformTimestamp: number
  createdAt?: number
  updatedAt?: number
  deletedAt?: number
}

export type CoreMessageMediaTypes = 'photo' | 'sticker' | 'unknown'

export interface CoreMessageMedia {
  type: CoreMessageMediaTypes
  messageUUID?: UUID
  base64: string | undefined
  path?: string
  byte?: Buffer<ArrayBufferLike> | undefined
  apiMedia?: unknown // Api.TypeMessageMedia
}

export function parseMediaType(apiMedia: Api.TypeMessageMedia): CoreMessageMediaTypes {
  switch (true) {
    case apiMedia instanceof Api.MessageMediaPhoto:
      return 'photo'
    default:
      return 'unknown'
  }
}

export interface CoreMessageReply {
  isReply: boolean
  replyToId?: string
  replyToName?: string
}

export interface CoreMessageForward {
  isForward: boolean
  forwardFromChatId?: string
  forwardFromChatName?: string
  forwardFromMessageId?: string
}

export interface CoreMessageVector {
  vector1536?: number[]
  vector1024?: number[]
  vector768?: number[]
}

export function convertToCoreMessage(message: Api.Message): Result<CoreMessage> {
  const sender = message.sender
  const senderId = message.senderId
  if ((!sender && !senderId) || (sender instanceof Api.UserEmpty) || (sender instanceof Api.ChatEmpty)) {
    return Err(new Error(`Message ${message.id} has no sender or sender is empty`))
  }

  let fromName = ''
  if (sender instanceof Api.User) {
    if ([sender.firstName, sender.lastName].some(Boolean)) {
      fromName = [sender.firstName, sender.lastName].join(' ')
    }
    else {
      fromName = sender.username ?? String(sender.id)
    }
  }
  else {
    fromName = sender?.title ?? String(senderId)
  }

  let chatId = ''
  if (message.peerId instanceof Api.PeerUser) {
    chatId = String(message.peerId.userId.toJSNumber())
  }
  else if (message.peerId instanceof Api.PeerChat) {
    chatId = String(message.peerId.chatId.toJSNumber())
  }
  else if (message.peerId instanceof Api.PeerChannel) {
    chatId = String(message.peerId.channelId.toJSNumber())
  }

  const messageId = String(message.id)
  const fromId = String(senderId?.toJSNumber())
  const content = message.message

  // Get forward info
  const forward: CoreMessageForward = {
    isForward: !!message.fwdFrom,
    forwardFromChatId: message.fwdFrom?.fromId instanceof Api.PeerChannel
      ? message.fwdFrom.fromId.channelId.toString()
      : undefined,
    forwardFromChatName: undefined, // Needs async channel lookup
    forwardFromMessageId: message.fwdFrom?.channelPost?.toString(),
  }

  // Get reply info
  const reply: CoreMessageReply = {
    isReply: !!message.replyTo,
    replyToId: message.replyTo?.replyToMsgId?.toString(),
    replyToName: undefined, // Needs async user lookup
  }

  // Waiting for media resolver to fetch media
  const media: CoreMessageMedia[] = []
  if (message.media) {
    media.push({
      type: parseMediaType(message.media),
      apiMedia: message.media,
      base64: undefined,
    })
  }

  return Ok(
    {
      uuid: randomUUID(),
      platform: 'telegram',
      platformMessageId: messageId,
      chatId,
      fromId,
      fromName,
      content,
      media,
      reply,
      forward,
      vectors: {
        vector1536: [],
        vector1024: [],
        vector768: [],
      },
      jiebaTokens: [],
      platformTimestamp: message.date,
    } satisfies CoreMessage,
  )
}
