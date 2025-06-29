<script setup lang="ts">
import type { CoreMessage } from '@tg-search/core/types'

import Avatar from '../ui/Avatar.vue'
import MediaRenderer from './MediaRenderer.vue'

defineProps<{
  message: CoreMessage
}>()
</script>

<template>
  <div class="hover:bg-muted flex items-start gap-4 rounded-lg p-3 transition-all duration-200">
    <div class="mt-1">
      <Avatar
        :name="message.fromName"
        size="md"
      />
    </div>
    <div class="flex-1">
      <div class="mb-1 flex items-center gap-2">
        <span class="whitespace-nowrap text-primary font-medium">{{ message.fromName }}</span>
        <span class="text-secondary-foreground whitespace-nowrap text-xs">{{ message.createdAt }}</span>
      </div>

      <div class="text-foreground">
        <MediaRenderer :message="message" />
      </div>
    </div>
  </div>
</template>
