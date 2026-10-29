# @lumal/viewport

宽度数值工具与元素测量。`0.1.0-beta` 为破坏性候选版本，未获授权不会发布 npm。
静态 CSS-only 项目只需 `@lumal/vite`，不必安装本包。

## 一次配置

在项目的 Vite 配置中显式启用：

```ts
import { createViewportTransformPlugin } from '@lumal/vite'

const viewport = createViewportTransformPlugin({
  enabled: true,
  include: ['src/**'],
  viewportWidth: 1920,
  dependencies: ['element-plus'], // 使用并核验该 UI 主题时才加入
})
// 加入已有 plugins，保留 @vitejs/plugin-vue。
```

插件将同一配置注入浏览器及受控 Lumal SSR 模块。业务正常写 CSS/SCSS 和模板 style 的 px，
不安装运行时插件、不加页面包装器、不手写尺寸变量。未启用构建转换时默认保持 px。

## 公开 API

```ts
import {
  getViewportConfig,
  getViewportWidth,
  useElementSize,
  useViewportWidth,
  viewportLength,
  viewportPixels,
} from '@lumal/viewport'
```

| API | 职责 |
| --- | --- |
| `getViewportConfig()` | 当前编译配置 `{ enabled, designWidth }`；默认关闭、1920 |
| `viewportLength(192)` | 开启后为 `10vw`，关闭为 `192px` |
| `getViewportWidth()` | 测量 CSS `100vw` 对应宽度；SSR 为 0，不使用 screen/DPR |
| `viewportPixels(192, width?)` | 必须接受数字的设计尺寸，开启后返回 `192 * W / D` |
| `useViewportWidth(config?)` | 共享窗口 width、ratio，以及响应式 `pixels()`、`length()`、`measure()` |
| `useElementSize({ target?, enabled? })` | 实际元素/窗口尺寸，管理 ResizeObserver、RAF、目标替换和 KeepAlive 清理 |

工具函数可显式传 `{ enabled: true, designWidth: 1440 }`，独立使用时由调用方维护一个配置。
项目已使用 Vite 插件时不应再重复填写设计宽度。

```vue
<script setup lang="ts">
import { useElementSize, useViewportWidth } from '@lumal/viewport'
import { computed, useTemplateRef } from 'vue'

/***********************设计数值和实际测量分开*********************/
const chartHost = useTemplateRef<HTMLElement>('chartHost')
const { size } = useElementSize({ target: chartHost })
const viewport = useViewportWidth()
const chartOption = computed(() => ({
  title: { text: '水位', textStyle: { fontSize: viewport.pixels(18) } },
}))
// size 是真实像素，直接用于 resize/updateSize，不能再乘比例。
</script>

<template>
  <div ref="chartHost" style="height: 320px" :data-width="size.width" />
</template>
```

CSS vw 永远相对浏览器布局视口，不相对容器。高度、纵向间距也按宽度计算；
同宽不同高不会缩小内容，高度不足正常滚动或由页面明确裁切。
监听在使用者间共享，最后一个使用者卸载/停用后移除监听及待执行 RAF。

## 迁移边界

本版本删除旧模式联合类型、策略插件、策略解析、画布组件及旧缩放/字号算法。
迁移时移除旧包装器和模式配置，启用 Vite 转换；使用上述数字工具替代动态设计尺寸计算。
不提供旧 API 别名或兼容实现。SVG viewBox、局部图形动画与地图实际测量不属于被删除的画布适配。

地图经纬度、业务数值、DOM 测量、拖拽屏幕坐标、Popper 定位保持原值。
外部 JS 动态样式不会被构建插件扫描；只对明确属于设计尺寸的数值显式使用工具。
完整接入与公共 CSS 来源边界见 [统一指南](../../docs/screen-viewport-guide.md)。
