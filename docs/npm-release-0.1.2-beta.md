# 0.1.2-beta 发布执行记录

日期：2026-11-12。状态：版本与文档已准备，等待正式 Release Gate 与 npm 发布；
门禁 run、artifact 与 registry 证据在发布完成后补入本记录。

## 版本与授权

- 十个公共包统一为 `0.1.2-beta`，工作区内部依赖同步为 `^0.1.2-beta`；
  私有应用保持 `0.0.0`，只更新内部依赖。
- 分支 `feat/version-update-notice` 合并到 `master`，附注标签 `v0.1.2-beta`
  指向合并后的源提交；标签创建后不移动。
- 维护者明确要求提交、推送、合并 `master` 并发布 npm。本记录不代表授权生产部署，
  正式发布时 `DEPLOY_PRODUCTION` 未启用，deploy 应为 skipped。
- 上一版 `0.1.1-beta` 已发布，不复用版本、不重跑旧发布链、不移动旧标签。
  发布作业在任一 `publish` 前逐包只读查询 registry，任一已发布、部分发布、
  网络或 registry 异常均中断。

## 变更内容

- `@lumal/vite` 新增 `createVersionManifestPlugin`：构建期只生成一份
  `{ buildId, version, commit, builtAt }` 快照，通过 `define` 注入
  `__LUMAL_VERSION_INFO__`，并用 `emitFile` 在各自 `outDir` 生成 `version.json`；
  SSR 默认不生成部署清单。导出 `createVersionManifest`、`createVersionBuildId`
  与相关类型，不新增运行时依赖。
- `@lumal/core/composables` 新增 `createVersionChecker` / `useVersionCheck`：
  首查直接比较客户端内置 `buildId`，支持定时轮询、页面隐藏暂停、`visible` / `online`
  立即检查、单飞请求、超时与非法响应容错、`dismiss` 和刷新守卫；
  `stop()` 会清理计时器、可见性/联网监听与在途请求。
- Admin 新增构建身份 `buildId`，`vite.config.ts` 一次快照同时供 About、JS 与
  `version.json` 使用；根级 `AppVersionUpdate` 提供「稍后 / 立即刷新」，
  默认生产启用、5 分钟间隔、首次延迟 1.5 秒，未保存内容由业务守卫阻止直接刷新。
- Admin standard / vben-compatible 模板默认生成版本检测与提示组件；
  minimal 保持空实现，不引入检测运行时。
- `/` 与 `/px/` 各自从自身 `BASE_URL` 读取清单；`scripts/check-version-manifests.mjs`
  在 Admin 构建后校验两份产物中的 `buildId` 与 JSON 一致、互不串用。
- Vercel Build Output 为 `version.json` 设置 `no-store`、入口 HTML 设置 `no-cache`；
  其他静态平台需配置等价策略。
- 新增文档 `guide/in-depth/version-update.md`、包 README 说明与更新日志。

## 本地预检

- `pnpm release:verify`：十包版本、内部依赖与 lockfile 一致。
- `pnpm lint`、`pnpm format:check`、`pnpm typecheck`、`pnpm build` 通过。
- `@lumal/core`、`@lumal/vite`、`lumal-admin`、`create-lumal-admin` 与仓库脚本测试通过；
  生产 E2E 覆盖提示展示、键盘关闭、单次刷新与双构建清单。
- `pnpm release:boundaries`、`pnpm release:artifacts`、`pnpm pack:dry-run` 通过；
  Admin 首屏仍在既有 gzip 预算内。

## 正式门禁

待发布后补入：Release Gate run、四个校验作业、十包串行发布作业与
`lumal-npm-dist-<sha>` artifact。

## Registry 与同次产物

待发布后补入：十包 `npm view <name>@0.1.2-beta version dist.integrity dist-tags`、
`beta` 指向与既有 `latest` 快照对比。

## 风险与边界

- 版本检测是客户端定时轮询静态清单，不是即时推送；默认首查延迟 1.5 秒、
  间隔 5 分钟，页面隐藏时暂停。
- 非原子部署或回滚可能造成部署身份变化并提示刷新；刷新后旧 chunk 若已删除，
  由业务错误页或浏览器缓存处理，不在本版引入 Service Worker 兜底。
- 本环境未实际部署 Vercel，缓存头通过 Build Output 配置与脚本单测验证。
