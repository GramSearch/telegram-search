// https://github.com/moeru-ai/airi/blob/main/services/telegram-bot/src/db/schema.ts

import { bigint, index, pgTable, text, uuid, vector } from 'drizzle-orm/pg-core'

export const stickersTable = pgTable('stickers', {
  id: uuid().primaryKey().defaultRandom(),
  platform: text().notNull().default(''),
  name: text().notNull().default(''),
  emoji: text().notNull().default(''),
  label: text().notNull().default(''),
  file_id: text().notNull().default(''),
  image_base64: text().notNull().default(''),
  image_path: text().notNull().default(''),
  description: text().notNull().default(''),
  created_at: bigint({ mode: 'number' }).notNull().default(0).$defaultFn(() => Date.now()),
  updated_at: bigint({ mode: 'number' }).notNull().default(0).$defaultFn(() => Date.now()),
  description_vector_1536: vector({ dimensions: 1536 }),
  description_vector_1024: vector({ dimensions: 1024 }),
  description_vector_768: vector({ dimensions: 768 }),
}, table => [
  index('stickers_description_vector_1536_index').using('hnsw', table.description_vector_1536.op('vector_cosine_ops')),
  index('stickers_description_vector_1024_index').using('hnsw', table.description_vector_1024.op('vector_cosine_ops')),
  index('stickers_description_vector_768_index').using('hnsw', table.description_vector_768.op('vector_cosine_ops')),
])
