<script setup lang="ts">
import type { LumalIconPickerGroupSelectSlotProps } from '@lumal/icons-vue'
import { ElOption, ElSelect } from 'element-plus'
import { onMounted, shallowRef } from 'vue'
import { registerAdminElementPlusIcons } from '../../icons'

/***********************Admin 分组控件适配*********************/
defineProps<LumalIconPickerGroupSelectSlotProps>()

/***********************按需图标资源*********************/
const loading = shallowRef(true)
const loadError = shallowRef('')

onMounted(async () => {
  try {
    await registerAdminElementPlusIcons()
  }
  catch {
    loadError.value = 'Element Plus 图标加载失败，请刷新重试'
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="app-icon-group-select">
    <!-- 弹出层留在选择器内，兼容图标弹窗的焦点约束。 -->
    <ElSelect
      :model-value="modelValue"
      :teleported="false"
      :loading="loading"
      loading-text="正在加载图标"
      aria-label="图标分组"
      @update:model-value="setGroup"
    >
      <ElOption value="" label="全部分组" />
      <ElOption v-for="group in groups" :key="group.key" :value="group.key" :label="group.label" />
    </ElSelect>
    <span v-if="loadError" class="app-icon-group-select__error" role="alert">{{ loadError }}</span>
  </div>
</template>

<style scoped lang="scss">
.app-icon-group-select {
  width: 100%;
  min-width: 0;
}

.app-icon-group-select__error {
  color: var(--el-color-danger);
  font-size: calc(var(--lumal-font-size-base, 14px) - 1px);
  overflow-wrap: anywhere;
}
</style>
