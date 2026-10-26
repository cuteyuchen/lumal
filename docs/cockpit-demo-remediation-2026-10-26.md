# 0.0.6-beta Demo 整改验收

本轮基线：`3f9e1848f87c3e3ca68a04643a604b74f92f5528`，分支 `codex/cockpit-demo-example-quality`。
公共包维持 `0.0.6-beta`。本轮不发布 npm、不部署生产、不修改真实业务项目。

## 构建基线

通过 `git archive HEAD` 建立无 node_modules / dist 的隔离源码副本，然后 frozen install。
本机 Windows，Node v24.14.1、pnpm 10.33.0，实际锁定 Vite 8.1.4 / plugin-vue 6.0.7。

| 实际命令/环境 | 结果 | 证据（本地忽略的 output） |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | 通过，18 workspaces | `cockpit-baseline-windows-install.log` |
| `pnpm --filter lumal-cockpit build:app`，尚无公共包 dist | 失败，TS2307，后续连带 TS7006 | `cockpit-baseline-windows-build-app.log` |
| `pnpm cockpit:build` | 通过，包含类型检查，复制 389 项 Cesium 资源 | `cockpit-baseline-windows-build.log` |
| `pnpm --filter lumal-cockpit build` | 通过，委托相同完整编排 | `cockpit-baseline-windows-package-build.log` |
| 隔离产物 preview，Chromium 1920×1080 | 默认场景出现，无 pageerror / HTTP 4xx | `playwright/cockpit-baseline.png` |

不能据此宣称复现了用户未提供详细日志的标准构建失败。目前唯一明确复现的失败是直接调用内部
`build:app` 缺少依赖 dist。已增加输入检查，提示执行完整构建，保留类型检查与原始编译错误。
同时补齐干净开发的 viewport 源码 alias，并禁止生产 preview 使用开发 alias。

## 验收边界

单元、类型、生产构建、生产浏览器、CI 跨平台及线上部署是不同证据。
本轮不将公开包发布或 Deployment READY 等同于当前分支已经上线。

## 实际修复

- 开发别名补齐 Viewport；生产 preview 排除源码别名；Windows chunk 路径统一。
- `build:app` 在编译前检查公共包真实 exports 的 JS / types，缺失时说明完整构建命令；没有跳过 typecheck。
- Cockpit 增加独立 Viewport 实验、立即/定时刷新、布局持久化、损坏存档恢复、独立场景中心。
- Cesium 监听异步 renderError / contextlost，显示可重试错误；销毁实例和监听器，不空白假成功。
- 真实浏览器发现 Designer 布局名称输入被还原：公共组件改为受控草稿，在保存前提交；
  增加回归测试和 `.changeset/calm-cockpit-title.md`，补丁尚未发布。
- Admin 新增三个懒加载页面：`/examples/viewport`、`/examples/datav`、`/examples/cockpit`。
  Mock 菜单和组件白名单同步；Cockpit 使用独立 `cockpit:view`，guest 返回 403。
- 后端 DTO 不保留额外 viewport meta；在应用侧按可信组件标识注入页面策略，不改变远程权限。
- Admin 使用 Vite 8 显式边界及严格执行顺序：Lumal/UI 禁止递归合并，ECharts 保留注册依赖。
  中间版本出现过 Element Plus / ECharts 初始化环，已通过完整图表页回归定位修复。
  DataV 改用五个独立子入口，减少无关引擎图；没有扩大预算或删除原用例。
- 文档补全 runnable 源码、十包覆盖表和 Skill；启用严格死链接校验，修复历史链接。

## 验证记录

证据路径均相对本机忽略目录 `output/`；CI 附件另行记录，不把未运行的环境标为通过。

| 验证 | 实际命令/环境 | 结果 | 证据 |
| --- | --- | --- | --- |
| 全仓库单元测试 | `pnpm test`，Windows / Node 24.14.1 | 1094 通过 | `demo-workspace-tests.log` |
| 全仓库类型检查 | `pnpm typecheck`，Windows | 通过 | `demo-workspace-typecheck.log` |
| 全公共包构建 | `pnpm build`，Windows | 通过 | `demo-workspace-build.log` |
| Cockpit 最终应用构建 | `pnpm --filter lumal-cockpit build:app` | 通过 | `cockpit-demo-build-polished.log` |
| Admin 最终应用构建 | `pnpm --filter lumal-admin build` | 通过 | `admin-build-budget-fixed.log` |
| Admin 生产 E2E | `pnpm test:e2e:release:built`，专用 preview / Chromium，34 用例 | 34 通过 | `admin-e2e-full-verified.log` |
| Cockpit 生产 E2E | `pnpm test:e2e:cockpit:built`，preview / Chromium / SwiftShader | 4 通过，含浏览器时钟驱动刷新和尺寸保存 | `cockpit-e2e-polished.log` |
| ESLint | `pnpm exec eslint .` | 通过 | `demo-lint-polished.log` |
| 模板格式 | `pnpm format:check` | 通过 | `demo-format-check.log` |
| 文档 / 链接 | `pnpm docs:build`，ignoreDeadLinks=false | 通过 | `demo-docs-build-verified.log` |
| 发布边界 / 工作流 | `pnpm release:boundaries` / `pnpm release:workflows` | 通过 | `demo-boundaries-verified.log`、`demo-workflows-check.log` |
| 发布产物 | `node scripts/check-release-artifacts.mjs` | 通过，Admin 最大 JS 358470 B | `demo-artifacts-verified.log` |
| 打包演练 | `pnpm pack:dry-run`，十包 | 通过，未发布 | `demo-pack-dry-run.log` |
| Skill | `python -X utf8 .../quick_validate.py skills/lumal` | 通过；独立分发测试包含在 scripts | 终端结果、`demo-workspace-tests.log` |
| Ubuntu / Windows CI | 新 Build Validation 双平台生产 Job | 待远程运行 | 不以本地 Windows 替代 Ubuntu |
| 线上部署 | 本轮只读核对，不执行部署 | 未部署本分支 | 下表 |

生产 E2E 观察真实 Canvas 像素、地图引擎初始化/切换/释放、同一实例 resize、无静态资源 404，
以及布局、Tab/折叠、全屏、Designer 取消/保存/刷新恢复、配置损坏恢复。
Viewport 覆盖 1280×720、1366×768、1440×900、1920×1080、2560×1440。
本轮没有新做真实浏览器 80% / 125% / 150% 缩放，不以 viewport 设置冒充浏览器缩放。
Designer 复杂拖拽及替换的全组合仍主要由既有公共包测试保护，不宣称本轮四条 E2E 穷尽所有路径。

## 包体与依赖

通过 `measureApplication()` 测量入口 HTML 与静态 import 闭包，动态 chunk 不全计入首屏。
基线使用隔离 frozen install 的 `3f9e184`；gzip 单位为 B。构建信息不同会造成少量字节差异。

| 站点 | 基线 JS / CSS | 本分支 JS / CSS | 原预算 JS / CSS |
| --- | --- | --- | --- |
| Admin | 313019 / 42591 | 332877 / 42797 | 335000 / 50000 |
| Cockpit | 703778 / 71192 | 687525 / 71259 | 800000 / 80000 |

`pnpm release:budgets` 通过，日志 `demo-budgets-verified.log`。新增依赖只有应用显式引用的
workspace 公共包：Cockpit 增 Viewport，Admin 增 Viewport / DataV / Cockpit；未增加第三方运行时依赖。
地图资源仍只属于独立 Demo；Admin 首页和嵌入 Runtime 不请求 Cesium、OpenLayers 或 Designer。

## 生产域名只读核对

2026-10-26 通过 Vercel Deployment / Alias 查询；以下为元数据，不是产物字节一致性证明。

| 站点 | Production Deployment | 构建提交 |
| --- | --- | --- |
| Admin | `dpl_Dq99Mm8xikPk1wzQd8xMHNu4yEEX` | `3f9e1848f87c3e3ca68a04643a604b74f92f5528` |
| Cockpit | `dpl_5CBVHPPqnG7CGoEhR3aXtPXSrtYf` | `78a822a9e2c024d77f8d8c1e1c9be2f94506b262` |
| DataV | `dpl_FLutrqJr4MKxUBCzN7ARoQ9iBN7X` | `3f9e1848f87c3e3ca68a04643a604b74f92f5528` |
| Docs | `dpl_8y6mLR2f4uNHoG2NGDPFpxCsNQ8i` | `abd9e859e5034e3dd33a9d3dc456c3e06d6c6d3f` |

Cockpit 自定义域名的 alias 确认仍指向旧 Deployment，不是本轮产物或 0.0.6-beta 源码。
当前文档域名直接 HTTP 响应包含 0.0.6-beta；搜索索引缓存可能仍展示旧文案，不作为部署证据。
本轮不调整别名、不部署、不声称线上 E2E 通过；需授权后由受控流程更新站点并比对静态产物。

## CI 与交付

Build Validation 新增双平台 demo-production Job：frozen install、两种完整 Cockpit 构建入口、
应用单测、生产 Cockpit E2E、Admin 构建与全部生产 E2E、严格文档构建、原体积预算。
失败上传日志/截图/trace；Release Gate 的站点构建也运行 Cockpit E2E。
静态安全测试防止后续删除平台或跳过生产浏览器，不新增 npm 或部署路径。

主要提交：`1a562e4`（构建输入）、`b8677cb`（Cockpit 能力）、`0dd58a2`（Designer 补丁）、
`b4c60cd`（Cesium 恢复）、`c47cbe0`（Admin 示例）。后续文档、CI 与验收提交以本分支 Git 记录为准。

未完成/未授权：用户原始标准构建失败尚缺完整日志；真实浏览器缩放全矩阵、真实业务页、
生产域名新版本验证、公共补丁 npm 发布、正式合并。两个真实消费者保持只读。
