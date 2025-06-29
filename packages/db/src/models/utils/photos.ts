import type { UUID } from 'node:crypto'

import type { CoreMessageMedia } from '../../../../core/src'
import type { photosTable } from '../../schemas/photos'

export type DBSelectPhoto = typeof photosTable.$inferSelect

export function convertDBPhotoToCoreMessageMedia(dbPhoto: DBSelectPhoto): CoreMessageMedia {
  return {
    type: 'photo',
    messageUUID: dbPhoto.message_id as UUID,
    base64: dbPhoto.image_base64 || undefined,
    path: dbPhoto.image_path || undefined,
  } satisfies CoreMessageMedia
}
