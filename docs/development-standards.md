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

## 配置与边界

`@antfu/eslint-config` 8 系列负责 Vue3/TypeScript、未使用导入/变量及导入顺序，
明确启用 script-setup 和组件模板 PascalCase。格式规则通过 `stylistic: false`、
`formatters: false` 关闭，再在最终 flat config 应用 `eslint-config-prettier/flat`。
Prettier 独立运行，不通过 ESLint 插件二次格式化，不要求 Monorepo 公共包采用生成项目分号风格。

`import-x/no-cycle` 使用 TypeScript resolver，忽略外部包循环；
`import-x/no-restricted-paths` 禁止 shared 反向依赖 modules。
同时存在 `src/admin` 与 `src/screen` 时才增加两个业务域互禁及 shared 反向依赖约束。
Blank 不需要创建这些目录；业务项目可按自己的模块归属扩展 zones，不应解除边界来绕过错误。

EditorConfig 指定 UTF-8、LF、2空格、末尾换行和尾空白规则，Markdown保留有语义的尾空白。
`.gitattributes` 使用文本LF规则，不把二进制资产当文本。格式忽略文件排除依赖、dist、
coverage、锁文件与生成声明，避免Windows/Linux/macOS产生无意义的全文件差异。

`AGENTS.md` 只保留操作约束，详细职责和项目类型差异集中在 `docs/DEVELOPMENT.md`：
Admin 复用 Schema/CRUD 表达常规查询编辑，复杂工作流组合普通 Vue+Element Plus；
Screen 不引入管理布局，地图按实际容器 resize；Blank 不预装业务框架。
Router装配页面，Composable管理复用状态和清理，Store仅保存跨页面状态，
API Adapter转换响应和DTO；前端权限不能代替后端鉴权。

## 检查

`pnpm check` 依次运行 lint、format:check、typecheck、test、build。
首次安装先生成 lockfile，然后使用 frozen-lockfile 复测；不生成伪造 lockfile。
依赖、dist、coverage、锁文件和声明文件不参与格式化。

仓库 `pnpm format:check` 仅检查项目模板，`pnpm format` 只格式化这些模板。
生成器测试同时检查最终输出和重复格式化的幂等性，CI 运行模板格式门禁。

阶段验证中，2026-10-23 的 Standard/HTTP 独立消费者已运行完整 check：
Lint、Prettier、vue-tsc、46 项单测及生产构建通过，随后 frozen-lockfile 安装通过。
日志：`output/release/next-quality-final-check.log`、`next-quality-frozen.log`。
生成器 54 项测试通过，日志：`output/release/next-quality-scaffold.log`。
这些是阶段快照，不代替最终全矩阵。当前完整模板门禁为
`pnpm test:create-projects`（14组）和 `pnpm test:create-consumer`（12组Admin及可选模块）。
两者均安装实际tarball，不用工作区源码alias；模板报告记录格式幂等、依赖与生产体积。
