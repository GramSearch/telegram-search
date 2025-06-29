<script setup lang="ts">
import type { CoreMessage } from '@tg-search/core/types'

// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'

import { fileTypeFromBuffer } from 'file-type'
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  message: CoreMessage
}>()

const isMedia = computed(() => {
  return props.message.media?.length
})

const mediaSrc = ref<string | null>(null)
const mediaType = ref<'image' | 'video' | 'audio' | 'document' | null>(null)
const isLoading = computed(() => {
  return mediaSrc.value === null && isMedia.value
})
const error = ref<string | null>(null)

async function processMedia() {
  try {
    if (!isMedia.value)
      return

    for (const mediaItem of props.message.media!) {
      if (!mediaItem.data)
        continue

      const media = mediaItem.data
      let buffer: Buffer

      if (typeof media === 'string') {
        mediaSrc.value = media.startsWith('data:') ? media : `data:image/jpeg;base64,${media}`
        mediaType.value = 'image'
        return
      }

      if (media && typeof media === 'object' && 'type' in media && media.type === 'Buffer' && 'data' in media) {
        buffer = Buffer.from(media.data as ArrayBufferLike)
      }
      else if (media instanceof ArrayBuffer) {
        buffer = Buffer.from(media)
      }
      else {
        throw new TypeError('Unsupported media format')
      }

      // Detect file type
      const fileType = await fileTypeFromBuffer(buffer)
      const mimeType = fileType?.mime || 'application/octet-stream'
      const base64 = buffer.toString('base64')

      mediaSrc.value = `data:${mimeType};base64,${base64}`

      // Determine media category
      if (mimeType.startsWith('image/')) {
        mediaType.value = 'image'
      }
      else if (mimeType.startsWith('video/')) {
        mediaType.value = 'video'
      }
      else if (mimeType.startsWith('audio/')) {
        mediaType.value = 'audio'
      }
      else {
        mediaType.value = 'document'
      }

      // Process first valid media item only
      break
    }
  }
  catch (err) {
    console.error('Error processing media:', err)
    error.value = 'Failed to process media'
  }
}

onMounted(() => {
  processMedia()
})
</script>

<template>
  <!-- Show text content if available -->
  <div v-if="message.content" class="mb-2">
    {{ message.content }}
  </div>

  <!-- Loading state -->
  <div v-if="isLoading" class="flex items-center gap-2">
    <div class="i-lucide-loader-circle h-4 w-4 animate-spin" />
    <span class="text-secondary-foreground text-xs">处理媒体中...</span>
  </div>

  <!-- Error state -->
  <div v-else-if="error" class="flex items-center gap-2 rounded bg-red-100 p-2 dark:bg-red-900">
    <div class="i-lucide-alert-circle h-4 w-4 text-red-500" />
    <span class="text-sm text-red-700 dark:text-red-300">{{ error }}</span>
  </div>

  <!-- Media content -->
  <div v-else-if="mediaSrc">
    <!-- Images -->
    <img
      v-if="mediaType === 'image'"
      :src="mediaSrc"
      class="h-auto max-w-full max-w-xs rounded-lg"
      alt="Media content"
      @error="error = 'Image failed to load'"
    >

    <!-- Videos -->
    <video
      v-else-if="mediaType === 'video'"
      :src="mediaSrc"
      class="h-auto max-w-full rounded-lg"
      controls
      @error="error = 'Video failed to load'"
    >
      Your browser does not support the video tag.
    </video>

    <!-- Audio -->
    <audio
      v-else-if="mediaType === 'audio'"
      :src="mediaSrc"
      class="w-full"
      controls
      @error="error = 'Audio failed to load'"
    >
      Your browser does not support the audio tag.
    </audio>

    <!-- Documents/Others -->
    <div
      v-else
      class="flex items-center gap-2 rounded bg-gray-100 p-3 dark:bg-gray-800"
    >
      <div class="i-lucide-file h-5 w-5" />
      <div class="flex-1">
        <span class="text-sm font-medium">文档文件</span>
        <div class="text-xs text-gray-500">
          点击下载
        </div>
      </div>
      <a
        :href="mediaSrc"
        :download="`file_${message.platformMessageId}`"
        class="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
      >
        下载
      </a>
    </div>
  </div>
</template>
