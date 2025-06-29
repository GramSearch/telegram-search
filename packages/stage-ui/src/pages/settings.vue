<script setup lang="ts">
import { useSettingsStore, useWebsocketStore } from '@tg-search/stage'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

import { Button } from '../components/ui/Button'
import SelectDropdown from '../components/ui/SelectDropdown.vue'

const isEditing = ref(false)
const { config } = storeToRefs(useSettingsStore())
const websocketStore = useWebsocketStore()

const embeddingProviderOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Ollama', value: 'ollama' },
]

async function updateConfig() {
  if (!config.value)
    return

  websocketStore.sendEvent('config:update', { config: config.value })

  isEditing.value = false
  toast.success('Settings saved successfully')
}

onMounted(() => {
  websocketStore.sendEvent('config:fetch')
})
</script>

<template>
  <header class="border-b-secondary dark:border-b-secondary flex items-center border-b p-4 px-4">
    <div class="flex items-center gap-2">
      <span class="text-lg font-medium">Settings</span>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <Button
        icon="i-lucide-pencil"
        :disabled="isEditing"
        @click="isEditing = !isEditing"
      >
        Edit
      </Button>

      <Button
        icon="i-lucide-save"
        :disabled="!isEditing"
        @click="updateConfig"
      >
        Save
      </Button>
    </div>
  </header>

  <div class="container mx-auto p-4 space-y-6">
    <!-- Settings form -->
    <div class="space-y-6">
      <!-- Database settings -->
      <div class="border-secondary bg-card border rounded-lg p-4">
        <h2 class="text-foreground mb-4 text-xl font-semibold">
          Database Settings
        </h2>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-secondary-foreground block text-sm font-medium">Host</label>
            <input
              v-model="config.database.host"
              type="text"
              :disabled="!isEditing"
              class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
            >
          </div>
          <div>
            <label class="text-secondary-foreground block text-sm font-medium">Port</label>
            <input
              v-model.number="config.database.port"
              type="number"
              :disabled="!isEditing"
              class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
            >
          </div>
          <div>
            <label class="text-secondary-foreground block text-sm font-medium">Username</label>
            <input
              v-model="config.database.user"
              type="text"
              :disabled="!isEditing"
              class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
            >
          </div>
          <div>
            <label class="text-secondary-foreground block text-sm font-medium">Password</label>
            <input
              v-model="config.database.password"
              type="password"
              :disabled="!isEditing"
              class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
            >
          </div>
          <div class="md:col-span-2">
            <label class="text-secondary-foreground block text-sm font-medium">Database Name</label>
            <input
              v-model="config.database.database"
              type="text"
              :disabled="!isEditing"
              class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
            >
          </div>
        </div>
      </div>

      <!-- Message settings -->
      <div class="border-secondary bg-card border rounded-lg p-4">
        <h2 class="text-foreground mb-4 text-xl font-semibold">
          Message Settings
        </h2>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-secondary-foreground block text-sm font-medium">Batch Size</label>
            <input
              v-model.number="config.message.export.batchSize"
              type="number"
              :min="1"
              :max="1000"
              :disabled="!isEditing"
              class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
            >
          </div>
          <div>
            <label class="text-secondary-foreground block text-sm font-medium">Concurrent Requests</label>
            <input
              v-model.number="config.message.export.concurrent"
              type="number"
              :min="1"
              :max="10"
              :disabled="!isEditing"
              class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
            >
          </div>
          <div>
            <label class="text-secondary-foreground block text-sm font-medium">Retry Times</label>
            <input
              v-model.number="config.message.export.retryTimes"
              type="number"
              :min="1"
              :max="10"
              :disabled="!isEditing"
              class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
            >
          </div>
          <div>
            <label class="text-secondary-foreground block text-sm font-medium">Max Takeout Retries</label>
            <input
              v-model.number="config.message.export.maxTakeoutRetries"
              type="number"
              :min="1"
              :max="10"
              :disabled="!isEditing"
              class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
            >
          </div>
        </div>
      </div>

      <!-- Path settings -->
      <div class="border-secondary bg-card border rounded-lg p-4">
        <h2 class="text-foreground mb-4 text-xl font-semibold">
          Path Settings
        </h2>
        <div class="grid gap-4">
          <div>
            <label class="text-secondary-foreground block text-sm font-medium">Storage Path</label>
            <input
              v-model="config.path.storage"
              type="text"
              :disabled="!isEditing"
              class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
            >
          </div>
        </div>
      </div>

      <!-- API settings -->
      <div class="border-secondary bg-card border rounded-lg p-4">
        <h2 class="text-foreground mb-4 text-xl font-semibold">
          API Settings
        </h2>
        <div class="space-y-4">
          <!-- Telegram API -->
          <div>
            <h3 class="text-foreground mb-2 text-lg font-medium">
              Telegram API
            </h3>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="text-secondary-foreground block text-sm font-medium">API ID</label>
                <input
                  v-model="config.api.telegram.apiId"
                  type="text"
                  :disabled="!isEditing"
                  class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
                >
              </div>
              <div>
                <label class="text-secondary-foreground block text-sm font-medium">API Hash</label>
                <input
                  v-model="config.api.telegram.apiHash"
                  type="password"
                  :disabled="!isEditing"
                  class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
                >
              </div>
            </div>
          </div>

          <!-- OpenAI API -->
          <div>
            <h3 class="text-foreground mb-2 text-lg font-medium">
              Embedding
            </h3>
            <div class="grid gap-4">
              <div>
                <label class="text-secondary-foreground block text-sm font-medium">Provider</label>
                <SelectDropdown v-model="config.api.embedding.provider" :options="embeddingProviderOptions" :disabled="!isEditing" />
              </div>
              <div>
                <label class="text-secondary-foreground block text-sm font-medium">Model</label>
                <input
                  v-model="config.api.embedding.model"
                  :disabled="!isEditing"
                  class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
                >
              </div>
              <div>
                <label class="text-secondary-foreground block text-sm font-medium">Dimension</label>
                <input
                  v-model="config.api.embedding.dimension"
                  :disabled="!isEditing"
                  class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
                >
              </div>
              <div>
                <label class="text-secondary-foreground block text-sm font-medium">API Key</label>
                <input
                  v-model="config.api.embedding.apiKey"
                  type="password"
                  :disabled="!isEditing"
                  class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
                >
              </div>
              <div>
                <label class="text-secondary-foreground block text-sm font-medium">API Base URL</label>
                <input
                  v-model="config.api.embedding.apiBase"
                  type="text"
                  :disabled="!isEditing"
                  class="border-secondary bg-muted text-foreground mt-1 block w-full border rounded-md px-3 py-2"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
