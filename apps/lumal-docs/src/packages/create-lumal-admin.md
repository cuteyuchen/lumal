# create-lumal-admin

轻量 Vue 项目脚手架，生成 Admin、独立 Screen 或 Blank，通过公开包入口按需消费 Lumal。

| 项 | 值 |
| --- | --- |
| 包名 | `create-lumal-admin` |
| 本地路径 | `packages/create-lumal-admin` |
| 在线文档 | https://lumal.cuteyuchen.top/packages/create-lumal-admin |
| npm 地址 | `https://www.npmjs.com/package/create-lumal-admin` |
| CLI | `create-lumal-admin`、通用 `create-lumal` binary |

## 使用

本文面向 `0.0.7-beta` 候选契约，环境要求 Node.js `>=22.12.0`、pnpm `10.33.0`。
以下命令以 registry 存在对应版本为前提；候选发布核验前使用本地 tarball。

```bash
pnpm create lumal-admin@0.0.7-beta my-admin
pnpm create lumal-admin@0.0.7-beta my-admin-http --preset standard --api-mode http --router-mode history --no-interactive
pnpm create lumal-admin@0.0.7-beta my-admin-v5 --preset vben-compatible
pnpm --package=create-lumal-admin@0.0.7-beta dlx create-lumal my-screen --template screen
pnpm --package=create-lumal-admin@0.0.7-beta dlx create-lumal my-blank --template blank
```

Blank 默认仅依赖 Vue；Screen 默认无认证、API、Router 或管理布局。
认证、数据、路由、可视化和适配独立选择，详见 [项目模板](/reference/project-template-guide)。
通用 binary 由现有包分发，不代表独立 `create-lumal` npm 包已发布。
下表及管理业务结构专指 Admin。

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

TTY 向导使用上下方向键单选、Space 多选、Enter 确认，Admin 默认
`standard/local/hash`。指定参数会跳过相应问题；`--features none` 明确关闭可选模块。
配置摘要确认前不写文件，Escape / Ctrl+C 可取消。CI、非 TTY、`TERM=dumb` 和
`--no-interactive` 不等待输入。非法参数或 npm 名称失败，非空目录与符号链接目标拒绝覆盖。

```bash
cd my-admin
pnpm install
pnpm dev
```

## Admin 生成内容

- Vue 3 + TypeScript + Vite + Element Plus
- `@lumal/core/minimal` 启动 + 主题与样式，UI 组件局部导入
- `LumalLayout` + `LumalRouterView`（路由驱动标签、固定首页、会话持久化、按标签刷新与 `cacheKeys` 剔除）
- 登录、会话、权限菜单、路由守卫
- 工作台、受保护页、403 / 404
- standard 的个人资料及修改密码入口
- 主题与布局偏好、全局设置抽屉
- 应用服务契约、HTTP adapter、请求刷新单飞、旧会话隔离与明确 vendor 分包
- README、环境示例、类型、Lint、Vitest、API 契约和生产部署说明

管理业务是可选模板层，不进入 Core；图表、驾驶舱、富文本、i18n 和 VXE 均不默认安装。
HTTP 配置和 Mock 接入见生成项目 `API-CONTRACT.md`；V5 兼容范围见
[迁移矩阵](/reference/migration-from-vben)。

## 模块结构

```text
src/app/                      # 路由、会话、请求、布局和异常页
src/modules/dashboard/        # 工作台（standard 为完整工作台）
src/modules/profile/          # 个人中心（standard / compatible）
src/modules/system/           # 真实父路由与七个独立业务页面
src/modules/examples/         # 可选开发示例
src/modules/vben-migration/   # 仅兼容预设
src/modules/business/         # 自有业务模块
src/shared/                   # 共享表单、树和异步状态
```

新增 `modules/business/<业务>/module.ts`，以 `AppModule` 导出 `menus/views/permissions` 即可注册。
`views` 中使用动态 import；模块扫描只装配元数据，不提前加载页面。
系统的用户、角色、菜单、机构、字典和配置各有页面、API、类型及权限，开发示例不参与系统业务存储。

Local 和 HTTP 使用同一组业务服务。角色资料与授权分开保存；授权成功而会话重读失败会显示部分成功，
只重试权限刷新。HTTP 不提供能力时传播真实错误，不回退本地。远程菜单经过递归组件白名单、
站内路径、权限及 HTTP(S) 外链校验；iframe 另受 `VITE_IFRAME_ORIGINS` 限制。

## monorepo 内调试脚手架

```bash
pnpm --filter create-lumal-admin build
node packages/create-lumal-admin/dist/cli.js my-admin
```

## 边界

- 生成项目只依赖公开包入口，不 alias 到 monorepo 源码
- 业务协议写在应用层 `API-CONTRACT.md` / adapter，不进入 `@lumal/core`
- Core 与图标包使用和脚手架相同的精确版本 `0.0.7-beta`，生成时读取 tarball 自身版本
- 用户切换重建布局壳，登录前清理旧会话与标签快照；轻入口不意味着模板没有 Element Plus

维护验收：先 `pnpm build`，再 `pnpm test:create-consumer`，验证实际 tarball 的
minimal/request 无 UI 消费和全部 12 种生成组合，包含生产 Chromium 交互。
实际结果见 [升级验收](/reference/upgrade-verification)，变更见 [更新日志](/reference/changelog)。
