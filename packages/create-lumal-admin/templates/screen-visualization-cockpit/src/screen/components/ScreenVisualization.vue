<script setup lang="ts">
import { createDefaultCockpitConfig, createWidgetInstance } from '@lumal/cockpit';
import { createCockpitRegistry } from '@lumal/cockpit/registry';
import { LumalCockpit } from '@lumal/cockpit/runtime';
import '@lumal/cockpit/style.css';
import 'element-plus/dist/index.css';

/***********************最小运行时编排，不加载 Designer*********************/
const registry = createCockpitRegistry();
registry.registerWidget({ type: 'metric', label: '指标', component: () => import('./ScreenWidget.vue') });
const config = createDefaultCockpitConfig('screen-demo');
const layout = config.layouts[0]!;
layout.left.width = layout.right.width = 200;
layout.left.columns[0]!.width = layout.right.columns[0]!.width = 200;
layout.left.rows[0]!.cells[0]!.widget = createWidgetInstance('metric', '任务指标');
</script>

<template>
  <div class="screen-cockpit">
    <LumalCockpit :config="config" :registry="registry" viewport-mode="external">
      <template #center><p>数据总览</p></template>
    </LumalCockpit>
  </div>
</template>

<style scoped>
.screen-cockpit {
  width: 100%;
  height: 360px;
  min-width: 0;
  overflow: auto;
}
</style>
