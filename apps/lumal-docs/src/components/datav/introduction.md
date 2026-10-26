# DataV 组件概览

来自 `@lumal/datav`。支持 DataV `config` 与现代 props；优先级：显式 props > config > 默认。

本页对应已发布并核验的 `0.0.7-beta`，下列命令显式选择本版；开发未发布源码时使用精确 tarball。
包核验与源码接入方式见 [安装说明](/guide/essentials/installation)：

```bash
pnpm add @lumal/datav@0.0.7-beta vue@^3.5
# 仅使用 ECharts 模式或 LumalActiveRingChart 时安装。
pnpm add echarts@^6
```

```ts
import LumalDatav from '@lumal/datav'
import '@lumal/datav/style.css'
app.use(LumalDatav)
```

或按需：`import LumalBorderBox from '@lumal/datav/border-box'`。

- 组件映射表：[@lumal/datav](/packages/datav)
- 示例长文：[DataV 示例](/reference/datav-examples)
- 指南应用：`apps/lumal-datav-guide`
