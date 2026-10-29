<script setup lang="ts">
import type { CockpitConfig } from '@lumal/cockpit'
import { createCockpitRegistry } from '@lumal/cockpit/registry'
import { LumalCockpit, LumalCockpitRegion } from '@lumal/cockpit/runtime'
import { LumalPage } from '@lumal/core/components'
import { viewportLength } from '@lumal/viewport'
import { ref } from 'vue'
import MetricWidget from './cockpit/MetricWidget.vue'
import '@lumal/cockpit/style.css'

/***********************最小 Runtime 消费，不导入 Designer 或地图中心*********************/
const registry = createCockpitRegistry()
registry.registerWidget({ type: 'metric', label: '运行指标', component: MetricWidget })
const theme = ref<'dark' | 'light'>('dark')
const config: CockpitConfig = {
  schemaVersion: 3,
  id: 'admin-embedded',
  title: '区域运行中心',
  activeLayoutId: 'overview',
  layouts: [{
    id: 'overview',
    title: '运行总览',
    left: { width: 240, columns: [{ id: 'left', width: 240 }], rows: [{
      id: 'metrics',
      height: 100,
      mode: 'grid',
      widgets: [],
      cells: [{ id: 'metric-cell', widget: { id: 'health', type: 'metric', title: '健康度' } }],
    }] },
    right: { width: 0, columns: [], rows: [] },
  }],
}
</script>

<template>
  <main class="lumal-admin-example">
    <LumalPage title="Cockpit Runtime">
      <div class="cockpit-controls">
        <label>主题 <select v-model="theme" aria-label="嵌入驾驶舱主题"><option value="dark">暗色</option><option value="light">亮色</option></select></label>
        <a href="https://lumal-cockpit.cuteyuchen.top/" target="_blank" rel="noopener noreferrer">独立 Cockpit Demo</a>
        <a href="https://lumal.cuteyuchen.top/components/cockpit/runtime" target="_blank" rel="noopener noreferrer">Runtime 接入文档</a>
      </div>
      <div class="embedded-stage">
        <LumalCockpit :config="config" :registry="registry" :theme-mode="theme" :base-width="960" :base-height="540">
          <template #header-actions>
            <span>ADMIN WORKSPACE</span>
          </template>
          <template #left="{ layout, region }">
            <LumalCockpitRegion side="left" :layout-id="layout.id" :region="region" />
          </template>
          <template #right>
            <span aria-hidden="true" />
          </template>
          <template #center="{ layout }">
            <!-- 中心是全幅底层；应用自己为覆盖其上的左侧区域预留空间。 -->
            <div class="embedded-center" :style="{ paddingLeft: viewportLength(layout.left.width + 32) }">
              <h2>区域运行态势</h2><div v-for="(value, index) in [72, 96, 83]" :key="value">
                <span>{{ ['北区', '东区', '南区'][index] }}</span><meter :value="value" min="0" max="100" />
              </div>
            </div>
          </template>
        </LumalCockpit>
      </div>
    </LumalPage>
  </main>
</template>

<style scoped>
.cockpit-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; margin-bottom: 16px; }
select { padding: 6px; background: var(--el-bg-color); color: var(--el-text-color-primary); border: 1px solid var(--el-border-color); }
.embedded-stage { position: relative; height: 540px; overflow: auto; }
.embedded-stage :deep(.lumal-cockpit) { position: absolute; inset: 0; }
.embedded-stage :deep([data-cockpit-theme='dark']) {
  --lumal-cockpit-bg: #12232a;
  --lumal-cockpit-panel-bg: #1a343e;
  --lumal-cockpit-text: #eaf6f8;
  --lumal-cockpit-text-secondary: #b2ced5;
  --lumal-cockpit-title-text: #eaf6f8;
  --lumal-cockpit-success: #75d7b5;
  --lumal-cockpit-border: #36525c;
}
.embedded-stage :deep([data-cockpit-theme='light']) {
  --lumal-cockpit-bg: #f3f7f9;
  --lumal-cockpit-panel-bg: #fff;
  --lumal-cockpit-text: #253b43;
  --lumal-cockpit-text-secondary: #48636d;
  --lumal-cockpit-title-text: #253b43;
  --lumal-cockpit-success: #237558;
  --lumal-cockpit-border: #ccdce2;
}
.embedded-center { box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 24px; height: 100%; padding: 32px; color: var(--lumal-cockpit-text); }
.embedded-center > div { display: grid; grid-template-columns: 50px 1fr; gap: 16px; }
meter { width: 100%; height: 20px; }
</style>
