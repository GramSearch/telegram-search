<script setup lang="ts">
interface Option<T> {
  label: string
  value: T
}

interface Props<T> {
  modelValue: T
  options: Option<T>[]
  disabled?: boolean
  label?: string
}

withDefaults(defineProps<Props<any>>(), {
  disabled: false,
  label: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()
</script>

<template>
  <div>
    <label v-if="label" class="text-complementary-600 mb-2 block text-sm font-medium">
      {{ label }}
    </label>
    <div class="relative">
      <select
        :value="modelValue"
        class="border-neutral-200 bg-neutral-100 text-primary-900 w-full appearance-none border rounded-md px-4 py-2.5 pr-10 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        :disabled="disabled"
        @change="($event: Event) => {
          const target = $event.target as HTMLSelectElement
          emit('update:modelValue', target.value)
        }"
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <div class="text-complementary-600 pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
        <span>▼</span>
      </div>
    </div>
  </div>
</template>
