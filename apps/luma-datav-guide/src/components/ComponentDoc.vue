<script setup lang="ts">
defineProps<{
  title: string
  /** @luma/datav 组件名，展示在标题下方。 */
  componentName: string
  /** 对应的 DataV 2.10.0 原始组件名。 */
  datavName?: string
  /** 一句话定位说明。 */
  intro: string
}>()
</script>

<template>
  <article class="component-doc">
    <header class="component-doc__head">
      <h1>{{ title }}</h1>
      <p class="component-doc__intro">
        {{ intro }}
      </p>
      <p class="component-doc__meta">
        <code>{{ componentName }}</code>
        <span v-if="datavName" class="component-doc__map">
          对应 DataV <code>{{ datavName }}</code>
        </span>
      </p>
    </header>

    <slot />
  </article>
</template>
