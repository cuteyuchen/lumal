# 维护 Lumal 仓库

仅在修改包源码、公共 API、模板、构建或发布边界时读取；普通消费项目不需要复制仓库工具链。

## 定位与事实来源

- 公共包为 `packages/*/package.json` 中非 private 的包，`0.0.6-beta` 共十包，包含新增 viewport。manifest 不证明 npm 发布完成，实际状态须查询 registry。不要根据遗留目录名推断另一个 npm 包。
- `package.json.exports` 决定允许的导入路径，`src` 的公开入口与类型决定 API。包内实现文件不是消费方 API。
- 有 `.codegraph/` 时先尝试 CodeGraph；工具不可用再使用 `rg` 与直接阅读源码。不要把本机工具缺失记录成所有用户必须遵守的限制。
- `apps/*` 是消费者与验收入口。包不得反向依赖 apps、业务接口、演示数据或私有项目。
- 变更服务子入口时确认它不经根入口拉入 UI；变更 Designer 时确认只读 runtime 不引入 Designer/Sortable。
- Skill 的知识源码在仓库 `skills/lumal`，安装目录是分发副本。维护时先改仓库版本，再同步需要的副本。

## 代码约定

沿用仓库 AGENTS 指令和现有模式。Vue 使用 `<script setup lang="ts">`，组合式逻辑按 `/***********************说明*********************/` 分块，模板引用使用 `useTemplateRef`。

新增公共 API 同步公开导出、类型、包使用说明和受影响示例；不要无关重构或改动用户尚未提交的内容。安全/生命周期契约先由测试保护，再改实现。

## 选择性验证

在仓库根使用已声明的 pnpm 版本。按影响范围选择，不默认跑浏览器：

```bash
pnpm --filter @lumal/core test
pnpm --filter @lumal/core typecheck
pnpm --filter @lumal/core build
pnpm docs:build
```

上例替换成实际受影响的包。依赖包尚无可用 dist 时先按根脚本中的顺序构建；清理并重建 dist 的任务保持串行，避免消费者读到不完整产物。

需要跨包边界/体积验证时：

```bash
pnpm release:boundaries
pnpm release:artifacts
pnpm release:budgets
```

改动独立 Cockpit 或可视化示例时，完整构建与浏览器验收分别运行
`pnpm cockpit:build` / `pnpm test:e2e:cockpit:built`；
Admin 使用 `pnpm test:e2e:release`。普通公共包 build 不证明 Demo 可运行。
参考 `docs/public-package-coverage.md` 核对十包文档，生产站点必须单独核对部署提交。

修改脚手架时在构建后执行 `pnpm test:create-consumer`。只有确需验证路由、焦点、画布等浏览器行为时再选择相关 Playwright 用例，不因文档或类型改动默认启动全部应用。

## Skill 更新规则

修改导出、组件协议、引擎依赖、轻量入口或脚手架行为时，更新相应 reference；新增公共包时补总入口选型表。不要复制整份 API 手册进总入口。

示例应使用真实公开 API；标明应用自有文件与接线片段，不能把片段声称为完整应用。检查 Markdown 相对链接、导入路径、导出符号和示例类型；版本变化后不要将旧版本号继续称为“最新”。

更新后执行 `pnpm exec vitest run --config vitest.config.ts scripts/lumal-skill.test.ts`，
检查 Skill 内相对链接可独立分发、代码示例只使用公共 exports；这不能替代类型和行为测试。
文档改动再运行 `pnpm docs:build`，不要为纯文档同步默认重跑生产浏览器。

同步安装副本时先比较整个目录，保留消费方自定义内容和 `agents/openai.yaml` 中未改动的元数据。
只复制已核对的知识文件与 references，不删除目标目录中的额外文件。同步后再次比较内容并运行宿主可用的 Skill 校验器；
本机安装路径不是所有宿主的默认路径，不应写死在可分发 Skill 中。

发布前按 `docs/release-checklist.md` 核对包版本、内部依赖、锁文件、变更日志、文档和脚手架。创建 Skill 不等于获得提交、推送、npm 发布或修改 dist-tag 的授权。
