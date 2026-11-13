# 0.1.2-beta 发布执行记录

日期：2026-11-12。**十包已发布，正式门禁、同次产物与 registry 核验通过；生产部署未启用。**
发布命令成功、registry 可见性与消费者验证分别记录，不相互替代。

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

[Release Gate 43180740143](https://github.com/cuteyuchen/lumal/actions/runs/43180740143)
由 `v0.1.2-beta` 标签 push 触发，源提交
`dcca22c520e0c1aee4a6f53d520fd58ef06dcfae`，四个校验全部成功后才发布十包，
没有复用历史通过状态。

| 校验 / 作业 | Job | 结果 / 时间（UTC） |
| --- | --- | --- |
| 版本、lockfile、tag、工作流安全与 actionlint | `131055804462` | success，08:10:11–08:10:34 |
| Windows lint、格式、单测、类型、构建、tarball 与公共包检查 | `131055993122` | success，08:10:37–08:21:16 |
| Ubuntu 完整 `pnpm release:check` | `131055993213` | success，08:10:37–08:42:44 |
| Docs / Cockpit / DataV 静态站点构建与预算 | `131070496796` | success，08:42:46–08:49:53 |
| 十包串行发布，复用本次校验的 npm dist | `131073759120` | success，08:49:56–08:50:50 |
| 生产部署 | `131074199329` | skipped（`DEPLOY_PRODUCTION` 未启用） |

master 分支 CI `43180683109` 同样通过；本版未使用分支手动 dry-run 代替正式门禁。

## Registry 与同次产物

正式 npm artifact：`13928505329`，
`lumal-npm-dist-dcca22c520e0c1aee4a6f53d520fd58ef06dcfae`，
API digest `sha256:cc1462e1d5dc8816db9db86b4027eeb8b79bd54eebbd8a7e7ff70e151985a836`。
解压后为 **704 个 dist 文件 / 1,887,686 bytes**，不是工作区遗留 dist。
相较 `0.1.1-beta` 的 700 文件 / 1,859,441 bytes，增加 4 个文件、28,245 bytes，
对应新增的版本清单插件、版本检查服务及其声明文件。

十包 `beta` 均指向 `0.1.2-beta`，`latest` 与发布前快照一致：
`@lumal/viewport` 为 `0.0.6-beta`，其余九包为 `0.0.1-beta`。
逐包 `version` 与 `dist.integrity` 已通过 registry 查询核对；线上 tarball 另行下载检查，
`create-lumal-admin` 含 base 与 standard 两份 `AppVersionUpdate.vue`，
`@lumal/core` 含 `composables` 版本检查实现，`@lumal/vite` 含 `createVersionManifestPlugin`。

registry 边缘缓存对新版本存在延迟：`@lumal/icons-vue` 在发布成功后约 8 分钟才可查询，
包元数据与 tarball 端点均如此；其余包陆续可见。该延迟不是发布失败，
以发布作业的 `+ <pkg>@0.1.2-beta` 输出和最终 registry 结果为准。

## 风险与边界

- 版本检测是客户端定时轮询静态清单，不是即时推送；默认首查延迟 1.5 秒、
  间隔 5 分钟，页面隐藏时暂停。
- 非原子部署或回滚可能造成部署身份变化并提示刷新；刷新后旧 chunk 若已删除，
  由业务错误页或浏览器缓存处理，不在本版引入 Service Worker 兜底。
- 本环境未实际部署 Vercel，缓存头通过 Build Output 配置与脚本单测验证。

## 后置文档、Skill 与 Demo 更新

日期：2026-11-13。发包后独立提交，不改包源码、不移动标签、不重发 npm。
`git diff v0.1.2-beta -- packages` 应为空。

### 文档与 Skill

- 版本更新指南补充本地验证步骤、线上清单对照与 E2E 演练方式；
  文档首页、`docs/README.md` 增加入口。
- 仓库 Skill 新增 `references/version-update.md`，在包选型表加入部署更新检测；
  `vite.md`、`core.md`、`repository.md` 补充构建清单、`composables` 入口与校验边界。
- Skill 由 15 个文件增至 16 个，已同步宿主副本；`scripts/lumal-skill.test.ts`
  32 项通过，安装命令版本、相对链接与公开导入契约保持有效。

### Demo

- Admin 生产已由平台 Git 集成更新到 `0.1.2-beta`：
  `/version.json` 与 `/px/version.json` 均返回 200，`buildId` 分别为
  `0a01958-2026-11-13T03:32:18.736Z` 与 `0a01958-2026-11-13T03:32:21.998Z`，
  两个入口独立构建、互不复用。
- About 页增加「部署标识」一行，直接展示与 `version.json` 相同的 `buildId`；
  推送后由同一 Git 集成重建。
- DataV Guide、Compat 与 Mock API 沿用平台 Git 集成，本轮未单独上传或重复部署；
  未在本记录中声称已逐站验收。
- 文档站生产仍为 `0.1.1-beta`，新指南返回 404；Docs 的 Git 构建被既有
  Ignored Build Step 取消，需要 Vercel 凭据按 `prepare-vercel-output.mjs --clean-urls`
  定向 prebuilt 部署。该项未在本次仓库提交中声称完成。
