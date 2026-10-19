# 文档说明

正式文档站位于 **`apps/lumal-docs`**（VitePress，结构参考 [Vben 文档](https://doc.vben.pro/)）。

```bash
pnpm docs:dev      # http://127.0.0.1:5173
pnpm docs:build
pnpm docs:preview
```

本目录是长文 Markdown（架构、Core API、路线图等）的唯一编辑源。文档站 `src/reference/` 只通过 VitePress include 引用对应文件，不再维护第二份正文。指南 / 包使用 / 组件文档仍以 `apps/lumal-docs` 为准。

当前版本：[0.0.3-beta 更新日志](./changelog.md)。仓库版本准备不代表已完成 npm 发布。

AI 接入：[Lumal 总 Skill](../skills/lumal/SKILL.md) 覆盖全部公共包，[安装与调用指南](../apps/lumal-docs/src/guide/essentials/ai-skills.md) 说明如何让 AI 按需读取分包用法。

专项评估：[2026-10-16 轻量框架审计](./architecture-audit-2026-10-16.md)。该报告记录升级验收、体积基线与优化建议，不替代开发路线图。

外链占位（演示、npm、GitHub）见：

`apps/lumal-docs/src/.vitepress/config/links.ts`
