// https://github.com/moeru-ai/airi/blob/main/services/telegram-bot/src/models/photos.ts

import type { CoreMessageMedia } from '../../../core/src'

import { Ok } from '@tg-search/common/utils/monad'
import { eq, inArray } from 'drizzle-orm'

import { withDb } from '../drizzle'
import { photosTable } from '../schemas/photos'

export async function recordPhotosByMessages(media: CoreMessageMedia[]) {
  (await withDb(async db => Ok(await db
    .insert(photosTable)
    .values(media.map(media => ({
      platform: 'telegram',
      file_id: '',
      message_id: media.messageId,
      image_base64: media.base64,
      image_path: media.path,
      description: '',
    })),
    )),
  )).expect('Failed to record photo')
}

export async function findPhotosByMessageId(messageId: string) {
  return (await withDb(db => db
    .select()
    .from(photosTable)
    .where(eq(photosTable.message_id, messageId)),
  )).expect('Failed to find photos by message ID')
}

export async function findPhotosByMessageIds(messageIds: string[]) {
  return (await withDb(db => db
    .select()
    .from(photosTable)
    .where(inArray(photosTable.message_id, messageIds)),
  )).expect('Failed to find photos by message IDs')
}
