<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { RouterView } from 'vue-router'

/***********************模板引用*********************/
const routerViewRef = useTemplateRef<HTMLElement>('routerViewRef')

/***********************公开方法*********************/
defineExpose({
  getRouterViewElement: () => routerViewRef.value,
})
</script>

<template>
  <div ref="routerViewRef" class="luma-router-view">
    <RouterView />
  </div>
</template>

<style scoped lang="scss">
.luma-router-view {
  min-width: 0;
  min-height: 0;
}
</style>
