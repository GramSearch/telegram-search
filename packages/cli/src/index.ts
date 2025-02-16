import process from 'node:process'
import { initLogger, useLogger } from '@tg-search/common'

import { initConfig } from './composable/config'
import { initDB } from './composable/db'
import { main } from './cli'

// Initialize logger and config
initLogger()
initConfig()
initDB()

const logger = useLogger()

// Global error handler
process.on('unhandledRejection', (error) => {
  logger.withError(error).error('Unhandled promise rejection:')
})

// Graceful shutdown handler
process.on('SIGINT', () => {
  logger.log('正在关闭应用...')
  process.exit(0)
})

// Exit handler
process.on('exit', (code) => {
  logger.log(`应用已退出，退出码: ${code}`)
})

// Export main entry point
export default main
