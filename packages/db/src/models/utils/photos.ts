import type { UUID } from 'node:crypto'

import type { CoreMessageMedia } from '../../../../core/src'
import type { photosTable } from '../../schemas/photos'

import { Buffer } from 'node:buffer'

export type DBInsertPhoto = typeof photosTable.$inferInsert
export type DBSelectPhoto = typeof photosTable.$inferSelect

export function bufferToBase64(buffer: Buffer<ArrayBufferLike>): string {
  return buffer.toString('base64')
}

export function base64ToBuffer(base64: string): Buffer<ArrayBufferLike> {
  return Buffer.from(base64, 'base64')
}

export function convertDBPhotoToCoreMessageMedia(dbPhoto: DBSelectPhoto): CoreMessageMedia {
  return {
    type: 'photo',
    messageUUID: dbPhoto.message_id as UUID,
    base64: dbPhoto.image_bytes ? bufferToBase64(dbPhoto.image_bytes) : undefined,
    path: dbPhoto.image_path || undefined,
  } satisfies CoreMessageMedia
}
