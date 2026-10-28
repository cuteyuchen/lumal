# 宽度数值与实际测量

本页对应候选 `0.1.0-beta.0`，尚未发布。公共入口只有 `@lumal/viewport`，仅 Vue peer。
静态 CSS-only 项目不需要本包，使用 [Vite](vite.md) 一次配置设计宽度。

- `getViewportConfig()` 返回编译配置 `{ enabled, designWidth }`，未注入时关闭、1920。
- `viewportLength(P, config?)` 开启后输出普通 `P / D * 100 vw`，关闭输出 px。
- `getViewportWidth()` 测量实际 CSS `100vw`，不使用物理 screen、DPR或容器宽度，SSR返回0。
- `viewportPixels(P, width?, config?)` 返回 `P * W / D`，只用于设计数值。
- `useViewportWidth(config?)` 返回共享 width/ratio/pixels/length/measure；所有实例共享窗口监听，最后停用清理。
- `useElementSize({ target?, enabled? })` 实际尺寸测量、目标切换、RAF/Observer及KeepAlive清理。

```ts
import { useViewportWidth, viewportLength } from '@lumal/viewport'
import { computed } from 'vue'

const viewport = useViewportWidth()
const option = computed(() => ({ title: { textStyle: { fontSize: viewport.pixels(18) } } }))
const dialogWidth = viewportLength(520)
```

Vite插件自动注入配置，不在main、每个组件重复D，不需要插件安装或页面包装器。
独立运行时可显式传一个共享普通config；它不是另一套布局策略。
高度、有单位行高也按宽度，高度不足滚动或显式裁切，不根据高度缩小。
不要写Lumal单位变量、整画布transform或DOM扫描来代替vw。

地图实际尺寸、业务数据、经纬度、屏幕拖拽和Popper坐标不换算。
测量直接用于resize/updateSize，不重建引擎或重复请求。
旧策略/画布/模式算法已删除，不提供别名或兼容包装。DataV/Cockpit也只有这一条规则。
