import type { ClientAdapter } from '../adapter/client'

import { useLogger } from '@tg-search/common'

import { deleteAllFolders, updateFolder } from '../models/folder'
import { deleteAllChats, updateChat } from '../models/chat'

const logger = useLogger()

/**
 * Sync folders and chats from Telegram
 */
export async function sync(adapter: ClientAdapter) {
  logger.log('正在同步文件夹和会话信息...')

  try {
    // Clear existing data
    logger.debug('清理现有数据...')
    await deleteAllFolders()
    await deleteAllChats()
    logger.debug('数据清理完成')

    // Sync folders
    logger.log('正在同步文件夹...')
    const newFolders = await adapter.getFolders()
    logger.debug(`获取到 ${newFolders.length} 个文件夹`)

    for (const folder of newFolders) {
      try {
        const result = await updateFolder(folder)
        logger.debug(`已同步文件夹: ${folder.emoji || ''} ${folder.title} (ID: ${folder.id})`)
        if (!result || result.length === 0) {
          logger.warn(`文件夹 ${folder.title} 同步失败`)
        }
      }
      catch (error) {
        logger.withError(error).warn(`同步文件夹失败: ${folder.title}`)
      }
    }
    logger.log(`共同步了 ${newFolders.length} 个文件夹`)

    // Sync chats
    logger.log('正在同步会话...')
    const newChats = await adapter.getChats()
    logger.debug(`获取到 ${newChats.length} 个会话`)

    for (const chat of newChats) {
      try {
        const result = await updateChat(chat)
        logger.debug(`已同步会话: [${chat.type}] ${chat.name} (ID: ${chat.id})`)
        if (!result || result.length === 0) {
          logger.warn(`会话 ${chat.name} 同步失败`)
        }
      }
      catch (error) {
        logger.withError(error).warn(`同步会话失败: ${chat.name}`)
      }
    }
    logger.log(`共同步了 ${newChats.length} 个会话`)

    logger.log('同步完成')
  }
  catch (error) {
    logger.withError(error).error('同步失败')
    throw error
  }
}
