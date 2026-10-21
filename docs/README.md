# 文档说明

正式文档站位于 **`apps/lumal-docs`**（VitePress，结构参考 [Vben 文档](https://doc.vben.pro/)）。

```bash
pnpm docs:dev      # http://127.0.0.1:5173
pnpm docs:build
pnpm docs:preview
```

本目录是长文 Markdown（架构、Core API、路线图等）的唯一编辑源。文档站 `src/reference/` 只通过 VitePress include 引用对应文件，不再维护第二份正文。指南 / 包使用 / 组件文档仍以 `apps/lumal-docs` 为准。

工作区基线：`0.0.5-beta`，本轮升级已完成版本准备与本地验收，尚未执行 npm 发布、tag 推送或生产部署。

本轮交付：[三模板与 Vben 5 升级验收](./upgrade-verification.md)，包含实际命令、测试数量、体积样本和未验证范围；能力起点见 [源码审计](./upgrade-audit.md)，迁移边界见 [Vben 5 兼容矩阵](./migration-from-vben.md)。

最近发布记录：[0.0.4-beta npm 发布记录](./npm-release-0.0.4-beta.md)。该记录核对日为 2026-10-20，九包发布、`beta` 标签、tarball 校验和与公开入口均已核验通过；不能将工作区新版命令视为已在 registry 可用。历史版本准备见 [分支合并记录](./release-preparation-0.0.4-beta.md)。

AI 接入：[Lumal 总 Skill](../skills/lumal/SKILL.md) 覆盖全部公共包，[安装与调用指南](../apps/lumal-docs/src/guide/essentials/ai-skills.md) 说明如何让 AI 按需读取分包用法。

专项评估：[2026-10-16 轻量框架审计](./architecture-audit-2026-10-16.md)。该报告记录升级验收、体积基线与优化建议，不替代开发路线图。

外链占位（演示、npm、GitHub）见：

`apps/lumal-docs/src/.vitepress/config/links.ts`
