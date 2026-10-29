# @lumal/viewport

候选 `0.1.0-beta.0`：宽度数值工具与实际尺寸测量，仅依赖Vue，不需要Core或UI。
尚未发布npm，候选验收使用本地tarball。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/viewport` |
| 本地路径 | `packages/viewport` |
| 在线文档 | https://lumal.cuteyuchen.top/packages/viewport |
| npm 地址 | `https://www.npmjs.com/package/@lumal/viewport` |
| Peer | Vue `^3.5.0` |

## 安装

下列命令面向当前候选，仅正式发布后可用，源码接入见 [安装说明](/guide/essentials/installation)。

```bash
pnpm add @lumal/viewport@0.1.0-beta.0 vue@^3.5
```

## 公开入口

全部从 `@lumal/viewport` 导入：

| API | 职责 |
| --- | --- |
| `getViewportConfig()` | 获取一次配置的enabled/designWidth，未注入默认关闭、1920 |
| `viewportLength(P)` | 开启后输出普通vw，关闭输出px |
| `getViewportWidth()` | 实际CSS 100vw宽度，SSR为0，不用screen/DPR |
| `viewportPixels(P, W?)` | 设计数值按 `P * W / D` 换算 |
| `useViewportWidth(config?)` | 共享窗口width/ratio及pixels/length/measure |
| `useElementSize({ target?, enabled? })` | 测量、目标切换、Observer/RAF/KeepAlive清理 |

```ts
import { useViewportWidth, viewportLength } from '@lumal/viewport'
import { computed } from 'vue'

const viewport = useViewportWidth()
const option = computed(() => ({ title: { textStyle: { fontSize: viewport.pixels(18) } } }))
const dialogWidth = viewportLength(520)
```

项目由[Vite转换](/packages/vite)一次配置D，普通样式不调用数字工具、不写单位变量、不包页面组件。
静态CSS-only项目不安装本包。独立运行时可传共享普通config，不引入构建依赖。
高度与纵向间距仍按宽度，不根据高度缩小；高度不足滚动或显式裁切。
容器测量不改变vw基准，地图/图表实际尺寸直接resize，业务数据/定位坐标不再换算。

旧策略插件、画布组件、多模式、居中、画布缩放及字号补偿API已删除，不提供兼容别名。
详见[统一接入](/reference/screen-viewport-guide)及[本轮验证](/reference/pure-vw-refactor-2026-10-28)。
