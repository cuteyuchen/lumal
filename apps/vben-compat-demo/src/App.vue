<script setup lang="ts">
import { ElConfigProvider, ElTabPane, ElTabs } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { defineAsyncComponent, shallowRef } from 'vue'
import V5FormExample from './components/V5FormExample.vue'
import V5GridExample from './components/V5GridExample.vue'

/***********************兼容入口切换*********************/
const active = shallowRef('v5')
const LegacyExamples = defineAsyncComponent(() => import('./components/LegacyExamples.vue'))
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <main class="compat-workspace">
      <h1>Vben 5 Element Plus</h1>
      <ElTabs v-model="active">
        <ElTabPane label="Vben 5" name="v5">
          <template v-if="active === 'v5'">
            <V5FormExample />
            <V5GridExample />
          </template>
        </ElTabPane>
        <ElTabPane label="Legacy" name="legacy">
          <LegacyExamples v-if="active === 'legacy'" />
        </ElTabPane>
      </ElTabs>
    </main>
  </ElConfigProvider>
</template>
