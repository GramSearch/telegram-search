import type { TelegramClient } from 'telegram'
import type { GetTelegramMessageParams, TelegramMessage } from '../../types'
import type { MessageConverter } from './utils/message-converter'

import { getConfig, useLogger } from '@tg-search/common'
import bigInt from 'big-integer'
import { Api } from 'telegram/tl'

import { ErrorHandler } from './utils/error-handler'

/**
 * Manager for Telegram takeout sessions
 * Handles initialization, message retrieval, and cleanup of takeout sessions
 */
export class TakeoutManager {
  private client: TelegramClient
  private messageConverter: MessageConverter
  private takeoutSession?: Api.account.Takeout
  private logger = useLogger()
  private errorHandler = new ErrorHandler()

  constructor(client: TelegramClient, messageConverter: MessageConverter) {
    this.client = client
    this.messageConverter = messageConverter
  }

  /**
   * Initialize takeout session for data export
   * @returns Takeout session ID
   */
  public async initTakeout(): Promise<Api.account.Takeout | null> {
    if (this.takeoutSession) {
      return this.takeoutSession
    }

    try {
      // Create new takeout session
      const result = await this.errorHandler.withRetry(
        () => this.client.invoke(new Api.account.InitTakeoutSession({
          contacts: true,
          messageUsers: true,
          messageChats: true,
          messageMegagroups: true,
          messageChannels: true,
          files: true,
          fileMaxSize: bigInt(1024 * 1024 * 1024), // 1GB
        })),
        {
          context: '初始化导出会话',
          maxRetries: 3,
          initialDelay: 2000,
          throwAfterRetries: false,
        },
      )

      if (result.success && result.data) {
        this.takeoutSession = result.data
        return this.takeoutSession
      }
      this.logger.debug(`fail to init takeout session`)
      return null
    }
    catch (error: any) {
      // Check if we need to wait
      if (error?.message?.includes('TAKEOUT_INIT_DELAY')) {
        this.logger.warn('Takeout session not available, using normal message fetch')
        return null
      }

      this.errorHandler.handleError(error, '初始化导出会话', '无法初始化导出会话')
      throw error
    }
  }

  /**
   * Finish takeout session
   */
  public async finishTakeout(): Promise<void> {
    if (!this.takeoutSession) {
      return
    }

    const appConfig = getConfig()
    // maxRetries = 0 means infinite retries
    const maxRetries = appConfig.message?.export?.maxTakeoutRetries ?? 3

    try {
      // Try to finish takeout session with proper retry logic
      // https://core.telegram.org/api/takeout
      const result = await this.errorHandler.withRetry(
        () => this.client.invoke(new Api.InvokeWithTakeout({
          takeoutId: this.takeoutSession!.id,
          query: new Api.account.FinishTakeoutSession({
            success: true,
          }),
        })),
        {
          context: '结束导出会话',
          maxRetries: maxRetries === 0 ? 10 : maxRetries, // If infinite retries is configured, use 10 as a reasonable limit
          initialDelay: 30 * 1000, // 30 seconds between retries
          throwAfterRetries: true,
        },
      )

      if (result.success) {
        this.takeoutSession = undefined
        this.logger.log('成功结束 takeout 会话')
      }
    }
    catch (error: any) {
      // Special handling for TAKEOUT_REQUIRED error
      if (error?.message?.includes('TAKEOUT_REQUIRED')) {
        this.logger.error('无法结束导出会话：服务器仍在处理导出请求')
      }
      else {
        this.errorHandler.handleError(error, '结束导出会话', '结束导出会话失败')
      }
      // Reset session anyway to avoid getting stuck
      this.takeoutSession = undefined
      throw error
    }
  }

  /**
   * Convert raw message to custom message type
   * @param message Raw message from Telegram API
   * @returns Custom message type
   */
  private convertToCustomMessage(message: any): Api.Message {
    // Basic message properties
    const baseProps = {
      id: message.id,
      date: message.date,
      message: message.message || '',
    }

    // Boolean flags with default false
    const booleanFlags = [
      'out',
      'mentioned',
      'mediaUnread',
      'silent',
      'post',
      'fromScheduled',
      'legacy',
      'editHide',
      'pinned',
      'noforwards',
    ].reduce((acc, key) => ({
      ...acc,
      [key]: message[key] || false,
    }), {})

    // Direct property mappings
    const directProps = [
      'peerId',
      'fwdFrom',
      'viaBotId',
      'replyTo',
      'media',
      'replyMarkup',
      'entities',
      'views',
      'forwards',
      'replies',
      'editDate',
      'postAuthor',
      'groupedId',
      'reactions',
      'restrictionReason',
      'ttlPeriod',
    ].reduce((acc, key) => ({
      ...acc,
      [key]: message[key],
    }), {})

    return new Api.Message({
      ...baseProps,
      ...booleanFlags,
      ...directProps,
    })
  }

  /**
   * Get messages using takeout API
   */
  public async* getMessages(
    chatId: number,
    limit: number,
    options?: GetTelegramMessageParams,
  ): AsyncGenerator<TelegramMessage> {
    let offsetId = 0
    let hasMore = true
    let processedCount = 0
    let hash: number = 0
    let lastBatchSize = 0
    const batchSize = 100 // 每次请求的消息数量

    try {
      // Initialize takeout session
      const takeoutSession = await this.initTakeout()
      if (!takeoutSession) {
        throw new Error('TAKEOUT_NOT_AVAILABLE')
      }

      while (hasMore) {
        // 计算本次请求的实际限制数量
        const requestLimit = Math.min(batchSize, limit - processedCount)

        // https://core.telegram.org/api/offsets
        const id = (chatId)
        hash = hash ^ (hash >> 21)
        hash = hash ^ (hash << 35)
        hash = hash ^ (hash >> 4)
        hash = hash + id

        this.logger.debug('获取takeout消息', {
          offsetId,
          minId: options?.minId,
          maxId: options?.maxId,
          processedCount,
          limit,
          requestLimit,
          lastBatchSize,
        })

        // Get messages using takeout
        const query = new Api.messages.GetHistory({
          peer: await this.client.getInputEntity(chatId),
          offsetId,
          addOffset: 0,
          limit: requestLimit,
          maxId: options?.maxId || 0,
          minId: options?.minId || 0,
          hash: bigInt(hash),
        })

        // Use error handler for API requests
        const apiResponse = await this.errorHandler.withRetry(
          () => this.client.invoke(
            new Api.InvokeWithTakeout({
              takeoutId: takeoutSession.id,
              query,
            }),
          ),
          {
            context: '获取聊天历史记录',
            maxRetries: 3,
            initialDelay: 2000,
          },
        )

        if (!apiResponse.success || !apiResponse.data) {
          this.logger.warn('获取消息请求失败或返回空数据')
          break
        }

        // 使用类型断言确保 result 是对象类型
        const result = apiResponse.data as Record<string, any>

        // 检查是否包含 messages 字段
        if (!result || typeof result !== 'object' || !('messages' in result)) {
          this.logger.warn('返回数据格式不正确，没有消息数组')
          break
        }

        const messages = result.messages as Api.Message[]
        lastBatchSize = messages.length

        // 如果没有获取到消息，或者消息数量小于请求数量，说明没有更多消息了
        if (messages.length === 0 || messages.length < requestLimit) {
          hasMore = false
        }

        let batchProcessedCount = 0 // 记录这一批次处理的消息数量
        for (const message of messages) {
          // 更新下一次请求的 offsetId
          offsetId = message.id

          // 检查是否达到边界条件
          if (options?.maxId && message.id >= options.maxId) {
            continue
          }
          if (options?.minId && message.id <= options.minId) {
            hasMore = false
            break
          }

          // Skip empty messages
          if (message instanceof Api.MessageEmpty) {
            continue
          }

          // Check time range
          const messageTime = new Date(message.date * 1000)
          if (options?.startTime && messageTime < options.startTime) {
            hasMore = false
            break
          }
          if (options?.endTime && messageTime > options.endTime) {
            continue
          }

          // Convert message to custom message type
          const customMessage = this.convertToCustomMessage(message)

          // If it's a media message, only get basic info without downloading files
          const converted = await this.messageConverter.convertMessage(customMessage, options?.skipMedia)

          // Check message type
          if (options?.messageTypes && !options.messageTypes.includes(converted.type)) {
            continue
          }

          yield converted
          processedCount++
          batchProcessedCount++

          // Check if we've reached the limit
          if (processedCount >= limit) {
            hasMore = false
            break
          }
        }

        // 如果这批次的消息都被过滤掉了，但还有更多消息，继续获取
        if (batchProcessedCount === 0 && hasMore && lastBatchSize > 0) {
          this.logger.debug('当前批次所有消息都被过滤，继续获取下一批', {
            offsetId,
            lastBatchSize,
            processedCount,
          })
          continue
        }
      }
    }
    catch (error: any) {
      this.errorHandler.handleError(error, '获取聊天消息', '获取聊天消息失败')
      throw error
    }
    finally {
      // Always finish takeout session
      await this.finishTakeout().catch((error) => {
        this.logger.withError(error).warn('结束导出会话时出现错误，但仍将继续')
      })
    }
  }

  /**
   * Check if takeout is available
   * @returns True if takeout is available
   */
  public isTakeoutSessionActive(): boolean {
    return !!this.takeoutSession
  }
}
