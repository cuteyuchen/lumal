# 文档说明

正式文档站位于 **`apps/lumal-docs`**（VitePress，结构参考 [Vben 文档](https://doc.vben.pro/)）。

```bash
pnpm docs:dev      # http://127.0.0.1:5173
pnpm docs:build
pnpm docs:preview
```

本目录是长文 Markdown（架构、Core API、路线图等）的唯一编辑源。文档站 `src/reference/` 只通过 VitePress include 引用对应文件，不再维护第二份正文。指南 / 包使用 / 组件文档仍以 `apps/lumal-docs` 为准。

当前版本：[0.0.4-beta 更新日志](./changelog.md)。仓库版本准备不代表已完成 npm 发布。

本轮交付：[0.0.4-beta 版本准备与分支合并记录](./release-preparation-0.0.4-beta.md)，包含实际命令、预算及未验证项。

发布执行：[0.0.4-beta npm 发布记录](./npm-release-0.0.4-beta.md)。正式门禁及生产 E2E 已通过，再次更新 Token 后重跑因 `E403 / E_STAGE_REQUIRED` 受阻，当前 Token 仅允许 staging，不能直接发布；九包均未发布本版。

AI 接入：[Lumal 总 Skill](../skills/lumal/SKILL.md) 覆盖全部公共包，[安装与调用指南](../apps/lumal-docs/src/guide/essentials/ai-skills.md) 说明如何让 AI 按需读取分包用法。

专项评估：[2026-10-16 轻量框架审计](./architecture-audit-2026-10-16.md)。该报告记录升级验收、体积基线与优化建议，不替代开发路线图。

外链占位（演示、npm、GitHub）见：

`apps/lumal-docs/src/.vitepress/config/links.ts`
