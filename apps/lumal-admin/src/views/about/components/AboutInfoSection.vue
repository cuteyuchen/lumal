<script setup lang="ts">
import { LumalIcon } from '@lumal/icons-vue'

/***********************属性定义*********************/
defineProps<{
  title: string
  items: {
    label: string
    value: string
    href?: string
    datetime?: string
    highlight?: boolean
  }[]
}>()
</script>

<template>
  <section class="lumal-about-info" :aria-label="title">
    <h2 class="lumal-about-info__title">
      {{ title }}
    </h2>

    <dl class="lumal-about-info__grid">
      <div v-for="item in items" :key="item.label" class="lumal-about-info__item">
        <dt class="lumal-about-info__label">
          {{ item.label }}
        </dt>
        <dd class="lumal-about-info__value" :class="{ 'is-highlight': item.highlight }">
          <a
            v-if="item.href"
            class="lumal-about-info__link"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{{ item.value }}</span>
            <LumalIcon name="lumal:external-link" :size="14" />
          </a>
          <time v-else-if="item.datetime" :datetime="item.datetime">{{ item.value }}</time>
          <span v-else>{{ item.value }}</span>
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped lang="scss">
.lumal-about-info {
  min-width: 0;
  padding: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.lumal-about-info__title {
  margin: 0;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  font-size: calc(var(--lumal-font-size-base, 14px) + 2px);
  font-weight: 600;
  line-height: 1.5;
}

.lumal-about-info__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 24px;
  margin: 0;
}

.lumal-about-info__item {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
  padding: 20px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.lumal-about-info__label,
.lumal-about-info__value {
  overflow-wrap: anywhere;
  font-size: var(--lumal-font-size-base, 14px);
  line-height: 1.6;
}

.lumal-about-info__label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.lumal-about-info__value {
  display: flex;
  min-width: 0;
  min-height: 28px;
  align-items: center;
  margin: 0;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.lumal-about-info__value.is-highlight {
  color: var(--el-color-primary);
  font-weight: 700;
}

.lumal-about-info__link {
  display: inline-flex;
  min-width: 0;
  min-height: 28px;
  align-items: center;
  gap: 6px;
  color: var(--el-color-primary);
  text-decoration: none;
}

.lumal-about-info__link:hover {
  text-decoration: underline;
}

.lumal-about-info__link:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 4px;
}

.lumal-about-info__link :deep(.lumal-icon) {
  flex: none;
}

@media (max-width: 1024px) {
  .lumal-about-info__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .lumal-about-info {
    padding: 20px 16px;
  }

  .lumal-about-info__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .lumal-about-info__item {
    padding: 16px 0;
  }

  .lumal-about-info__link {
    min-height: 44px;
  }
}
</style>
