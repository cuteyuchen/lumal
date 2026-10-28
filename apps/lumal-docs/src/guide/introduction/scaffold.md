# 脚手架项目

使用 `create-lumal-admin` 包生成 Admin、独立 Screen 或 Blank 项目。
应用**只通过公开包入口**消费 `@lumal/*`，不依赖 monorepo 内部路径；Blank 默认仅依赖 Vue。

## 命令

下列命令对应 `0.1.0-beta.0`，要求 Node.js `>=22.12.0`、pnpm `10.33.0`。
显式选择版本而不依赖 `latest`；尚未发布的源码需先构建 tarball，
见 [安装说明](/guide/essentials/installation)。

```bash
pnpm create lumal-admin@0.1.0-beta.0 my-admin
pnpm create lumal-admin@0.1.0-beta.0 my-admin --api-mode local   # 默认
pnpm create lumal-admin@0.1.0-beta.0 my-admin-http --api-mode http
pnpm create lumal-admin@0.1.0-beta.0 my-admin-http --preset standard --api-mode http --router-mode history --no-interactive
pnpm create lumal-admin@0.1.0-beta.0 my-admin-v5 --preset vben-compatible --features none
pnpm --package=create-lumal-admin@0.1.0-beta.0 dlx create-lumal my-screen --template screen
pnpm --package=create-lumal-admin@0.1.0-beta.0 dlx create-lumal my-blank --template blank
```

通用 `create-lumal` binary 随现有包分发，不表示独立 `create-lumal` npm 包已发布。
Screen 的认证、请求、路由、可视化和适配选项见 [项目模板](/reference/project-template-guide)。
以下预设与生成内容专指 Admin。

| 预设 | 内容 |
| --- | --- |
| `minimal` | 轻入口、布局、认证、权限、动态菜单、请求、主题、403/404 |
| `standard` | 默认预设；增加用户、角色授权、菜单、机构、字典、配置与 Schema/CRUD 示例 |
| `vben-compatible` | standard 加 Vben 5.7.0 Form、Grid、Dialog CRUD 与权限迁移页面 |

三种预设均支持 Local/HTTP 数据源、Hash/History 路由。可用
`--features system,examples` 选择业务层，或 `--features none` 禁用；
minimal 不接受业务模块。

向导使用方向键单选、Space 多选，并在配置摘要确认后写入项目；
Escape / Ctrl+C 可取消。候选发布核验前使用本地 tarball，不用历史发布包代替新能力。
TTY 会询问项目目录、npm 名称及未显式指定的选项；CI、非 TTY 和 `--no-interactive`
不等待输入，默认 `standard/local/hash`。目录与 npm 名称不同时使用 `--name`；
`--help` 与 `--version` 不写入项目。无 `--force`，非空目录、文件或符号链接目标均拒绝覆盖；
写入失败只清理本次创建的文件及空目录，不删除用户原有内容。

## 生成内容

- Vue 3 + TypeScript + Vite + Element Plus
- `@lumal/core/minimal` 的 `createLumalAdmin` + 显式 UI / 路由 / 权限接线和样式
- `LumalLayout` + `LumalRouterView`（路由驱动标签、固定首页、会话持久化、按标签刷新和缓存剔除）
- 登录、会话、权限菜单、守卫、403 / 404
- 主题与布局偏好、设置抽屉
- 明确 vendor 分包配置

Core 与图标依赖精确使用同版 `0.1.0-beta.0`，不依赖浮动标签。模板按用户隔离布局状态，
登录前清理旧快照。HTTP 模式已接通登录、刷新、用户、权限、菜单、退出和 CRUD，
必须配置符合 `API-CONTRACT.md` 的真实后端；未配置不会回退演示认证。
Local 的演示账号仅用于开发，生产默认禁用。

HTTP 的协议适配位于应用 `src/app/services/http-adapter.ts`，不会把公司业务码写进 Core。
`standard` adapter 直接消费标准 JSON；接入仓库 Mock API 才显式选择 `lumal-mock`。
首次深层链接等待会话与菜单初始化后重新匹配，GET 401 共享刷新并最多重放一次，
写请求默认不重放。生产配置参考 `.env.production.example`；
History 部署需要将非文件页面回退到 `index.html`，不能回退 API 请求。

兼容预设只增加 `@lumal/vben-compat`，页面显式导入 `/v5`；
不默认安装 VXE、图表、驾驶舱、富文本或国际化。

## 业务扩展

`src/app` 管理运行基础，`src/shared` 放稳定复用能力，`src/modules` 按业务划分。
系统管理、开发示例和 Vben 迁移拥有独立父路由；系统页不再共用万能实体组件。
新增业务放在 `src/modules/business/<名称>/module.ts`，导出 `AppModule` 的菜单、懒加载页面白名单与权限树，
无需同时修改中心路由和侧边栏。标准预设还包括工作台和个人中心。

用户、角色授权、菜单树、机构树、字典分类/项和配置分别通过模块强类型 API 工作。
HTTP 必须实现生成契约中的真实端点；个人中心不会在请求失败时提示密码已修改。

## 本地调试脚手架本身

```bash
pnpm --filter create-lumal-admin build
node packages/create-lumal-admin/dist/cli.js tmp-admin
```

更多说明：[create-lumal-admin 包文档](/packages/create-lumal-admin)
