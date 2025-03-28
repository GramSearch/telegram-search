import process from 'node:process'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { initDB, useDB, useLogger } from '@tg-search/common'
import { EmbeddingService } from '@tg-search/core'
import { chats, findMessagesByText, findSimilarMessages } from '@tg-search/db'
import { z } from 'zod'

const logger = useLogger()
initDB()
const db = useDB()

const server = new McpServer({
  name: 'tg-search-mcp-server',
  version: '0.0.1',
})

const searchMessageInChatSchema = {
  chatId: z.string(),
  text: z.string(),
}

server.tool('search-message-in-chat', 'Search for a message in a chat', searchMessageInChatSchema, async (args) => {
  const { chatId, text } = args
  logger.debug(`Searching for ${text} in chat ${chatId}`)
  const embeddingService = new EmbeddingService()
  const embedding = await embeddingService.generateEmbedding(text)
  const similarMessages = await findSimilarMessages(embedding, {
    chatId: Number(chatId),
  })
  const fullTextMessages = await findMessagesByText(text, {
    chatId: Number(chatId),
  })

  const messages = [...similarMessages, ...fullTextMessages.items]
  // sort by createdAt
  messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(messages),
      },
    ],
  }
})

server.tool('get-chat-data', 'get chat data', {}, async () => {
  const select_chats = await db.select().from(chats)
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(select_chats),
    }],
  }
})

async function main() {
  const transport = new StdioServerTransport()
  logger.debug('TG Search MCP Server starting...')

  await server.connect(transport)
  logger.debug('TG Search MCP Server running on stdio')
}

main().catch((error) => {
  logger.error('Fatal error in main():', error)
  process.exit(1)
})
