---
"@lumal/core": minor
"@lumal/vite": minor
"create-lumal-admin": minor
---

新增部署构建版本提示：`@lumal/vite` 提供 `createVersionManifestPlugin` 生成
`version.json` 并注入同一份 `buildId`；`@lumal/core/composables` 提供
`createVersionChecker` / `useVersionCheck`，支持首查、轮询、隐藏暂停、联网恢复、
单飞请求与刷新守卫；Admin standard/vben 模板默认接入，minimal 保持空实现。
