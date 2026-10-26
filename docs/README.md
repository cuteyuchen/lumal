# 文档说明

正式文档站位于 **`apps/lumal-docs`**（VitePress，结构参考 [Vben 文档](https://doc.vben.pro/)）。

```bash
pnpm docs:dev      # http://127.0.0.1:5173
pnpm docs:build
pnpm docs:preview
```

本目录是长文 Markdown（架构、Core API、路线图等）的唯一编辑源。文档站 `src/reference/` 只通过 VitePress include 引用对应文件，不再维护第二份正文。指南 / 包使用 / 组件文档仍以 `apps/lumal-docs` 为准。

工作区与当前指南的 API 基线：`0.0.7-beta`，十包已同版发布。
正式标签门禁、registry、同次发布产物及六类 registry 消费者核验已完成；业务兼容和部署边界以各专项记录为准。

本轮交付：[下一阶段审计与验收](./lumal-next-phase-audit.md)、
[项目模板](./project-template-guide.md)、[工程规范](./development-standards.md)、
[屏幕适配](./screen-viewport-guide.md)与[隔离验收](./screen-viewport-verification.md)、
[真实消费者](./real-consumer-compatibility.md)、
[升级与迁移](./upgrade-guide.md)。
前一阶段：[脚手架专项重构验收](./scaffold-refactor-2026-10-23.md)。
历史交付：[三模板与 Vben 5 升级验收](./upgrade-verification.md)，能力起点见 [源码审计](./upgrade-audit.md)，迁移边界见 [Vben 5 兼容矩阵](./migration-from-vben.md)。

当前发布记录：[0.0.7-beta npm 发布记录](./npm-release-0.0.7-beta.md)。
历史已核验记录：[0.0.6-beta](./npm-release-0.0.6-beta.md)、[0.0.5-beta](./npm-release-0.0.5-beta.md)；
历史报告不替代本版核验。
历史版本准备见 [分支合并记录](./release-preparation-0.0.4-beta.md)。

AI 接入：[Lumal 总 Skill](../skills/lumal/SKILL.md) 覆盖全部公共包，[安装与调用指南](../apps/lumal-docs/src/guide/essentials/ai-skills.md) 说明如何让 AI 按需读取分包用法。

专项评估：[2026-10-16 轻量框架审计](./architecture-audit-2026-10-16.md)。该报告记录升级验收、体积基线与优化建议，不替代开发路线图。

外链配置（演示、npm、GitHub）见：

`apps/lumal-docs/src/.vitepress/config/links.ts`
