<script setup lang="ts">
import { LumalIcon, LumalIconPicker, LumalIconPickerDialog, useIconRegistry } from '@lumal/icons-vue'
import { ElButton, ElOption, ElSelect, ElSwitch } from 'element-plus'
import { computed, shallowRef } from 'vue'
import AppIconGroupSelect from '../../../../components/app/AppIconGroupSelect.vue'

/***********************选择器状态*********************/
const selectedIcon = defineModel<string>({ required: true })
const dialogVisible = shallowRef(false)
const showLabels = shallowRef(true)
const pageSize = shallowRef(72)
const feedback = shallowRef('')
const registry = useIconRegistry()
const selectedDefinition = computed(() => registry.resolve(selectedIcon.value))
const selectedGroup = computed(() => registry.groups.value.find(group => group.key === selectedDefinition.value?.group)?.label ?? '-')

/***********************名称复制*********************/
async function copyIconName(): Promise<void> {
  try {
    await navigator.clipboard.writeText(selectedIcon.value)
    feedback.value = '图标名称已复制'
  }
  catch {
    feedback.value = '复制失败，请检查剪贴板权限'
  }
}
</script>

<template>
  <section class="icons-picker-examples" aria-label="图标库与选择器">
    <div class="icons-picker-examples__library">
      <div class="icons-picker-examples__toolbar">
        <label>
          <span>每页数量</span>
          <ElSelect v-model="pageSize" aria-label="每页图标数量" class="icons-picker-examples__page-size">
            <ElOption v-for="size in [12, 24, 48, 72, 96]" :key="size" :value="size" :label="String(size)" />
          </ElSelect>
        </label>
        <label><span>显示名称</span><ElSwitch v-model="showLabels" aria-label="显示图标名称" /></label>
      </div>
      <LumalIconPicker v-model="selectedIcon" :page-size="pageSize" :show-labels="showLabels">
        <template #group-select="slotProps">
          <AppIconGroupSelect v-bind="slotProps" />
        </template>
      </LumalIconPicker>
    </div>

    <aside class="icons-picker-examples__selection" aria-label="当前图标">
      <div class="icons-picker-examples__preview">
        <LumalIcon :name="selectedIcon" :size="64" />
      </div>
      <h3>{{ selectedDefinition?.label || selectedIcon }}</h3>
      <code class="icons-picker-examples__key">{{ selectedIcon }}</code>
      <dl class="icons-picker-examples__metadata">
        <dt>来源</dt><dd>{{ selectedDefinition?.source || '-' }}</dd>
        <dt>分组</dt><dd>{{ selectedGroup }}</dd>
        <dt>注册数量</dt><dd>{{ registry.icons.value.length }}</dd>
      </dl>
      <div class="icons-picker-examples__actions">
        <ElButton type="primary" @click="dialogVisible = true">
          <LumalIcon name="lumal:grid" :size="16" />弹窗选择
        </ElButton>
        <ElButton title="复制图标名称" aria-label="复制图标名称" @click="copyIconName">
          <LumalIcon name="lumal:copy" :size="16" />
        </ElButton>
      </div>
      <p class="icons-picker-examples__feedback" role="status">
        {{ feedback }}
      </p>
    </aside>
    <LumalIconPickerDialog v-model="selectedIcon" v-model:visible="dialogVisible" title="选择示例图标">
      <template #group-select="slotProps">
        <AppIconGroupSelect v-bind="slotProps" />
      </template>
    </LumalIconPickerDialog>
  </section>
</template>

<style scoped lang="scss">
.icons-picker-examples {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 24px;
  align-items: start;
}

.icons-picker-examples__library,
.icons-picker-examples__selection {
  min-width: 0;
}

.icons-picker-examples__toolbar,
.icons-picker-examples__toolbar label,
.icons-picker-examples__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.icons-picker-examples__toolbar {
  margin-bottom: 16px;
}

.icons-picker-examples__page-size {
  width: 88px;
}

.icons-picker-examples__selection {
  padding-left: 24px;
  border-left: 1px solid var(--el-border-color-light);
}

.icons-picker-examples__preview {
  display: grid;
  height: 128px;
  place-items: center;
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.icons-picker-examples__selection h3 {
  margin: 16px 0 8px;
  font-size: calc(var(--lumal-font-size-base, 14px) + 2px);
}

.icons-picker-examples__key {
  overflow-wrap: anywhere;
}

.icons-picker-examples__metadata {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.icons-picker-examples__metadata dt,
.icons-picker-examples__feedback {
  color: var(--el-text-color-secondary);
}

.icons-picker-examples__metadata dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.icons-picker-examples__feedback {
  min-height: 20px;
  font-size: max(var(--lumal-workspace-min-font-size, 0px), calc(var(--lumal-font-size-base, 14px) - 1px));
}

@media (max-width: 800px) {
  .icons-picker-examples {
    grid-template-columns: minmax(0, 1fr);
  }

  .icons-picker-examples__selection {
    padding: 20px 0 0;
    border-top: 1px solid var(--el-border-color-light);
    border-left: 0;
  }
}
</style>
