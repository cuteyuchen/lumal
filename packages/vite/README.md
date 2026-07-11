# @luma/vite

Luma 的轻量 Vite 配置助手，提供组件 resolver、工作区源码/产物 alias 和可选 Devtools 接线。

```ts
import { createLumaAliases, createLumaComponentResolver } from '@luma/vite'

const aliases = createLumaAliases({ workspaceRoot: process.cwd() })
const resolver = createLumaComponentResolver({ importStyle: true })
```

本包不提供全局 viewport 转换，也不强制安装自动导入或 Devtools 插件。
