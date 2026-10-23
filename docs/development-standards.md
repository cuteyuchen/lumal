# 生成工程开发规范

所有项目共用 `templates/common`，只包含 Vue 工程、工具和开发约定。
`templates/base` 暂保留历史目录名，但现在明确是 Admin 专属层，不供其他项目叠加。

生成文件包括 EditorConfig、Git LF 属性、忽略配置、ESLint、Prettier、TypeScript、
Vite、Vitest、AGENTS 和一份按项目类型追加约定的 `docs/DEVELOPMENT.md`。

## 职责

- ESLint：Vue/TypeScript 质量、未使用代码、导入顺序、循环依赖及共享层依赖方向。
- Prettier：分号、单引号、2 空格、120 列和 LF；关闭 Antfu stylistic/formatters，最后应用兼容配置。
- 已有 admin/screen 双域时启用独立依赖边界；Blank 不强制创建任何业务目录。
- 生成项目与 Monorepo 公共包风格互相隔离，不全量重写公共包。
- Vue 使用 script setup、功能分块注释与 useTemplateRef，后端字段转换留在 Adapter。

## 检查

`pnpm check` 依次运行 lint、format:check、typecheck、test、build。
首次安装先生成 lockfile，然后使用 frozen-lockfile 复测；不生成伪造 lockfile。
依赖、dist、coverage、锁文件和声明文件不参与格式化。

仓库 `pnpm format:check` 仅检查项目模板，`pnpm format` 只格式化这些模板。
生成器测试同时检查最终输出和重复格式化的幂等性，CI 运行模板格式门禁。

2026-10-23 的 Standard/HTTP 独立消费者已运行完整 check：
Lint、Prettier、vue-tsc、46 项单测及生产构建通过，随后 frozen-lockfile 安装通过。
日志：`output/release/next-quality-final-check.log`、`next-quality-frozen.log`。
生成器 54 项测试通过，日志：`output/release/next-quality-scaffold.log`。
