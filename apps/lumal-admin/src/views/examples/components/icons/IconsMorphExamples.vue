<script setup lang="ts">
import type { LumalIconMorphSpring } from '@lumal/icons-vue'
import { LumalIcon } from '@lumal/icons-vue'
import { ElOption, ElSelect, ElSwitch } from 'element-plus'
import { reactive, shallowRef } from 'vue'

/***********************形变参数*********************/
const enabled = shallowRef(true)
const spring = shallowRef<LumalIconMorphSpring>('smooth')
const presets: LumalIconMorphSpring[] = ['smooth', 'snappy', 'bouncy']

/***********************独立状态示例*********************/
const examples = reactive([
  { key: 'theme', title: '主题切换', active: false, icons: ['lumal:moon', 'lumal:sun'], labels: ['深色模式', '浅色模式'] },
  { key: 'sidebar', title: '侧栏切换', active: false, icons: ['lumal:sidebar-collapse', 'lumal:sidebar-expand'], labels: ['收起侧边栏', '展开侧边栏'] },
  { key: 'maximize', title: '内容最大化', active: false, icons: ['lumal:maximize', 'lumal:restore'], labels: ['内容最大化', '还原内容'] },
  { key: 'fullscreen', title: '表格全屏', active: false, icons: ['lumal:fullscreen', 'lumal:fullscreen-exit'], labels: ['全屏', '退出全屏'] },
])
</script>

<template>
  <section class="icons-morph-examples" aria-label="形变动画">
    <div class="icons-morph-examples__controls">
      <label class="icons-morph-examples__field">
        <span>形变动画</span>
        <ElSwitch v-model="enabled" aria-label="启用形变动画" />
      </label>
      <label class="icons-morph-examples__field">
        <span>弹簧预设</span>
        <ElSelect v-model="spring" aria-label="形变弹簧预设">
          <ElOption v-for="preset in presets" :key="preset" :label="preset" :value="preset" />
        </ElSelect>
      </label>
    </div>

    <div class="icons-morph-examples__list">
      <figure v-for="example in examples" :key="example.key" class="icons-morph-examples__example">
        <figcaption class="icons-morph-examples__title">
          {{ example.title }}
        </figcaption>
        <button
          class="icons-morph-examples__trigger"
          type="button"
          :data-morph-example="example.key"
          :title="example.labels[Number(example.active)]"
          :aria-label="example.labels[Number(example.active)]"
          :aria-pressed="example.active"
          @click="example.active = !example.active"
        >
          <LumalIcon
            :name="example.icons[Number(example.active)]"
            :morph="enabled"
            :morph-spring="spring"
            :size="48"
          />
        </button>
        <code class="icons-morph-examples__name">{{ example.icons[Number(example.active)] }}</code>
      </figure>
    </div>
  </section>
</template>

<style scoped lang="scss">
.icons-morph-examples {
  display: grid;
  gap: 24px;
  min-width: 0;
}

.icons-morph-examples__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 32px;
}

.icons-morph-examples__field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icons-morph-examples__field :deep(.el-select) {
  width: 140px;
}

.icons-morph-examples__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-light);
}

.icons-morph-examples__example {
  display: grid;
  min-width: 0;
  gap: 16px;
  justify-items: center;
  margin: 0;
}

.icons-morph-examples__title {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.icons-morph-examples__trigger {
  display: grid;
  width: 120px;
  height: 120px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
  cursor: pointer;
}

.icons-morph-examples__trigger:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.icons-morph-examples__trigger:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 3px;
}

.icons-morph-examples__name {
  min-height: 40px;
  max-width: 100%;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
  text-align: center;
}
</style>
