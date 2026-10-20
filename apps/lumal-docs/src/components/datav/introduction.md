# DataV 组件概览

来自 `@lumal/datav`。支持 DataV `config` 与现代 props；优先级：显式 props > config > 默认。

本页对应工作区 `0.0.5-beta`。下列命令以 registry 存在对应版本为前提，
当前可用版本与源码接入方式见 [安装说明](/guide/essentials/installation)：

```bash
pnpm add @lumal/datav@0.0.5-beta vue echarts@^6
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
