# create-lumal-admin

轻量后台基座脚手架，生成通过公开包入口消费 Lumal 的 Vue 3 应用。

| 项 | 值 |
| --- | --- |
| 包名 | `create-lumal-admin` |
| 本地路径 | `packages/create-lumal-admin` |
| 在线文档 | https://luma-docs-seven.vercel.app/packages/create-lumal-admin |
| 正式地址（上线后） | `https://www.npmjs.com/package/create-lumal-admin` |
| CLI | `create-lumal-admin` |

## 使用

当前工作区：`0.0.5-beta`，环境要求 Node.js `>=22.12.0`、pnpm `10.33.0`。
registry 的 beta 仍为 `0.0.4-beta`，本轮仅做本地 tarball 验证。
以下新版命令以 registry 存在对应版本为前提，状态见 [安装说明](/guide/essentials/installation)。

```bash
pnpm create lumal-admin@0.0.5-beta my-admin
pnpm create lumal-admin@0.0.5-beta my-admin-http --preset standard --api-mode http --router-mode history --no-interactive
pnpm create lumal-admin@0.0.5-beta my-admin-v5 --preset vben-compatible
```

| 选项 | 说明 |
| --- | --- |
| `--preset minimal` | 最小业务基座，不包含管理页面、Schema 示例和兼容层 |
| 默认 / `--preset standard` | 用户、角色授权、菜单、机构、字典、配置与原生 CRUD / Form |
| `--preset vben-compatible` | standard + `/v5` Form / Grid / 权限迁移页面，不加载 VXE |
| 默认 / `--api-mode local` | 明确的开发演示账号，生产默认禁用 |
| `--api-mode http` | 真实认证、刷新、用户、权限、菜单、退出与 CRUD，无配置不回退演示 |
| `--router-mode hash\|history` | 默认 Hash，History 部署须配置 HTML 回退 |
| `--features system,examples\|none` | standard 的可选模块，可只保留其中一个 |
| `--name`、`--help`、`--version` | npm 名称、帮助、版本 |

TTY 依次询问未指定的选项；CI、非 TTY 和 `--no-interactive` 不等待输入，默认
`standard/local/hash`。非法参数或 npm 名称失败，非空目录与符号链接目标拒绝覆盖。

```bash
cd my-admin
pnpm install
pnpm dev
```

## 生成内容

- Vue 3 + TypeScript + Vite + Element Plus
- `@lumal/core/minimal` 启动 + 主题与样式，UI 组件局部导入
- `LumalLayout` + `LumalRouterView`（路由驱动标签、固定首页、会话持久化、按标签刷新与 `cacheKeys` 剔除）
- 登录、会话、权限菜单、路由守卫
- 工作台、受保护页、403 / 404
- 主题与布局偏好、全局设置抽屉
- 应用服务契约、HTTP adapter、请求刷新单飞、旧会话隔离与明确 vendor 分包
- README、环境示例、类型、Lint、Vitest、API 契约和生产部署说明

管理业务是可选模板层，不进入 Core；图表、驾驶舱、富文本、i18n 和 VXE 均不默认安装。
HTTP 配置和 Mock 接入见生成项目 `API-CONTRACT.md`；V5 兼容范围见
[迁移矩阵](/reference/migration-from-vben)。

## monorepo 内调试脚手架

```bash
pnpm --filter create-lumal-admin build
node packages/create-lumal-admin/dist/cli.js my-admin
```

## 边界

- 生成项目只依赖公开包入口，不 alias 到 monorepo 源码
- 业务协议写在应用层 `API-CONTRACT.md` / adapter，不进入 `@lumal/core`
- Core 与图标包使用和脚手架相同的精确版本 `0.0.5-beta`，生成时读取 tarball 自身版本
- 用户切换重建布局壳，登录前清理旧会话与标签快照；轻入口不意味着模板没有 Element Plus

维护验收：先 `pnpm build`，再 `pnpm test:create-consumer`，验证实际 tarball 的
minimal/request 无 UI 消费和全部 12 种生成组合，包含生产 Chromium 交互。
实际结果见 [升级验收](/reference/upgrade-verification)，变更见 [更新日志](/reference/changelog)。
