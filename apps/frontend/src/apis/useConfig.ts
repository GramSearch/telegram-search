import type { Config } from '@tg-search/common'

import { ref } from 'vue'

import { apiFetch, useApi } from '../composables/api'

/**
 * Vue composable for managing config state and operations
 */
export function useConfig() {
  const config = ref<Config | null>(null)
  const { loading, error, request } = useApi()

  /**
   * Get current config
   */
  async function getConfig(): Promise<Config> {
    const data = await request<Config>(() =>
      apiFetch('/config'),
    )
    config.value = data
    return data
  }

  /**
   * Update config
   */
  async function updateConfig(newConfig: Config): Promise<void> {
    await request<void>(() =>
      apiFetch('/config', {
        method: 'PUT',
        body: newConfig,
      }),
    )
    config.value = newConfig
  }

  return {
    config,
    loading,
    error,
    getConfig,
    updateConfig,
  }
}
