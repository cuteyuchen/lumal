<script setup lang="ts">
import type { LumaLayoutMenuItem } from './types'
import { LumaIcon } from '@luma/icons'
import { ElMenuItem, ElSubMenu } from 'element-plus'
import { computed } from 'vue'

/***********************属性定义*********************/
const props = defineProps<{
  item: LumaLayoutMenuItem
}>()

const emit = defineEmits<{
  select: [path: string]
}>()

/***********************菜单状态*********************/
const hasChildren = computed(() => Boolean(props.item.children?.length))

/***********************事件处理*********************/
function handleSelect(path: string): void {
  emit('select', path)
}
</script>

<template>
  <ElSubMenu v-if="hasChildren" class="luma-sidebar-menu-item" :index="item.path">
    <template #title>
      <LumaIcon
        v-if="item.icon"
        class="luma-sidebar-menu-item__icon"
        :name="item.icon"
        :size="16"
      />
      <span class="luma-sidebar-menu-item__title">{{ item.title }}</span>
    </template>

    <LumaSidebarMenuItem
      v-for="child in item.children"
      :key="child.path"
      :item="child"
      @select="handleSelect"
    />
  </ElSubMenu>

  <ElMenuItem
    v-else
    class="luma-sidebar-menu-item"
    :index="item.path"
    @click="handleSelect(item.path)"
  >
    <LumaIcon
      v-if="item.icon"
      class="luma-sidebar-menu-item__icon"
      :name="item.icon"
      :size="16"
    />
    <span class="luma-sidebar-menu-item__title">{{ item.title }}</span>
  </ElMenuItem>
</template>

<style scoped lang="scss">
.luma-sidebar-menu-item__icon {
  margin-right: 8px;
}

.luma-sidebar-menu-item__title {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
