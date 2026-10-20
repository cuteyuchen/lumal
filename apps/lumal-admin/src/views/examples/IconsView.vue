<script setup lang="ts">
import { LumalPage } from '@lumal/core/components'
import { ElTabPane, ElTabs } from 'element-plus'
import { defineAsyncComponent, shallowRef } from 'vue'
import IconsPickerExamples from './components/icons/IconsPickerExamples.vue'
import IconsRenderExamples from './components/icons/IconsRenderExamples.vue'
import IconsSvgTools from './components/icons/IconsSvgTools.vue'

/***********************按需示例*********************/
const IconsMorphExamples = defineAsyncComponent(() => import('./components/icons/IconsMorphExamples.vue'))

/***********************示例共享状态*********************/
const activeTab = shallowRef('picker')
const selectedIcon = shallowRef('lumal:settings')
</script>

<template>
  <main class="lumal-admin-example">
    <LumalPage title="图标">
      <ElTabs v-model="activeTab">
        <ElTabPane label="图标库与选择器" name="picker">
          <IconsPickerExamples v-model="selectedIcon" />
        </ElTabPane>
        <ElTabPane label="渲染与样式" name="render" lazy>
          <IconsRenderExamples v-model="selectedIcon" />
        </ElTabPane>
        <ElTabPane label="SVG 工具" name="svg" lazy>
          <IconsSvgTools />
        </ElTabPane>
        <ElTabPane label="形变动画" name="morph" lazy>
          <IconsMorphExamples />
        </ElTabPane>
      </ElTabs>
    </LumalPage>
  </main>
</template>
