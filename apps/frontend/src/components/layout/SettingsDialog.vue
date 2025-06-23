<script setup lang="ts">
import { useAuthStore } from '@tg-search/stage-ui'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import Dialog from '../ui/Dialog.vue'

const router = useRouter()
const showDialog = defineModel<boolean>('showDialog', { required: true })

const sessionStore = useAuthStore()
const { isLoggedIn } = storeToRefs(sessionStore)
const { logout } = sessionStore.handleAuth()

function handleLogout() {
  logout()
}

function handleLogin() {
  router.push('/login')
}
</script>

<template>
  <Dialog v-model="showDialog">
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="i-lucide-settings h-5 w-5 text-foreground" />
        <span class="text-lg text-foreground font-medium">设置</span>
      </div>
      <button class="rounded-md p-1 text-foreground transition-colors hover:bg-popover/50" @click="showDialog = false">
        <div class="i-lucide-x h-5 w-5" />
      </button>
    </div>
    <div class="space-y-4">
      <div v-if="!isLoggedIn" class="flex items-center justify-between rounded-lg p-3 text-foreground transition-colors hover:bg-popover/50">
        <div class="flex items-center gap-2">
          <div class="i-lucide-log-in h-5 w-5" />
          <span>登录</span>
        </div>
        <button class="text-primary transition-colors hover:text-primary/80" @click="handleLogin">
          登录
        </button>
      </div>

      <div v-if="isLoggedIn" class="flex items-center justify-between rounded-lg p-3 text-foreground transition-colors hover:bg-popover/50">
        <div class="flex items-center gap-2">
          <div class="i-lucide-log-out h-5 w-5" />
          <span>退出登录</span>
        </div>
        <button class="text-primary transition-colors hover:text-primary/80" @click="handleLogout">
          退出
        </button>
      </div>
    </div>
  </Dialog>
</template>
