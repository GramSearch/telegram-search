// https://github.com/moeru-ai/airi/blob/main/services/telegram-bot/src/models/photos.ts

import type { CoreMessageMedia } from '../../../core/src'
import type { DBInsertPhoto } from './utils/photos'

import { eq, inArray } from 'drizzle-orm'

import { withDb } from '../drizzle'
import { photosTable } from '../schemas/photos'

export async function recordPhotos(media: CoreMessageMedia[]) {
  if (media.length === 0) {
    return
  }

  const dataToInsert = media.map(
    media => ({
      platform: 'telegram',
      file_id: '',
      message_id: media.messageUUID,
      image_bytes: media.byte,
      image_path: media.path,
      description: '',
    } satisfies DBInsertPhoto),
  )

  return withDb(async db => db
    .insert(photosTable)
    .values(dataToInsert)
    .returning(),
  )
}

export async function findPhotosByMessageId(messageUUID: string) {
  return withDb(db => db
    .select()
    .from(photosTable)
    .where(eq(photosTable.message_id, messageUUID)),
  )
}

export async function findPhotosByMessageIds(messageUUIDs: string[]) {
  return withDb(db => db
    .select()
    .from(photosTable)
    .where(inArray(photosTable.message_id, messageUUIDs)),
  )
}
