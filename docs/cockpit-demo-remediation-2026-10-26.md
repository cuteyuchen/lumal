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

单元、类型、生产构建、生产浏览器、CI 跨平台及线上部署是不同证据，后续结果按类别记录。
基线截图不代表已验证地图引擎、Designer、所有资源或线上部署。
