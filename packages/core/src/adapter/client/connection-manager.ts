import type { ConnectOptions } from '../../types'
import type { SessionManager } from './session-manager'

import { useLogger } from '@tg-search/common'
import { Api, TelegramClient } from 'telegram'

import { ErrorHandler } from './utils/error-handler'

/**
 * Manager for Telegram client connection
 * Handles connection establishment, authentication and session management
 */
export class ConnectionManager {
  private client: TelegramClient
  private sessionManager: SessionManager
  private logger = useLogger()
  private errorHandler = new ErrorHandler()
  private apiId: number
  private apiHash: string
  private phoneNumber: string

  constructor(sessionManager: SessionManager, apiId: number, apiHash: string, phoneNumber: string) {
    this.sessionManager = sessionManager
    this.apiId = apiId
    this.apiHash = apiHash
    this.phoneNumber = phoneNumber

    // Create client with session
    this.client = new TelegramClient(
      this.sessionManager.getSession(),
      apiId,
      apiHash,
      { connectionRetries: 5 },
    )
  }

  /**
   * Get the Telegram client instance
   */
  public getClient(): TelegramClient {
    return this.client
  }

  /**
   * Check if the client is connected and authorized
   */
  public async isConnected(): Promise<boolean> {
    try {
      return await this.errorHandler.withRetry(
        () => this.client.isUserAuthorized(),
        {
          context: '检查连接状态',
          maxRetries: 2,
          initialDelay: 500,
          throwAfterRetries: false,
        },
      ).then(result => result.success && result.data === true)
    }
    catch (error) {
      this.logger.withError(error).error('检查连接状态失败')
      return false
    }
  }

  /**
   * Connect to Telegram and authenticate with verification code
   * This is the second step of the authentication process
   */
  public async connect(options?: ConnectOptions): Promise<void> {
    try {
      // 加载会话
      const session = await this.sessionManager.loadSession()

      if (session) {
        this.client.session = this.sessionManager.getSession()
      }

      // 确保已连接但未检查授权状态
      await this.errorHandler.withRetry(
        () => this.client.connect(),
        {
          context: '连接到Telegram',
          maxRetries: 3,
          initialDelay: 1000,
        },
      )

      // 检查用户是否已授权
      const isAuthorized = await this.client.isUserAuthorized()

      if (!isAuthorized) {
        // 验证码必须已通过sendCode()发送
        if (!options?.code) {
          throw new Error('需要验证码才能登录，请先调用sendCode()')
        }

        // 使用验证码和可能的密码进行登录
        await this.errorHandler.withRetry(
          () => this.client.signInUser(
            {
              apiId: this.apiId,
              apiHash: this.apiHash,
            },
            {
              phoneNumber: this.phoneNumber,
              phoneCode: async () => {
                if (typeof options?.code === 'function') {
                  return options.code()
                }
                return options?.code || ''
              },
              password: async () => {
                if (typeof options?.password === 'function') {
                  return options.password()
                }
                return options?.password || ''
              },
              onError: (err: Error) => {
                this.errorHandler.handleError(err, '登录过程', '登录失败')
                throw err
              },
            },
          ),
          {
            context: '用户登录',
            maxRetries: 2,
            initialDelay: 1000,
          },
        )
      }

      // 保存会话
      const sessionString = await this.client.session.save() as unknown as string
      await this.sessionManager.saveSession(sessionString)
      this.logger.log('登录成功')
    }
    catch (error: any) {
      this.errorHandler.handleError(error, '连接过程', '连接失败')
      throw error
    }
  }

  /**
   * Disconnect from Telegram
   */
  public async disconnect(): Promise<void> {
    await this.errorHandler.withRetry(
      async () => {
        await this.client.invoke(new Api.auth.LogOut())
      },
      {
        context: '断开连接',
        maxRetries: 2,
        initialDelay: 500,
        throwAfterRetries: false,
      },
    )
  }

  /**
   * Logout from Telegram and clear session
   */
  public async logout(): Promise<void> {
    try {
      // 首先断开连接
      if (this.client.connected) {
        await this.disconnect()
      }

      // 然后清除会话
      await this.sessionManager.clearSession()

      this.logger.log('已成功登出并清除会话')
    }
    catch (error: any) {
      this.errorHandler.handleError(error, '登出过程', '登出失败')
      throw error
    }
  }

  /**
   * Send verification code to the user's phone
   * This is the first step of the authentication process
   */
  public async sendCode(): Promise<boolean> {
    try {
      // 首先确保连接到Telegram服务器
      await this.errorHandler.withRetry(
        () => this.client.connect(),
        {
          context: '连接到Telegram服务器',
          maxRetries: 3,
          initialDelay: 1000,
        },
      )

      // 已经授权的情况下不需要发送验证码
      const isAuthorized = await this.client.isUserAuthorized()
      if (isAuthorized) {
        this.logger.log('用户已授权，无需发送验证码')
      }

      // 发送验证码
      const result = await this.errorHandler.withRetry(
        () => this.client.sendCode(
          {
            apiId: this.apiId,
            apiHash: this.apiHash,
          },
          this.phoneNumber,
        ),
        {
          context: '发送验证码',
          maxRetries: 2,
          initialDelay: 1000,
        },
      )

      this.logger.log('验证码已发送')
      return result.success
    }
    catch (error: any) {
      this.errorHandler.handleError(error, '发送验证码过程', '发送验证码失败')
      throw error
    }
  }
}
