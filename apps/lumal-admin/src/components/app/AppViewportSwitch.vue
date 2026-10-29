<script setup lang="ts">
import { getViewportConfig, viewportLength } from '@lumal/viewport'
import { ElSwitch } from 'element-plus'

/***********************Demo 构建开关*********************/
const enabled = getViewportConfig().enabled

function toggleViewport(): void {
  // 同源导航保留 hash 路由、查询参数及原有登录存储，不混用两套 CSS/运行时常量。
  const target = new URL(location.href)
  target.pathname = enabled ? `${import.meta.env.BASE_URL}px/` : import.meta.env.BASE_URL.replace(/px\/$/, '')
  location.assign(target.href)
}
</script>

<template>
  <ElSwitch
    :model-value="enabled"
    :width="viewportLength(48)"
    aria-label="VW 适配"
    :title="enabled ? '关闭 VW 适配（重新加载）' : '开启 VW 适配（重新加载）'"
    active-text="VW"
    inactive-text="VW"
    inline-prompt
    data-action="toggle-viewport"
    @change="toggleViewport"
  />
</template>
