<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { LumaLayoutMenuItem, LumaLayoutTabItem } from './types'
import { ElContainer } from 'element-plus'
import { computed, useTemplateRef } from 'vue'
import LumaContent from './LumaContent.vue'
import LumaHeader from './LumaHeader.vue'
import LumaSidebar from './LumaSidebar.vue'
import LumaTabs from './LumaTabs.vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  title?: string
  menus?: LumaLayoutMenuItem[]
  tabs?: LumaLayoutTabItem[]
  activeMenuPath?: string
  activeTabPath?: string
  sidebarWidth?: string
  collapsedSidebarWidth?: string
  headerHeight?: string
}>(), {
  activeMenuPath: '',
  activeTabPath: '',
  collapsedSidebarWidth: '64px',
  headerHeight: '56px',
  menus: () => [],
  sidebarWidth: '220px',
  tabs: () => [],
})

const emit = defineEmits<{
  menuSelect: [path: string]
  tabChange: [path: string]
  tabRemove: [path: string]
}>()

const collapsed = defineModel<boolean>('collapsed', { default: false })
const activeTabPathModel = defineModel<string>('activeTabPath')

/***********************模板引用*********************/
const layoutRef = useTemplateRef<ComponentPublicInstance>('layoutRef')

/***********************布局状态*********************/
const currentActiveTabPath = computed({
  get: () => activeTabPathModel.value ?? props.activeTabPath,
  set: (value) => {
    activeTabPathModel.value = value
  },
})

const hasTabs = computed(() => props.tabs.length > 0)

/***********************事件处理*********************/
function handleToggleCollapse(): void {
  collapsed.value = !collapsed.value
}

function handleMenuSelect(path: string): void {
  emit('menuSelect', path)
}

function handleTabChange(path: string): void {
  emit('tabChange', path)
}

function handleTabRemove(path: string): void {
  emit('tabRemove', path)
}

/***********************公开方法*********************/
defineExpose({
  getLayoutElement: () => layoutRef.value?.$el as HTMLElement | undefined,
  getLayoutInstance: () => layoutRef.value,
})
</script>

<template>
  <ElContainer ref="layoutRef" class="luma-layout">
    <LumaSidebar
      :menus="menus"
      :active-path="activeMenuPath"
      :collapsed="collapsed"
      :width="sidebarWidth"
      :collapsed-width="collapsedSidebarWidth"
      @select="handleMenuSelect"
    />

    <ElContainer class="luma-layout__main" direction="vertical">
      <LumaHeader
        :title="title"
        :collapsed="collapsed"
        :height="headerHeight"
        @toggle-collapse="handleToggleCollapse"
      >
        <template v-if="$slots.logo" #logo>
          <slot name="logo" />
        </template>

        <template v-if="$slots.headerActions" #actions>
          <slot name="headerActions" />
        </template>
      </LumaHeader>

      <LumaTabs
        v-if="hasTabs"
        v-model:active-path="currentActiveTabPath"
        :tabs="tabs"
        @change="handleTabChange"
        @remove="handleTabRemove"
      />

      <LumaContent>
        <slot />
      </LumaContent>
    </ElContainer>
  </ElContainer>
</template>

<style scoped lang="scss">
.luma-layout {
  min-width: 0;
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

.luma-layout__main {
  min-width: 0;
  min-height: 0;
}
</style>
