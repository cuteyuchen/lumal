# DataV 组件概览

来自 `@lumal/datav`。支持 DataV `config` 与现代 props；优先级：显式 props > config > 默认。

本版发布后显式安装 `0.0.4-beta`：

```bash
pnpm add @lumal/datav@0.0.4-beta vue echarts@^6
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
