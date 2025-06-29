import type { Result } from '@tg-search/common/utils/monad'
import type { Api } from 'telegram'

import type { MessageResolver, MessageResolverOpts } from '.'
import type { CoreContext } from '../context'
import type { CoreMessage, CoreMessageMedia } from '../utils/message'

import { Buffer } from 'node:buffer'
import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { useLogger } from '@tg-search/common'
import { getMediaPath, useConfig } from '@tg-search/common/node'
import { Err, Ok } from '@tg-search/common/utils/monad'

async function resolveMedia(data: string | Buffer<ArrayBufferLike> | undefined): Promise<Result<string | undefined>> {
  try {
    if (!data)
      return Ok(undefined)

    let buffer: Buffer

    if (typeof data === 'string') {
      return Ok(data)
    }

    if (data && typeof data === 'object' && 'type' in data && data.type === 'Buffer' && 'data' in data) {
      buffer = Buffer.from(data.data as ArrayBufferLike)
    }
    else if (data instanceof ArrayBuffer) {
      buffer = Buffer.from(data)
    }
    else {
      throw new TypeError('Unsupported media format')
    }

    return Ok(buffer.toString('base64'))
  }
  catch (error) {
    return Err(new Error('Error processing media', { cause: error }))
  }
}

export function createMediaResolver(ctx: CoreContext): MessageResolver {
  const logger = useLogger('core:resolver:media')
  const { getClient } = ctx

  const mediaPath = getMediaPath(useConfig().path.storage)

  async function useUserMediaPath() {
    const userId = (await getClient().getMe()).id.toString()
    const userMediaPath = join(mediaPath, userId)
    if (!existsSync(userMediaPath)) {
      mkdirSync(userMediaPath, { recursive: true })
    }

    return userMediaPath
  }

  return {
    run: async (opts: MessageResolverOpts) => {
      logger.verbose('Executing media resolver')

      const resolvedMessages = await Promise.all(
        opts.messages.map(async (message) => {
          if (!message.media || message.media.length === 0)
            return message

          const fetchedMedia = await Promise.all(
            message.media.map(async (media) => {
              logger.withFields({ media }).debug('Media')

              const userMediaPath = join(await useUserMediaPath(), message.chatId.toString())
              if (!existsSync(userMediaPath)) {
                mkdirSync(userMediaPath, { recursive: true })
              }

              const mediaFetched = await ctx.getClient().downloadMedia(media.apiMedia as Api.TypeMessageMedia)

              const mediaPath = join(userMediaPath, message.platformMessageId)
              logger.withFields({ mediaPath }).verbose('Media path')
              if (mediaFetched instanceof Buffer) {
                // write file to disk async
                void writeFile(mediaPath, mediaFetched)
              }

              return {
                apiMedia: media.apiMedia,
                base64: (await resolveMedia(mediaFetched)).orUndefined(),
                type: media.type,
                messageId: media.messageId,
                path: mediaPath,
              } satisfies CoreMessageMedia
            }),
          )

          return {
            ...message,
            media: fetchedMedia,
          } satisfies CoreMessage
        }),
      )

      return Ok(resolvedMessages)
    },
  }
}
