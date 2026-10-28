<script setup lang="ts">
import { getViewportConfig } from '@lumal/viewport'
import { computed, useSlots, useTemplateRef } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  title?: string
  description?: string
  contentClass?: string
  fill?: boolean
  loading?: boolean
  loadingText?: string
  noPadding?: boolean
}>(), {
  contentClass: '',
  fill: false,
  loading: false,
  loadingText: '加载中',
  noPadding: false,
})

/***********************模板引用*********************/
const pageRef = useTemplateRef<HTMLElement>('pageRef')

/***********************插槽状态*********************/
const slots = useSlots()

const hasHeader = computed(() => Boolean(props.title || props.description || slots.title || slots.actions))

/***********************公开方法*********************/
defineExpose({
  getPageElement: () => pageRef.value,
})
</script>

<template>
  <section
    ref="pageRef"
    class="lumal-page"
    :class="{ 'is-fill': fill, 'is-no-padding': noPadding, 'is-responsive': !getViewportConfig().enabled }"
  >
    <header v-if="hasHeader" class="lumal-page__header">
      <div class="lumal-page__heading">
        <slot name="title">
          <h2 v-if="title" class="lumal-page__title">
            {{ title }}
          </h2>
        </slot>
        <p v-if="description" class="lumal-page__description">
          {{ description }}
        </p>
      </div>

      <div v-if="$slots.actions" class="lumal-page__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="lumal-page__body" :class="contentClass">
      <slot />
    </div>

    <div v-if="loading" class="lumal-page__loading">
      {{ loadingText }}
    </div>
  </section>
</template>

<style scoped lang="scss">
.lumal-page {
  position: relative;
  box-sizing: border-box;
  display: grid;
  align-content: start;
  gap: 16px;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: calc(10px * var(--lumal-radius-scale, 1));
  background: var(--el-bg-color);
  box-shadow: var(--lumal-shadow-light);
}

.lumal-page.is-fill {
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
}

.lumal-page.is-no-padding {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.lumal-page__header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  min-width: 0;
}

.lumal-page__heading {
  min-width: 0;
}

.lumal-page__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: calc(var(--lumal-font-size-base, 14px) + 4px);
  line-height: 1.4;
}

.lumal-page__description {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: var(--lumal-font-size-base, 14px);
  line-height: 1.5;
}

.lumal-page__actions {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.lumal-page__body {
  min-width: 0;
  min-height: 0;
}

.lumal-page.is-fill .lumal-page__body {
  overflow: auto;
}

.lumal-page__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-bg-color) 82%, transparent);
  font-size: var(--lumal-font-size-base, 14px);
}

@media (max-width: 768px) {
  .lumal-page.is-responsive {
    gap: 12px;
    padding: 12px;
  }

  .lumal-page.is-responsive .lumal-page__header {
    flex-direction: column;
  }

  .lumal-page.is-responsive .lumal-page__actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
