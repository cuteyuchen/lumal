<script setup lang="ts">
import type { SchemaTableCellDisplay, SchemaTableDictionaryTag } from './cell'
import { ElTag } from 'element-plus'

defineProps<{
  display: SchemaTableCellDisplay
}>()

function createTagStyle(tag: SchemaTableDictionaryTag): Record<string, string> | undefined {
  return tag.color
    ? { '--luma-dictionary-color': tag.color }
    : undefined
}
</script>

<template>
  <div v-if="display.tags.length" class="luma-schema-table__dictionary-tags">
    <ElTag
      v-for="tag in display.tags"
      :key="tag.key"
      class="luma-schema-table__dictionary-tag"
      effect="plain"
      size="small"
      :style="createTagStyle(tag)"
    >
      <span
        v-if="tag.color"
        class="luma-schema-table__dictionary-dot"
        aria-hidden="true"
      />
      <span>{{ tag.label }}</span>
    </ElTag>
  </div>
  <span v-else>{{ display.text }}</span>
</template>

<style scoped lang="scss">
.luma-schema-table__dictionary-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  max-width: 100%;
}

.luma-schema-table__dictionary-tag {
  gap: 5px;
  max-width: 100%;
  border-color: color-mix(
    in srgb,
    var(--luma-dictionary-color, var(--el-border-color)) 32%,
    var(--el-border-color-lighter)
  );
  color: var(--el-text-color-regular);
  background: color-mix(
    in srgb,
    var(--luma-dictionary-color, var(--el-fill-color)) 10%,
    var(--el-bg-color)
  );
}

.luma-schema-table__dictionary-dot {
  display: inline-block;
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--luma-dictionary-color);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--luma-dictionary-color) 70%, transparent);
}
</style>
