# 0.0.6-beta Demo 整改验收

本轮基线：`3f9e1848f87c3e3ca68a04643a604b74f92f5528`，分支 `codex/cockpit-demo-example-quality`。
公共包维持 `0.0.6-beta`。本轮不发布 npm、不部署生产、不修改真实业务项目。
本报告的功能代码验收提交为 `57792299f13a14032fa841c0113f1201678d8fad`；
GitHub PR 测试使用合并引用 `fa71750a161b8d7ae70a58f0d008e49185c17b93`，不是正式合并。
[主 CI](https://github.com/cuteyuchen/lumal/actions/runs/40264662877)、
[Build Validation](https://github.com/cuteyuchen/lumal/actions/runs/40264662712) 均已完成并通过；
下文另列外部 Vercel Preview 的失败，不将它隐去。
这些是 `5779229` 的阶段性证据。后续复跑暴露了 Windows 累计截图超时和刷新用例的模拟时钟竞态，
失败证据与逐次修复保留在下文。`7bae8f2` 的 Cockpit 九项生产 E2E 已在 Ubuntu、Windows 均通过；
该轮 Ubuntu 完整 Demo、主 CI、Windows DataV 和消费者通过，但 Windows Admin 出现跨动画帧测量失败，
不能以历史通过替代该轮结果。收尾补丁修复 Admin 字号策略控件，并改为同帧测量布局；
最后提交的跨平台结果由 [PR 当前检查及附件](https://github.com/cuteyuchen/lumal/pull/8/checks) 记录。

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
- 截图复核发现视口实验 Dialog 未使用应用暗色 Token；复用现有弹层样式，补真实浏览器背景色断言，
  不以根节点的 dark 标记代替浮层验收。
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
| 全仓库单元测试 | `pnpm test`，Windows / Node 24.14.1，Ubuntu / Node 22.23.3 | 本地功能提交 1094 通过；最终功能提交 Ubuntu 1100 通过 | `demo-workspace-tests.log`、CI `40264662877` / `ci-fast-5779229.log` |
| 全仓库类型检查 | `pnpm typecheck`，Windows + Ubuntu | 通过 | `demo-workspace-typecheck.log`、CI `40264662877` |
| 全公共包构建 | `pnpm build`，Windows + Ubuntu | 通过 | `demo-workspace-build.log`、CI `40264662877` |
| Cockpit 最终应用构建 | `pnpm --filter lumal-cockpit build:app` | 通过 | `cockpit-demo-build-polished.log` |
| Admin 最终应用构建 | `pnpm --filter lumal-admin build` | 通过 | `admin-build-budget-fixed.log` |
| Admin 生产 E2E | `pnpm test:e2e:release:built`，专用 preview / Chromium，34 用例 | 34 通过 | `admin-e2e-full-verified.log` |
| Cockpit 本地生产 E2E | `pnpm test:e2e:cockpit:built`，preview / Chromium / SwiftShader | 8 通过，含浏览器时钟驱动刷新、实际缩放边界及重试后的像素 | `cockpit-e2e-node-pixels.log` |
| 暗色弹层回归 | 修改前 dist 上运行新增样式断言，再重新构建运行完整 E2E | 旧产物确为白底，断言失败；修复后 8 通过，1.6 分钟，1280×720 截图复核通过 | `cockpit-viewport-dark-baseline.log`、`cockpit-dark-dialog-build.log`、`cockpit-e2e-dark-dialog.log` |
| Node 像素分析回归 | `pnpm --filter lumal-cockpit test`、独立 `tsc --ignoreConfig --noEmit --strict ... canvas-pixels.ts` | 应用单元 24 通过，含 4 项 PNG 取样测试；类型检查通过 | 本地终端 |
| ESLint | `pnpm exec eslint .` | 通过 | `demo-lint-polished.log` |
| 模板格式 | `pnpm format:check` | 通过 | `demo-format-check.log` |
| 文档 / Skill / 安全 / 测试配置契约 | `pnpm exec vitest run --config vitest.config.ts scripts/docs-links.test.ts scripts/playwright-release.test.ts scripts/lumal-skill.test.ts scripts/release-safety.test.mjs` | 收尾更新后 97 通过 | 本地终端，最终功能提交加报告更新 |
| 全脚本回归 | `pnpm test:scripts`，Windows | 115 通过 | `demo-scripts-ci-followup.log` |
| 文档 / 链接 | `pnpm docs:build`，ignoreDeadLinks=false | 通过 | `demo-docs-build-verified.log` |
| 发布边界 / 工作流 | `pnpm release:boundaries` / `pnpm release:workflows` | 通过 | `demo-boundaries-verified.log`、`demo-workflows-check.log` |
| 发布产物 | `node scripts/check-release-artifacts.mjs` | 通过，Admin 最大 JS 358470 B | `demo-artifacts-verified.log` |
| 打包演练 | `pnpm pack:dry-run`，十包 | 通过，未发布 | `demo-pack-dry-run.log` |
| Skill | `python -X utf8 .../quick_validate.py skills/lumal` | 通过；独立分发测试包含在 scripts | 终端结果、`demo-workspace-tests.log` |
| Ubuntu / Windows CI 首轮 | Build Validation `40261401062`，Node 22.23.3 / pnpm 10.33.0 | 双平台 frozen install、两种完整 Cockpit 构建与应用单测通过；生产浏览器超时，整改后复测 | Actions Job `121374384086` / `121374383973` |
| Ubuntu 消费者 / 既有 zoom | 同 run 的 `validate` Job | 通过，含完整脚手架消费者、独立模板、40 组工作区 / 8 组局部缩放 / 2 组实例与稳定窗口检查 | Job `121374384263`，`ci-consumers-f5a07ba.log` |
| Ubuntu 最终 Demo 门禁 | Ubuntu 24.04.5 / Node 22.23.3 / pnpm 10.33.0，Build Validation `40264662712` | frozen install、两种完整构建、20 项应用单测、Cockpit 7 项 / Admin 34 项生产 E2E、严格文档构建、原预算通过 | Job `121384625652`，`ci-ubuntu-demo-5779229.log` |
| Windows 最终 Demo 门禁 | Windows Server 2025 / Node 22.23.4 / pnpm 10.33.0，同 run | 与 Ubuntu 相同的完整门禁通过；Cockpit 7 项 / Admin 34 项通过 | Job `121384625603`，`ci-windows-demo-5779229.log` |
| Windows DataV 视觉 | 同 run，`pnpm test:datav:visual --repeat-each=3` | 通过 | Job `121384625444` |
| 最终消费者 / 模板 / 真实 zoom | Ubuntu，同 run，`pnpm test:create-consumer` / `pnpm test:create-projects` / `pnpm test:viewport` | 全部通过；视口为 40 组工作区、8 组局部缩放、2 组实例与稳定窗口检查 | Job `121384625660`，`ci-consumers-5779229.log` |
| 线上部署 | 本轮只读核对，不执行部署 | 未部署本分支 | 下表 |

生产 E2E 观察真实 Canvas 像素、地图引擎初始化/切换/释放、同一实例 resize、无静态资源 404，
以及布局、Tab/折叠、全屏、Designer 取消/保存/刷新恢复、配置损坏恢复。
Viewport 覆盖 1280×720、1366×768、1440×900、1920×1080、2560×1440。
本轮没有为 Cockpit 新增真实浏览器 80% / 125% / 150% 缩放矩阵，不以 viewport 设置冒充浏览器缩放。
既有 Viewport 消费者的真实 zoom 检查由 Ubuntu CI 实际运行通过，不将它扩展为所有 Demo 已通过该矩阵。
Designer 复杂拖拽及替换的全组合仍主要由既有公共包测试保护，不宣称本轮八条 E2E 穷尽所有路径。

首轮远程生产浏览器测试实际失败：Ubuntu 2 失败 / 2 通过，Windows 3 失败 / 1 通过。
下载的 trace 显示软件 GPU 环境中单次截图耗时约 24 秒、设计器单次操作约 14 秒，
多个职责串在一条用例中耗尽 90 秒，并非构建失败。后续将地图、持久化、刷新和视口操作拆分，
默认动画仍单独验证；其余场景使用应用已有的 reduced-motion 策略，刷新只推进必要的浏览器时钟。
保留真实 Canvas 像素、地图实例、Worker、错误恢复、交互和全部尺寸断言，维持零重试及 90 秒超时。
trace 保留 DOM / 网络 / 源码，停止持续逐帧截图，显式截图和失败截图仍保留。
`82e371f` 本地七条全部通过，2.0 分钟；该本地结果不替代后续远程验收。

第二轮 `40263504391`：Ubuntu、Windows 均为 6 通过 / 1 失败，仅 Cesium 首次像素断言失败。
Ubuntu trace 记录截图取样实际返回 **540 色**，截图及解码约 20.2 秒，
超过 `expect.poll` 的 20 秒预算，导致已经绘制成功的结果被断言层判为超时。
修复为先在测试总预算内获取一次真实截图，再直接检查相同的 `>10` 颜色门槛；
保存 PNG 附件与颜色数量，不再用昂贵截图作为短时轮询的回调。未增加超时、重试或降低像素门槛。
第二轮 CI 的 lint / format / 单元 / 类型 / 公共包构建已成功。

第三轮 `40264662712`、功能提交 `5779229`：Ubuntu 与 Windows 的 Demo Job 均通过，
Cockpit 各 7 项、Admin 各 34 项；没有跳过或重试。Cockpit 分别耗时 4.7 / 5.0 分钟，
Admin 分别耗时 2.2 / 2.0 分钟。两平台均复制 389 项 Cesium 资源，生产网络无未预期 404。
下载的 Ubuntu JSON 报告记录三次 Canvas 取样为 515 / 541 / 578 色，包含 Cesium 恢复后取样；
Windows 对应取样为 524 / 412 / 593 色。
PNG 和 JSON 保存在 `ci-5779229-ubuntu/output/playwright/`，Windows 对应目录为 `ci-5779229-windows/`；
已人工核对 Windows Cesium、Ubuntu 最小视口实验及 Admin Viewport 截图。
独立 `validate` Job 已完成最新消费者、独立模板与真实 zoom 检查，整个 Build Validation run 成功。
主 CI `40264662877` 已完成，包含 lint、format、1100 项单元、类型、构建、Actions 语法与 Linux PTY。

第四轮报告提交 `5ec6b86` 的复跑：主 CI `40266544062` 通过；
Build Validation `40266544074` 中 Ubuntu、Windows DataV 视觉及消费者 / 模板 / 真实 zoom 通过，
但 Windows Cockpit 为 6 通过 / 1 失败，后续 Admin / 文档 / 预算步骤因此跳过，不能沿用上一轮通过宣称本轮成功。
该轮 Ubuntu Cockpit 7 项、Admin 34 项仍通过，失败证据保留于 `ci-windows-demo-5ec6b86.log` 和
`ci-5ec6b86-windows/trace-cesium/`。trace 中上下文创建约 14.3 秒，
首次真实截图约 39 秒、返回浏览器解码约 16.5 秒；错误重试后的第二次截图耗尽 90 秒预算。

后续将正常资源 / resize 与中断恢复拆为两个独立契约，共八项 E2E。
真实 PNG 不再发回正忙于软件 GPU 的浏览器解码，而由测试进程的 `pngjs` 读取，
按固定 32×32 网格统计真实像素；保留 `>10` 门槛、PNG 附件、原 90 秒预算及零重试。
新增空白、小图、大图、无效 PNG 四项测试，防止把占位或解码错误当成成功。
本地八项完整通过，2.0 分钟，三次取样为 402 / 201 / 337 色，
Node 分析耗时分别为 75.0 / 64.4 / 69.3 毫秒；这不是应用运行时的性能数据。
后续跨平台复测见 PR 检查及附件，不以本地结果或第三轮记录替代。

第五轮 `eb42cb4`：主 CI `40268916844` 通过，单元共 1104 项；
Build Validation `40268916942` 中 Ubuntu Cockpit 八项、Admin 34 项、文档和原预算通过，
Windows 两种完整构建和 24 项应用单测通过，Cockpit 为 7 通过 / 1 失败。
正常 Cesium 和中断恢复的真实像素用例都通过；失败仅发生在立即刷新的加载态断言，
因此后续 Windows Admin / 文档 / 预算步骤仍被跳过，不能标为本轮通过。
日志和 trace 保存在 `ci-eb42cb4-windows.log`、`ci-eb42cb4-windows/trace-refresh/`。
trace 中点击后有真实加载态，但读取断言时已消失：`clock.install()` 并不暂停时间，
280ms 演示延迟仍会在浏览器通信和 DOM 快照期间结束。
修复为页面就绪后 `pauseAt()`，之后仅通过 `fastForward()` 推进；不修改应用加载时长、
不增加测试超时或重试、不删除加载态断言。后续跨平台结果仍以当前提交的 PR 检查为准。
修复后本地刷新用例连续五次通过（31.7 秒），完整八项生产 E2E 通过（1.7 分钟），
97 项契约、ESLint、严格文档构建通过；日志 `cockpit-refresh-paused-clock.log`、
`cockpit-e2e-paused-clock.log`、`demo-docs-paused-clock.log`。
第五轮独立消费者、项目模板、既有真实 zoom 和 Windows DataV 视觉也已完成通过，
不以这些结果抵消 Windows Demo Job 的失败。

第六轮 `85df390`：主 CI `40271473414` 通过，1104 项单元、lint、format、类型、构建和 Linux PTY 均通过。
Build Validation `40271473416` 的 Ubuntu Demo、Windows DataV、消费者 / 模板 / 真实 zoom 通过，
Ubuntu Cockpit 八项 / Admin 34 项、文档和原预算通过；Windows 两种完整构建和 24 项应用单测通过，
Cockpit 为 7 通过 / 1 失败，后续 Admin / 文档 / 预算被跳过。
证据 `ci-windows-demo-85df390.log` 和 `ci-85df390-windows/` 保留。
恢复用例 trace 中，上下文创建 10.0 秒、第一次初始化就绪等待 19.45 秒、恢复后的真实截图 39.71 秒；
PNG 返回 290 色，Node 分析 2585ms，独立场景点击也完成，但再次初始化 ECharts 时耗尽 90 秒。
因此将独立场景点击移至常规引擎切换用例；恢复用例仍验证可见错误、真实重试、PNG、退出后的实例释放和网络错误。
不修改应用、像素门槛、trace、90 秒预算或零重试设置，也不删除独立场景的交互断言。
职责调整后，本地完整生产 E2E 八项通过（1.6 分钟），恢复用例 14.1 秒；
97 项契约、ESLint 和严格文档构建通过，日志 `cockpit-e2e-recovery-scope.log`、
`cockpit-recovery-scope-report.json`、`demo-docs-recovery-scope.log`。
该本地结果不替代跨平台复测；当前提交的最终结果见 PR 检查与附件。

第七轮 `7226a98`：主 CI `40273879297` 的 1104 项单元、全部类型与构建通过。
Build Validation `40273879261` 的 Ubuntu 完整 Demo、Windows DataV 和消费者 / 模板 / zoom 通过，
Ubuntu Cockpit 八项 / Admin 34 项通过；Windows Cockpit 仍为 7 通过 / 1 失败，后续门禁跳过。
证据 `ci-windows-demo-7226a98.log`、`ci-7226a98-windows/` 保留，未以复跑替换失败。
trace 证明仅移动交互不足：本轮恢复 PNG 仍返回 290 色，但 Node 全幅同步解码在该 runner 上耗时 13148.5ms，
加上首次就绪约 24.25 秒、截图 34.88 秒，在退出场景前已超过总预算。
恢复用例改为真实截图的中央 768×512 区域；该区域也避开两侧 Widget，防止用 Widget 颜色误判地图已经恢复。
全幅 Canvas 截图、完整场景截图、Worker / 资源、实例 resize 和释放检查仍保留在常规用例，
没有修改应用分辨率、场景内容、像素门槛、超时或重试。新增采样边界测试，后续结果按新提交另行验证。
独立严格类型检查还发现共享诊断 Fixture 对 `message.type()` 多次调用未能收窄类型；
修复为单次读取后分支，运行时规则不变。新增 `pnpm typecheck:e2e:cockpit`，
普通双平台 PR 与 Release Gate 均必跑，并增加防止该步骤被移除的安全回归。
本地完整生产 E2E 八项通过（1.5 分钟），恢复中央采样 27 色、Node 分析 13.8ms，
保留 PNG 并人工复核为地图标签与点位，不含两侧 Widget。
26 项应用单元、97 项契约、E2E 严格类型、ESLint、工作流静态约束和严格文档构建通过；
证据 `cockpit-e2e-central-map.log`、`cockpit-central-map-report.json`、
`playwright/cockpit-recovery-central.png`、`demo-docs-central-map.log`。
这些仍是本地证据，后续跨平台结果见 PR 当前提交的检查与附件。

第八轮 `73fde9f`：主 CI `40276932604` 的 1106 项单元、lint、format、类型和公共包构建通过。
Build Validation `40276932685` 的 Ubuntu 完整 Demo、Windows DataV 及消费者 / 模板 / 既有真实 zoom 通过；
Ubuntu Cockpit 八项 / Admin 34 项通过，Windows Cockpit 为 7 通过 / 1 失败。
两平台 frozen install、两种完整 Cockpit 构建、26 项应用单元及新增 E2E 严格类型均通过。
Windows 恢复契约这次通过（59.7 秒），但首条默认动画 / Widget / 独立场景 / OpenLayers 综合用例
在末尾退出 OpenLayers 时耗尽总预算，后续 Windows Admin / 文档 / 预算门禁仍跳过。
证据 `ci-windows-demo-73fde9f.log`、`ci-73fde9f-windows/` 保留。
trace 记录默认 ECharts 全幅截图 19.65 秒、Node 分析 17338.4ms，
随后独立场景点击 7.38 秒、OpenLayers 点击 19.33 秒，加上导航和其余交互累计超出 90 秒，
不能称为应用构建失败。
因此将默认动画 / 全幅像素 / Widget 与独立场景 / OpenLayers 交互划为两个独立契约，共九项；
前者保留默认动画，后者复用现有 reduced-motion 策略。所有原断言仍在，增加面板重新展开断言，
不增加超时、重试或降低像素门槛，也不改应用或地图渲染质量。后续结果见 PR 当前提交检查。
本地完整生产 E2E 九项通过（2.6 分钟），新增的两条分别为 12.1 / 14.9 秒；
E2E 严格类型、97 项契约、针对性 ESLint 与严格文档构建通过。
证据 `cockpit-e2e-isolated-rendering.log`、`cockpit-isolated-rendering-report.json`、
`demo-docs-isolated-rendering.log`。本地结果不替代下一轮双平台门禁。
只读审查另纠正两处旧文档：`CockpitConfig` 必须提供 `schemaVersion` / `id` / `title` / `layouts`，
`activeLayoutId` 可选；没有新增或修改该公开类型。

第九轮 `7bae8f2`：主 CI `40279289939` 全部通过，包含 1106 项单元、lint、format、类型、构建和 Linux PTY。
Build Validation `40279289936` 的 Ubuntu Job `121428762484` 完整通过：Cockpit 九项、Admin 34 项、
严格文档构建及原预算通过。Windows Job `121428762387` 的 frozen install、两种完整 Cockpit 构建、
26 项应用单元、E2E 类型和 Cockpit 九项均通过，但 Admin 为 33 通过 / 1 失败；
其后文档与预算被跳过。Windows DataV 和独立消费者 Job `121428762491` 通过。
证据为 `ci-main-7bae8f2.log`、`ci-ubuntu-demo-7bae8f2.log`、`ci-windows-demo-7bae8f2.log`、
`ci-7bae8f2-windows/`、`ci-consumer-7bae8f2.log` 及 `ci-7bae8f2-consumer/`。

Windows Admin trace 显示，刷新后正在执行 220ms 侧栏展开及 280ms 页面侧滑。
两次 `boundingBox` 调用分别跨越 123347.8–123396.0ms、123397.2–123439.7ms，
期间工作区宽度为 1209 → 1110 → 1052 → 991px，缩放比例始终为 1。
串行采样得到标题 x=505.82、Widget right=510.49，但失败截图的最终布局并未遮挡。
因此改为同一次浏览器同步回调读取两个矩形，再轮询严格 `title.left - widget.right > 0`；
没有放宽间隔、增加超时、禁用布局动画或调整业务样式。

同轮消费者 JSON 还核对了 12 种 Admin preset/API/router 组合、8 项 CLI、4 组可选模块构建，
以及 14 种 Blank/Screen 项目（每种五个尺寸，共 70 组），安装、check 与生产浏览器均通过。
Viewport 的 Dev/Prod 共 40 组真实浏览器缩放核对 `actualZoom`、DPR 和逻辑视口；
1280×720 在 125% 下实际为 1024×576 / DPR 1.25，在 150% 下为 853×480 / DPR 1.5。
另有 8 组局部适配、2 组生命周期检查通过，地图实例、中心、zoom、点击和监听稳定性保持，
页面 / Console / 运行时错误记录为空。这些是隔离消费者夹具，不是两个业务系统的生产验收。

## Admin 收尾回归

复核发现示例最小字号控件实际无效：`ViewportCanvas` 把下限硬编码为 12，
而不是读取传入策略。旧产物上新增 E2E 准确失败（设置 20px 后仍得到 12px），
新增组件测试也在旧源码准确失败（scale=0.5 时预期 CSS 40px，实际 24px）。
修复使用公开 `useViewportPolicy`，继承全局下限并响应局部覆盖及恢复；
来源为全局或路由时，设计宽、高和最小字号输入与模式输入一致禁用，避免无效操作。
组件测试只验证策略到样式的转换，不代替浏览器字号、弹窗和布局验收。
失败证据保存在 `admin-viewport-font-baseline.log`、`admin-viewport-font-baseline-evidence/`；
修复后的类型、针对性 ESLint、组件测试通过，Admin 生产构建及原预算通过。

本地完整 Admin 首次复测为 33 通过 / 1 失败；新增三个示例测试全部通过，
失败是既有移动表格用例在数据到达前采样：108208ms 时行高和操作高度均为 0，
列表请求于 107918ms 发出、约 387ms 后完成。已将原有“更多按钮可见”断言移至采样前，
保留 32px 按钮、52px 行高、84px 操作列、五档溢出和弹窗交互的全部标准。
证据为 `admin-final-font-e2e.log` 和 `admin-mobile-actions-baseline-evidence/`；
这不是公共表格行为修改，也没有通过删断言消除失败。

CI 证据上传显式启用受限路径内的隐藏文件，确保 `.playwright-results/` 原始 JSON 和 trace
不会因默认隐藏过滤而丢失；四项工作流配置回归保护该约束。历史 Windows trace 本次仍可从 HTML
报告附件中取回，但不能据此声称原始结果目录已经上传。

## 全屏浮层回归

只读复核还发现全屏组合缺陷：Demo 只把 Cockpit 内部根节点全屏，body Teleport 的视口弹窗
及兄弟 Designer 不属于该全屏树。新增独立生产浏览器用例在旧产物准确失败，
`fullscreenElement.contains(dialog)` 为 false，日志 `cockpit-fullscreen-overlay-baseline.log`，
截图和 trace 保存在 `cockpit-fullscreen-overlay-baseline-evidence/`。
修复仅在应用层将全屏宿主改为 `document.documentElement`，不修改公共 `enterFullscreen()`、
不增加 CSS 缩放或改变地图实例。回归覆盖全屏中的视口确认按钮点击、关闭、设计器修改后取消、
不写入存储及退出全屏；保留原三种模式和所有九项生产用例，现在共十项。
接入指南、应用 README 与仓库/安装 Skill 同步说明全屏宿主和缩放宿主的区别；
公共包版本维持 `0.0.6-beta`，不把 Demo 修复误记成已发布补丁。

收尾补丁的本地结果（Windows / Node 24.14.1 / pnpm 10.33.0）：

| 验证 | 实际命令 | 结果与证据 |
| --- | --- | --- |
| Admin 单元及类型 | `pnpm --filter lumal-admin test`，构建内 `vue-tsc` | 186 项通过，`admin-viewport-font-unit.log`、`admin-viewport-font-build.log` |
| Admin 完整生产浏览器 | `pnpm test:e2e:release:built` | 修正数据就绪时序后 34 项通过，2.0 分钟，`admin-final-data-ready-e2e.log` |
| Cockpit 单元 | `pnpm --filter lumal-cockpit test` | 26 项通过，`cockpit-final-overlay-unit.log` |
| Cockpit 类型与构建 | `pnpm --filter lumal-cockpit build:app`、`pnpm typecheck:e2e:cockpit` | 通过，复制 389 项资源，`cockpit-fullscreen-overlay-build.log`、`cockpit-fullscreen-overlay-e2e-types.log` |
| Cockpit 完整生产浏览器 | `pnpm test:e2e:cockpit:built` | 10 项通过，2.3 分钟，全屏组合 11.9 秒，`cockpit-fullscreen-overlay-e2e.log` |
| 文档 / Skill / 发布安全 / 测试配置 | Vitest 四个既有 scripts 文件 | 101 项通过，`demo-final-overlay-contracts.log` |
| 严格文档构建 / 链接 | `pnpm docs:build`，保留 `ignoreDeadLinks=false` | 通过，`demo-final-overlay-docs.log` |
| 发布边界 / 产物 / 原预算 | `pnpm release:boundaries`、`node scripts/check-release-artifacts.mjs`、`pnpm release:budgets` | 通过，`demo-final-overlay-{boundaries,artifacts,budgets}.log` |
| Skill 分发副本 | 两份 `quick_validate.py` 与 SHA256 对比 | 均通过，Cockpit reference 完全一致，未覆盖本机元数据 |

这些本地结果不替代最后提交的双平台 CI。Vite / Viewport 正在由并行任务修改；
本轮独立补丁不包含这些未完成改动，不提前使用新 API，待完成后再进行公共包联合验收。

## 包体与依赖

通过 `measureApplication()` 测量入口 HTML 与静态 import 闭包，动态 chunk 不全计入首屏。
基线使用隔离 frozen install 的 `3f9e184`；gzip 单位为 B。构建信息不同会造成少量字节差异。

| 站点 | 基线 JS / CSS | 本分支 JS / CSS | 原预算 JS / CSS |
| --- | --- | --- | --- |
| Admin | 313019 / 42591 | 332878 / 42797 | 335000 / 50000 |
| Cockpit | 703778 / 71192 | 687529 / 71267 | 800000 / 80000 |

最终功能提交的远程产物也通过同一预算；两平台使用各自构建信息，gzip 允许自然字节差异：

| CI 平台 | Admin JS / CSS | Cockpit JS / CSS |
| --- | --- | --- |
| Ubuntu | 332895 / 42805 | 687533 / 71258 |
| Windows | 332873 / 42797 | 687529 / 71261 |

`pnpm release:budgets` 通过，日志 `demo-budgets-verified.log`；暗色弹层修正后复测见
`demo-budgets-dark-dialog.log`。新增应用运行时依赖只有显式引用的
workspace 公共包：Cockpit 增 Viewport，Admin 增 Viewport / DataV / Cockpit；未增加第三方运行时依赖。
测试进程新增 `pngjs@7.0.0` / `@types/pngjs@6.0.5` 两项根级 devDependencies，
不进入应用入口或公共包依赖；frozen install 和独立类型检查通过。
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
同日五个自定义域名均通过只读 HTTP GET 返回 200；这只能证明入口可访问，不证明新示例已上线。
本轮不调整别名、不部署、不声称线上 E2E 通过；需授权后由受控流程更新站点并比对静态产物。

## Vercel Preview 配置审计

创建 PR 后既有 Git 集成自动生成 Preview，并非本轮主动执行生产部署。
`dpl_D6uTeK2GZeZZv4ADN4zXwLpVfCF9` 对应源码 `f5a07ba`，状态 ERROR，
错误码 `STATIC_BUILD_NO_OUT_DIR`，错误提示找不到 `dist`。读取项目设置及该 Deployment 设置快照确认：

| 配置 | 平台实际值 | 应使用的值 |
| --- | --- | --- |
| Root Directory | 仓库根目录 | 保持仓库根目录 |
| Build Command | `pnpm build && pnpm --filter luma-cockpit build` | `pnpm cockpit:build` |
| Output Directory | `apps/luma-cockpit/dist` | `apps/lumal-cockpit/dist` |
| Node | `24.x` | 满足仓库 `>=22.12.0`；PR CI 验证 22.x，本地验证 24.x |

平台仍使用改名前的包名与目录；日志确有 `No projects matched the filters`，未执行当前 Cockpit 应用构建。
这解释了该 Preview 失败，但不将它当作用户未提供日志的本地构建故障根因。
只修改输出路径不足以修复错误过滤器。平台配置保持未修改，需获得授权后成对更新，
经受控流程构建并核对资源后再部署；不通过仓库根 `vercel.json` 覆盖其他项目。
最终功能提交 `5779229` 的自动 Preview `dpl_GGayLoQqeNEFL6FzXznzMqqdmhAy`
同样失败。再次读取该 Deployment 的设置快照，构建命令、输出目录和 Node 均与上表一致；
构建日志末尾仍包含 `No projects matched the filters` 和 `STATIC_BUILD_NO_OUT_DIR`。
因此 GitHub 主 CI / Demo Job 通过，不代表 PR 的外部 Vercel 检查或线上部署通过。

## CI 与交付

Build Validation 新增双平台 demo-production Job：frozen install、两种完整 Cockpit 构建入口、
应用单测、生产 Cockpit E2E、Admin 构建与全部生产 E2E、严格文档构建、原体积预算。
失败上传日志/截图/trace；Release Gate 的站点构建也运行 Cockpit E2E。
静态安全测试防止后续删除平台或跳过生产浏览器，不新增 npm 或部署路径。

主要提交：`1a562e4`（构建输入）、`b8677cb`（Cockpit 能力）、`0dd58a2`（Designer 补丁）、
`b4c60cd`（Cesium 恢复）、`c47cbe0`（Admin 示例）、`dc181db`（图表初始化与嵌入布局）、
`81659cc`（文档 / Skill）、`f5a07ba`（双平台门禁）、`82e371f`（软件渲染验收隔离）。
后续提交：`9e9e086`（真实缩放边界和平台配置审计）、`5779229`（分离截图与像素断言预算）。
收尾提交：`44b9c02`（Admin 策略字号与同帧/数据就绪测量）、
`107b1e0`（应用级全屏宿主、浮层真实交互、文档与 Skill）。
Draft PR：[cuteyuchen/lumal#8](https://github.com/cuteyuchen/lumal/pull/8)，未合并。

十包文档与实际示例的逐项清单见 [公共包覆盖表](./public-package-coverage.md)，
Vue + Viewport、HTTP Screen、Admin 嵌入 Runtime、Cesium 资源部署见 [接入指南](./demo-integration-guide.md)。

未完成/未授权：用户原始标准构建失败尚缺完整日志；真实浏览器缩放全矩阵、真实业务页、
生产域名新版本验证、公共补丁 npm 发布、正式合并。两个真实消费者保持只读。
