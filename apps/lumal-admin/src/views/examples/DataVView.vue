<script setup lang="ts">
import { LumalPage } from '@lumal/core/components'
import { LumalBorderBox, LumalDecoration, LumalDigitalFlop, LumalFullScreenContainer, LumalScrollRankingBoard } from '@lumal/datav'
import { ElButton, ElSwitch } from 'element-plus'
import { ref } from 'vue'
import '@lumal/datav/style.css'

/***********************仅页面内加载 DataV，保留指南站的完整组件清单*********************/
const value = ref(128)
const autoplay = ref(true)
const ranking = [
  { key: 'a', label: '北区', value: 98 },
  { key: 'b', label: '东区', value: 94 },
  { key: 'c', label: '南区', value: 89 },
  { key: 'd', label: '西区', value: 86 },
  { key: 'e', label: '中区', value: 82 },
  { key: 'f', label: '新区', value: 79 },
]
</script>

<template>
  <main class="lumal-admin-example">
    <LumalPage title="DataV">
      <div class="datav-controls">
        <ElButton @click="value += 16">
          更新指标
        </ElButton>
        <ElSwitch v-model="autoplay" active-text="滚动排行" />
        <a href="https://lumal-datav.cuteyuchen.top/" target="_blank" rel="noopener noreferrer">完整 DataV 指南</a>
      </div>
      <div class="datav-stage">
        <!-- 只将兼容全屏容器定位在本地宿主，不覆盖 Admin Header 或菜单。 -->
        <LumalFullScreenContainer :width="960" :height="540" mode="scale">
          <div class="datav-canvas">
            <LumalDecoration :variant="2" class="datav-decoration" />
            <LumalBorderBox :variant="1" title="区域运行指数" class="datav-border">
              <LumalDigitalFlop :value="value" :duration="600" class="datav-number" />
              <LumalScrollRankingBoard :items="ranking" :visible-rows="3" :interval="1500" :autoplay="autoplay" aria-label="示例区域排行" class="datav-ranking" />
            </LumalBorderBox>
          </div>
        </LumalFullScreenContainer>
      </div>
    </LumalPage>
  </main>
</template>

<style scoped>
.datav-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; margin-bottom: 16px; }
.datav-stage { position: relative; height: 540px; overflow: hidden; background: #12282d; }
.datav-stage :deep(.lumal-full-screen-container) { position: absolute; width: 100%; height: 100%; }
.datav-canvas { box-sizing: border-box; display: grid; gap: 12px; width: 100%; height: 100%; padding: 24px; color: #edf9f6; }
.datav-decoration { height: 20px; }
.datav-border { min-height: 0; }
.datav-number { height: 80px; margin: 20px; }
.datav-ranking { height: 240px; margin: 24px; }
</style>
