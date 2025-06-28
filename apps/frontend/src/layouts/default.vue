<script lang="ts" setup>
import type { DialogType } from '@tg-search/core'

import { useAuthStore, useChatStore, useSettingsStore, useWebsocketStore } from '@tg-search/stage-ui'
import { useDark, useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import ChatsCollapse from '../components/layout/ChatsCollapse.vue'
import SettingsDialog from '../components/layout/SettingsDialog.vue'
import SidebarSelector from '../components/layout/SidebarSelector.vue'
import Avatar from '../components/ui/Avatar.vue'
import { Button } from '../components/ui/Button'

const settingsStore = useSettingsStore()
const { theme } = storeToRefs(settingsStore)
const isDark = useDark()

const websocketStore = useWebsocketStore()
const authStore = useAuthStore()
const { isLoggedIn } = storeToRefs(authStore)

const router = useRouter()
const route = useRoute()

const settingsDialog = ref(false)
const searchParams = ref('')

const chatStore = useChatStore()
const chats = computed(() => chatStore.chats)
const chatsFiltered = computed(() => {
  return chats.value.filter(chat => chat.name.toLowerCase().includes(searchParams.value.toLowerCase()))
})

type ChatGroup = DialogType | ''
const selectedGroup = useLocalStorage<ChatGroup>('selectedGroup', 'user')

const activeChatGroup = computed(() => {
  if (route.params.chatId) {
    const currentChat = chatStore.getChat(route.params.chatId.toString())
    if (currentChat) {
      return currentChat.type
    }
  }
  return selectedGroup.value
})

watch(theme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
}, { immediate: true })

function toggleSettingsDialog() {
  settingsDialog.value = !settingsDialog.value
}

function toggleActiveChatGroup(group: ChatGroup) {
  selectedGroup.value = group
}
</script>

<template>
  <div
    class="bg-background h-screen w-full flex overflow-hidden text-sm font-medium"
  >
    <!-- Login prompt banner -->
    <div
      v-if="!isLoggedIn"
      class="fixed left-0 right-0 top-0 z-50 bg-yellow-500 px-4 py-2 text-center text-sm text-yellow-900 font-medium"
    >
      <div class="flex items-center justify-center gap-2">
        <div class="i-lucide-alert-triangle" />
        <span>请先登录 Telegram 账号以使用完整功能</span>
        <Button
          size="sm"
          icon="i-lucide-user"
          class="ml-2 border border-yellow-700 bg-yellow-600 text-yellow-100 hover:bg-yellow-700"
          @click="router.push('/login')"
        >
          去登录
        </Button>
      </div>
    </div>

    <div class="border-r-secondary w-[20%] flex flex-col border-r h-dvh md:w-[15%]">
      <div class="relative p-4">
        <div
          class="i-lucide-search absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2"
        />
        <input
          v-model="searchParams"
          type="text"
          class="focus:ring-ring border-secondary bg-muted ring-offset-background dark:border-secondary dark:bg-muted placeholder:text-muted-foreground w-full border rounded-md px-3 py-2 pl-9 focus:outline-none focus:ring-2"
          placeholder="Search"
        >
      </div>

      <div class="mb-4">
        <SidebarSelector
          path="/"
          icon="i-lucide-home"
          name="主页"
        />

        <SidebarSelector
          path="/sync"
          icon="i-lucide-refresh-cw"
          name="同步"
        />

        <SidebarSelector
          path="/search"
          icon="i-lucide-search"
          name="搜索"
        />

        <SidebarSelector
          path="/settings"
          icon="i-lucide-settings"
          name="设置"
        />
      </div>

      <div class="border-t-secondary h-full flex flex-1 flex-col justify-start overflow-y-auto border-t pt-4">
        <ChatsCollapse
          class="max-h-[85%] flex flex-col"
          :class="{ 'flex-1': activeChatGroup === 'user' }"
          name="用户"
          icon="i-lucide-user"
          type="user"
          :chats="chatsFiltered.filter(chat => chat.type === 'user')"
          :active="activeChatGroup === 'user'"
          @update:toggle-active="toggleActiveChatGroup('user')"
        />

        <ChatsCollapse
          class="max-h-[85%] flex flex-col"
          :class="{ 'flex-1': activeChatGroup === 'group' }"
          name="群组"
          icon="i-lucide-users"
          type="group"
          :chats="chatsFiltered.filter(chat => chat.type === 'group')"
          :active="activeChatGroup === 'group'"
          @update:toggle-active="toggleActiveChatGroup('group')"
        />

        <ChatsCollapse
          class="max-h-[85%] flex flex-col"
          :class="{ 'flex-1': activeChatGroup === 'channel' }"
          name="频道"
          icon="i-lucide-message-circle"
          type="channel"
          :chats="chatsFiltered.filter(chat => chat.type === 'channel')"
          :active="activeChatGroup === 'channel'"
          @update:toggle-active="toggleActiveChatGroup('channel')"
        />
      </div>

      <div class="flex items-center justify-between p-4">
        <div class="mr-3 flex items-center gap-3">
          <div class="bg-muted h-8 w-8 flex items-center justify-center overflow-hidden rounded-full">
            <Avatar
              :name="websocketStore.getActiveSession()?.me?.username"
              size="sm"
            />
          </div>
          <div class="flex flex-col">
            <span class="text-foreground whitespace-nowrap text-sm font-medium">{{ websocketStore.getActiveSession()?.me?.username }}</span>
            <span class="text-secondary-foreground whitespace-nowrap text-xs">{{ websocketStore.getActiveSession()?.isConnected ? '已链接' : '未链接' }}</span>
          </div>
        </div>
        <div class="flex items-center">
          <Button
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            class="text-foreground hover:bg-muted h-8 w-8 flex items-center justify-center rounded-md p-1"
            @click="() => { isDark = !isDark }"
          />

          <Button
            icon="i-lucide-settings"
            class="text-foreground hover:bg-muted h-8 w-8 flex items-center justify-center rounded-md p-1"
            @click="toggleSettingsDialog"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-1 flex-col overflow-auto">
      <RouterView :key="$route.fullPath" />
    </div>

    <SettingsDialog
      v-model:show-dialog="settingsDialog"
    />
  </div>
</template>
