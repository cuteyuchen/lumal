<script setup lang="ts">
import { LumaInfoTable, LumaPage } from '@luma/core/components'
import { computed, shallowRef } from 'vue'

/***********************组合式状态*********************/
const count = shallowRef(1)
const doubled = computed(() => count.value * 2)
const status = computed(() => count.value >= 3 ? 'active' : 'idle')
const items = computed(() => [
  { label: 'count', value: count.value },
  { label: 'doubled', value: doubled.value },
  { label: 'status', value: status.value },
])

/***********************事件处理*********************/
function increase(): void {
  count.value += 1
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Composables" description="用最小状态和 computed 展示组合式 API 的数据流。">
      <button class="luma-admin-example__button luma-admin-example__button--primary" type="button" @click="increase">
        增加
      </button>

      <LumaInfoTable :items="items" :columns="3" label-width="72px" />
    </LumaPage>
  </main>
</template>
