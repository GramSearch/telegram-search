import type { CoreConfig } from '../types/config'

import * as fs from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { defu } from 'defu'
import { parse } from 'valibot'
import * as yaml from 'yaml'

import { generateDefaultConfig } from '../config/default-config'
import { useLogger } from '../helper/logger'
import { findConfigDir, resolveHomeDir } from '../helper/path'
import { coreConfigSchema } from '../types/config'

let config: CoreConfig | null = null

/**
 * Find config file path
 */
function findConfigFile(): string {
  const configDir = process.env.CONFIG_DIR || findConfigDir()
  const configPath = join(configDir, `config.yaml`)

  if (!fs.existsSync(configPath)) {
    throw new Error(`CoreConfig file not found: ${configPath}`)
  }

  return configPath
}

/**
 * Load YAML configuration file
 */
function loadYamlConfig(configPath: string): Partial<CoreConfig> {
  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    return yaml.parse(content)
  }
  catch {
    const logger = useLogger()
    logger.debug(`Failed to load config file: ${configPath}`)
    return {}
  }
}

/**
 * Save config to file
 */
function saveConfig(config: CoreConfig, configPath: string) {
  const logger = useLogger()

  try {
    // Create config directory if it doesn't exist
    const configDir = dirname(configPath)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    // Write config to file
    fs.writeFileSync(
      configPath,
      yaml.stringify(config),
      'utf-8',
    )

    logger.debug('Config saved successfully')
  }
  catch (error) {
    logger.withError(error).error('Failed to save config')
    throw error
  }
}

/**
 * Initialize config
 */
export function initConfig(): CoreConfig {
  if (config) {
    return config
  }

  const logger = useLogger()

  try {
    // Find config file path
    const configPath = findConfigFile()
    logger.debug(`Using config file: ${configPath}`)
    const configDir = dirname(configPath)

    // Load environment-specific config if exists
    const envConfig = process.env.NODE_ENV
      ? loadYamlConfig(join(configDir, `config.${process.env.NODE_ENV}.yaml`))
      : {}

    // Load main config
    const mainConfig = loadYamlConfig(configPath)
    if (Object.keys(mainConfig).length === 0) {
      throw new Error('Main configuration file (config.yaml) not found or empty')
    }

    // Merge configurations with type assertion
    const mergedConfig = defu<CoreConfig, Partial<CoreConfig>[]>(mainConfig, envConfig, generateDefaultConfig())

    // Resolve paths
    mergedConfig.path.storage = resolveHomeDir(mergedConfig.path.storage)

    // Construct database URL if not provided
    if (!mergedConfig.database.url) {
      const { host, port, user, password, database } = mergedConfig.database
      mergedConfig.database.url = `postgres://${user}:${password}@${host}:${port}/${database}`
    }

    // Log merged config
    logger.withFields(mergedConfig).debug('Merged config')

    try {
      parse(coreConfigSchema, mergedConfig)
    }
    catch (error) {
      logger.withError(error).error('Failed to validate config')
      throw error
    }

    // Set global config
    config = mergedConfig

    logger.debug('Config initialized successfully')

    return mergedConfig
  }
  catch (error) {
    logger.withError(error).error('Failed to initialize config')
    throw error
  }
}

/**
 * Get current config
 */
export function useConfig(): CoreConfig {
  if (!config) {
    initConfig()
  }

  return config as CoreConfig
}

/**
 * Update config
 * This will merge the new config with the existing one and save it to file
 */
export function updateConfig(newConfig: Partial<CoreConfig>): CoreConfig {
  const logger = useLogger()

  try {
    // Get current config and config file path
    const currentConfig = useConfig()
    const configPath = findConfigFile()

    // Merge new config with current config
    const mergedConfig = defu<CoreConfig, Partial<CoreConfig>[]>({}, newConfig, currentConfig)

    // Validate merged config
    try {
      parse(coreConfigSchema, mergedConfig)
    }
    catch (error) {
      logger.withError(error).error('Failed to validate config')
      throw error
    }

    // Save config to file
    saveConfig(mergedConfig, configPath)

    // Update global config
    config = mergedConfig

    return mergedConfig
  }
  catch (error) {
    logger.withError(error).error('Failed to update config')
    throw error
  }
}
