<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhoneCode } from '../../types/phone_code'
import SelectDropdown from './SelectDropdown.vue'

const props = defineProps<{
  modelValue: string
  required?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { t, locale } = useI18n()

const selectedCountryCode = ref('+86')
const phoneNumberInput = ref('')

// 将 PhoneCode 转换为 SelectDropdown 需要的 Option 格式
const countryCodeOptions = computed(() => {
  return PhoneCode.map(code => ({
    label: `${locale.value === 'zhCN' ? code.chinese_name : code.english_name} (+${code.phone_code})`,
    value: `+${code.phone_code}`,
  }))
})

// 初始化时从props中解析手机号和区号
function initializeFromProps() {
  if (!props.modelValue) {
    phoneNumberInput.value = ''
    return
  }

  // 查找匹配的区号
  const matchingCode = countryCodeOptions.value
    .map(option => option.value)
    .find(code => props.modelValue.startsWith(code))

  if (matchingCode) {
    selectedCountryCode.value = matchingCode
    // 从完整号码中移除区号部分
    phoneNumberInput.value = props.modelValue.substring(matchingCode.length).trim()
  }
  else {
    // 如果没有匹配的区号，保留整个号码
    phoneNumberInput.value = props.modelValue
  }
}

// 当区号或输入的手机号变化时，更新完整手机号
function updateFullPhoneNumber() {
  const fullNumber = `${selectedCountryCode.value}${phoneNumberInput.value.trim()}`
  emit('update:modelValue', fullNumber)
}

// 监听props变化
watch(() => props.modelValue, initializeFromProps, { immediate: true })

// 监听组件内部状态变化
watch([selectedCountryCode, phoneNumberInput], updateFullPhoneNumber)
</script>

<template>
  <div>
    <label class="block text-sm text-gray-700 font-medium">
      {{ t("component.phone_number.label") }}
    </label>
    <div class="mt-1 flex gap-2">
      <div class="w-1/3">
        <SelectDropdown
          v-model="selectedCountryCode"
          :options="countryCodeOptions"
        />
      </div>
      <input
        v-model="phoneNumberInput"
        type="tel"
        :placeholder="t('component.phone_number.placeholder')"
        class="block w-2/3 border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
        :required="props.required"
      >
    </div>
    <p class="mt-1 text-sm text-gray-500">
      {{ t("component.phone_number.help_text") }}
    </p>
  </div>
</template>
