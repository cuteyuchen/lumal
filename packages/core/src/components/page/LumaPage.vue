<script setup lang="ts">
import { computed, useSlots, useTemplateRef } from 'vue'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  title?: string
  description?: string
  loading?: boolean
  loadingText?: string
}>(), {
  loading: false,
  loadingText: '加载中',
})

/***********************模板引用*********************/
const pageRef = useTemplateRef<HTMLElement>('pageRef')

/***********************插槽状态*********************/
const slots = useSlots()

const hasHeader = computed(() => Boolean(props.title || props.description || slots.actions))

/***********************公开方法*********************/
defineExpose({
  getPageElement: () => pageRef.value,
})
</script>

<template>
  <section ref="pageRef" class="luma-page">
    <header v-if="hasHeader" class="luma-page__header">
      <div class="luma-page__heading">
        <h2 v-if="title" class="luma-page__title">
          {{ title }}
        </h2>
        <p v-if="description" class="luma-page__description">
          {{ description }}
        </p>
      </div>

      <div v-if="$slots.actions" class="luma-page__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="luma-page__body">
      <slot />
    </div>

    <div v-if="loading" class="luma-page__loading">
      {{ loadingText }}
    </div>
  </section>
</template>

<style scoped lang="scss">
.luma-page {
  position: relative;
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: calc(10px * var(--luma-radius-scale, 1));
  background: var(--el-bg-color);
  box-shadow: var(--luma-shadow-light);
}

.luma-page__header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  min-width: 0;
}

.luma-page__heading {
  min-width: 0;
}

.luma-page__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
  line-height: 1.4;
}

.luma-page__description {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.luma-page__actions {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.luma-page__body {
  min-width: 0;
}

.luma-page__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-bg-color) 82%, transparent);
  font-size: 14px;
}

@media (max-width: 768px) {
  .luma-page {
    gap: 12px;
    padding: 16px;
  }

  .luma-page__header {
    flex-direction: column;
  }

  .luma-page__actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
