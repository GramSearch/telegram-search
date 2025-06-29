// https://github.com/moeru-ai/airi/blob/main/services/telegram-bot/src/models/stickers.ts

import { Ok } from '@tg-search/common/utils/monad'
import { desc, eq } from 'drizzle-orm'

import { withDb } from '../drizzle'
import { recentSentStickersTable, stickersTable } from '../schema'

export async function findStickerDescription(fileId: string) {
  const sticker = await findStickerByFileId(fileId)
  if (sticker == null) {
    return ''
  }

  return sticker.description
}

export async function findStickerByFileId(fileId: string) {
  const sticker = (await withDb(db => db
    .select()
    .from(stickersTable)
    .where(eq(stickersTable.file_id, fileId))
    .limit(1),
  )).expect('Failed to find sticker by file ID')

  if (sticker.length === 0) {
    return undefined
  }

  return sticker[0]
}

export async function recordSticker(stickerBase64: string, fileId: string, filePath: string, description: string, name: string, emoji: string, label: string) {
  (await withDb(async db => Ok(await db
    .insert(stickersTable)
    .values({
      platform: 'telegram',
      file_id: fileId,
      image_base64: stickerBase64,
      image_path: filePath,
      description,
      name,
      emoji,
      label,
    })),
  )).expect('Failed to record sticker')
}

export async function listRecentSentStickers() {
  return (await withDb(db => db
    .select()
    .from(recentSentStickersTable)
    .orderBy(desc(recentSentStickersTable.created_at)),
  )).expect('Failed to list recent sent stickers')
}
