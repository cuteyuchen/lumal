# 项目模板

本分支扩展现有 `create-lumal-admin`，未发布新 npm 包。包内新增
`create-lumal` binary 和 `createLumalProject` API，保留旧 binary、API 与默认参数。
`create-lumal` 名称在 2026-10-23 的 registry 查询返回 E404，不表示已取得发布权。
发布方案确认前，不要把 `pnpm create lumal` 当成已发布命令。

## 本地候选版本

构建仓库后可以使用：

```sh
node packages/create-lumal-admin/dist/project-cli.js demo --template blank --no-interactive
node packages/create-lumal-admin/dist/project-cli.js screen-demo --template screen --no-interactive
node packages/create-lumal-admin/dist/cli.js admin-app --preset standard --api-mode local --no-interactive
```

通用入口在 TTY 中选择 Admin、Screen、Blank。旧入口仍默认 Admin。
目录非空拒绝写入，取消或失败只回滚本次创建且仍由本次拥有的文件。

## 选择模板

| 类型 | 默认运行时依赖 | 用途 |
| --- | --- | --- |
| Blank | Vue | 没有后台、路由、状态库和 UI 框架的最小应用 |
| Screen | Vue | 可直接运行的静态数据总览，不包含菜单、标签和系统管理 |
| Admin | 原有 Core、Element Plus 等 | Minimal、Standard 和 Vben Compatible 后台 |

Blank 不依赖 Core，因为它没有使用 Core 的能力。工程规范和测试不是运行时框架依赖。
Screen 的 `--router-mode none` 是真正单页，选择 hash/history 才安装 Vue Router。
History 部署需要服务器提供 SPA fallback。

模板采用 `common + vue + blank/screen` 或 `base + common + Admin 功能层` 组合。
Blank/Screen 从不叠加 Admin base，不依靠先生成再删除业务文件来精简。

## 开发

首次生成没有锁文件，先执行 `pnpm install`，提交生成的锁文件，
后续独立安装和 CI 使用 `pnpm install --frozen-lockfile`。安装后执行 `pnpm check`，
依次运行 lint、格式检查、类型检查、单元测试和生产构建。

格式职责和 AI 开发约定见 [工程规范](./development-standards.md)。
生成项目中的页面和 Adapter 可以按业务修改；公共行为修复应优先贡献到公共包，
不要复制 Monorepo 私有实现。
