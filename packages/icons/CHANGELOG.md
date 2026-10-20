# @lumal/icons

## 0.0.4-beta (2026-10-20)

### Minor Changes

- 新增独立 morph 入口，提供 SVG 转换和原生 DOM 形变控制器；可选 Morphicons 2.0.0 按需加载，保留静态及 SSR 回退。

### Patch Changes

- SVG Data URI 补齐独立图片命名空间，修正设置图标轮廓并补充状态图标。
- 补充 ESM/CJS、并发更新、销毁清理、减少动画和不支持图形的回归检查。

## 0.0.3-beta (2026-10-16)

### Patch Changes

- 修复静态本地 SVG 插件代理模块重复解析自身的问题，并增加真实 Vite 构建回归。
- 与其他 Lumal 公共包同步版本。

## 0.0.2-beta (2026-08-01)

- Version bump only, to stay in lockstep with the other @lumal packages.
