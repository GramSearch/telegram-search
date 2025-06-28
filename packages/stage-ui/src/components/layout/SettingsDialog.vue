<script setup lang="ts">
import { useAuthStore } from '@tg-search/stage'
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
        <div class="text-foreground i-lucide-settings h-5 w-5" />
        <span class="text-foreground text-lg font-medium">设置</span>
      </div>
      <button class="text-foreground hover:bg-popover/50 rounded-md p-1 transition-colors" @click="showDialog = false">
        <div class="i-lucide-x h-5 w-5" />
      </button>
    </div>
    <div class="space-y-4">
      <div v-if="!isLoggedIn" class="text-foreground hover:bg-popover/50 flex items-center justify-between rounded-lg p-3 transition-colors">
        <div class="flex items-center gap-2">
          <div class="i-lucide-log-in h-5 w-5" />
          <span>登录</span>
        </div>
        <button class="text-primary transition-colors hover:text-primary/80" @click="handleLogin">
          登录
        </button>
      </div>

      <div v-if="isLoggedIn" class="text-foreground hover:bg-popover/50 flex items-center justify-between rounded-lg p-3 transition-colors">
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
