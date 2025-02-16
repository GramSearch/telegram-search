import { getConfig, useLogger } from '@tg-search/common'
import { embed, embedMany } from '@xsai/embed'
import { createOpenAI } from '@xsai/providers'
import { encoding_for_model } from 'tiktoken'

// OpenAI API 限制和定价
const LIMITS = {
  // text-embedding-3-small 的最大 token 限制
  MAX_TOKENS_PER_REQUEST: 8191,
  // 建议的单个文本最大 token
  MAX_TOKENS_PER_TEXT: 4000,
  // 每 1K tokens 的价格（美元）
  PRICE_PER_1K_TOKENS: 0.00002,
}

/**
 * Service for generating embeddings from text using OpenAI
 */
export class EmbeddingService {
  private openai
  private logger = useLogger()
  private config = getConfig()
  private encoder = encoding_for_model('text-embedding-3-small')
  private totalTokens = 0
  private totalCost = 0

  constructor() {
    this.openai = createOpenAI({
      apiKey: this.config.openaiApiKey,
      baseURL: this.config.openaiApiBase || 'https://api.openai.com/v1',
    })
  }

  /**
   * Calculate number of tokens in a text
   */
  private getTokenCount(text: string): number {
    return this.encoder.encode(text).length
  }

  /**
   * Calculate total tokens in multiple texts
   */
  private getTotalTokens(texts: string[]): number {
    return texts.reduce((sum, text) => sum + this.getTokenCount(text), 0)
  }

  /**
   * Calculate cost in USD for given number of tokens
   */
  private calculateCost(tokens: number): number {
    return (tokens / 1000) * LIMITS.PRICE_PER_1K_TOKENS
  }

  /**
   * Get total usage statistics
   */
  getUsage(): { tokens: number, cost: number } {
    return {
      tokens: this.totalTokens,
      cost: this.totalCost,
    }
  }

  /**
   * Generate embedding for a text
   * Using text-embedding-3-small model (1536 dimensions)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const tokenCount = this.getTokenCount(text)
      if (tokenCount > LIMITS.MAX_TOKENS_PER_TEXT) {
        this.logger.warn(`文本 token 数量(${tokenCount})超过建议值(${LIMITS.MAX_TOKENS_PER_TEXT})，可能会被截断`)
      }

      const { embedding } = await embed({
        ...this.openai.embed('text-embedding-3-small'),
        input: text,
      })

      // 更新使用统计
      this.totalTokens += tokenCount
      this.totalCost += this.calculateCost(tokenCount)

      return embedding
    }
    catch (error) {
      this.logger.withError(error).error('生成向量嵌入失败')
      throw error
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const totalTokens = this.getTotalTokens(texts)
      if (totalTokens > LIMITS.MAX_TOKENS_PER_REQUEST) {
        throw new Error(`批次总 token 数量(${totalTokens})超过 API 限制(${LIMITS.MAX_TOKENS_PER_REQUEST})`)
      }

      // 检查单个文本的 token 数量
      const longTexts = texts.filter(text => this.getTokenCount(text) > LIMITS.MAX_TOKENS_PER_TEXT)
      if (longTexts.length > 0) {
        this.logger.warn(`${longTexts.length} 条文本的 token 数量超过建议值(${LIMITS.MAX_TOKENS_PER_TEXT})，可能会被截断`)
      }

      const { embeddings } = await embedMany({
        ...this.openai.embed('text-embedding-3-small'),
        input: texts,
      })

      // 更新使用统计
      this.totalTokens += totalTokens
      this.totalCost += this.calculateCost(totalTokens)

      return embeddings
    }
    catch (error) {
      this.logger.withError(error).error('批量生成向量嵌入失败')
      throw error
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.encoder.free()
  }
}
