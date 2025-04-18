<!-- Chat selector component -->
<script setup lang="ts">
import type { TelegramChat } from '@tg-search/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChatTypeOptions } from '../../composables/useOptions'
import { usePagination } from '../../composables/usePagination'
import Pagination from '../ui/Pagination.vue'
import SelectDropdown from '../ui/SelectDropdown.vue'

const props = defineProps<{
  chats: TelegramChat[]
  selectedChats: number[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedChats', value: number[]): void
  (e: 'select', chatId: number): void
}>()

const { t } = useI18n()
const chatTypeOptions = useChatTypeOptions()

const selectedType = ref<string>('user')
const searchQuery = ref('')

const { totalPages, paginatedData, currentPage } = usePagination({
  defaultPage: 1,
  defaultPageSize: 12,
})

const filteredChats = computed(() => {
  let filtered = props.chats

  if (selectedType.value)
    filtered = filtered.filter(chat => chat.type === selectedType.value)

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(chat =>
      chat.title?.toLowerCase().includes(query)
      || chat.id.toString().includes(query),
    )
  }

  return filtered.map(chat => ({
    id: chat.id,
    title: chat.title || `Chat ${chat.id}`,
    subtitle: `ID: ${chat.id}`,
    type: chat.type,
  })).sort((a, b) => {
    const aSelected = props.selectedChats.includes(a.id)
    const bSelected = props.selectedChats.includes(b.id)
    if (aSelected && !bSelected)
      return -1
    if (!aSelected && bSelected)
      return 1
    return 0
  })
})

const paginatedChats = computed(() => {
  return paginatedData(filteredChats.value)
})

const totalPagesCount = computed(() => {
  return totalPages.value(filteredChats.value)
})

function isSelected(id: number): boolean {
  return props.selectedChats.includes(id)
}

function toggleSelection(id: number): void {
  const newSelection = [...props.selectedChats]
  const index = newSelection.indexOf(id)

  if (index === -1)
    newSelection.push(id)
  else
    newSelection.splice(index, 1)

  emit('update:selectedChats', newSelection)
  emit('select', id)
}

// Reset page when filters change
watch([selectedType, searchQuery], () => {
  currentPage.value = 1
})
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex flex-col items-start gap-4 md:flex-row md:items-end">
      <!-- Type Selection -->
      <div class="w-full md:w-48">
        <SelectDropdown
          v-model="selectedType"
          :options="chatTypeOptions"
          :label="t('component.grid_selector.type')"
        />
      </div>

      <!-- Search Input -->
      <div class="flex-1">
        <input
          v-model="searchQuery"
          type="text"
          class="w-full border border-gray-300 rounded-md px-4 py-2 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          :placeholder="t('component.export_command.placeholder_search')"
        >
      </div>
    </div>

    <!-- Grid List -->
    <div v-auto-animate class="grid gap-4 lg:grid-cols-3 md:grid-cols-2">
      <button
        v-for="chat in paginatedChats"
        :key="chat.id"
        class="relative w-full flex active:scale-98 cursor-pointer items-center border rounded-lg p-4 text-left transition-all duration-300 space-x-3 hover:shadow-md hover:-translate-y-0.5"
        :class="{
          'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md scale-102': isSelected(chat.id),
          'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600': !isSelected(chat.id),
        }"
        @click="toggleSelection(chat.id)"
      >
        <div class="min-w-0 flex-1">
          <div class="focus:outline-none">
            <p class="flex items-center gap-2 text-sm text-gray-900 font-medium dark:text-gray-100">
              {{ chat.title }}
              <span v-if="isSelected(chat.id)" class="text-blue-500 dark:text-blue-400">
                <div class="i-lucide-circle-check h-4 w-4" />
              </span>
            </p>
            <p class="truncate text-sm text-gray-500 dark:text-gray-400">
              {{ chat.subtitle }}
            </p>
          </div>
        </div>
      </button>
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="totalPagesCount > 1"
      v-model="currentPage"
      :total="totalPagesCount"
      theme="blue"
    />

    <!-- No Results Message -->
    <div v-if="filteredChats.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
      {{ t('pages.index.no_chats_found') }}
    </div>
  </div>
</template>
