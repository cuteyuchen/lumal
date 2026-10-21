# 脚手架项目

使用 `create-lumal-admin` 生成独立后台基座，**只通过公开包入口**消费 `@lumal/*`，不依赖 monorepo 内部路径。

## 命令

当前工作区为 `0.0.5-beta`，要求 Node.js `>=22.12.0`、pnpm `10.33.0`。
registry 的 beta 仍为 `0.0.4-beta`；本轮仅做本地 tarball 验证。
以下新版命令以 registry 存在对应版本为前提，见 [安装说明](/guide/essentials/installation)。

```bash
pnpm create lumal-admin@0.0.5-beta my-admin
pnpm create lumal-admin@0.0.5-beta my-admin --api-mode local   # 默认
pnpm create lumal-admin@0.0.5-beta my-admin-http --api-mode http
pnpm create lumal-admin@0.0.5-beta my-admin-http --preset standard --api-mode http --router-mode history --no-interactive
pnpm create lumal-admin@0.0.5-beta my-admin-v5 --preset vben-compatible --features none
```

| 预设 | 内容 |
| --- | --- |
| `minimal` | 轻入口、布局、认证、权限、动态菜单、请求、主题、403/404 |
| `standard` | 默认预设；增加用户、角色授权、菜单、机构、字典、配置与 Schema/CRUD 示例 |
| `vben-compatible` | standard 加 Vben 5.7.0 Form、Grid、Dialog CRUD 与权限迁移页面 |

三种预设均支持 Local/HTTP 数据源、Hash/History 路由。可用
`--features system,examples` 选择业务层，或 `--features none` 禁用；
minimal 不接受业务模块。

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

Core 与图标依赖精确使用同版 `0.0.5-beta`，不依赖浮动标签。模板按用户隔离布局状态，
登录前清理旧快照。HTTP 模式已接通登录、刷新、用户、权限、菜单、退出和 CRUD，
必须配置符合 `API-CONTRACT.md` 的真实后端；未配置不会回退演示认证。
Local 的演示账号仅用于开发，生产默认禁用。

HTTP 的协议适配位于应用 `src/services/http-adapter.ts`，不会把公司业务码写进 Core。
`standard` adapter 直接消费标准 JSON；接入仓库 Mock API 才显式选择 `lumal-mock`。
首次深层链接等待会话与菜单初始化后重新匹配，GET 401 共享刷新并最多重放一次，
写请求默认不重放。生产配置参考 `.env.production.example`；
History 部署需要将非文件页面回退到 `index.html`，不能回退 API 请求。

兼容预设只增加 `@lumal/vben-compat`，页面显式导入 `/v5`；
不默认安装 VXE、图表、驾驶舱、富文本或国际化。

## 本地调试脚手架本身

```bash
pnpm --filter create-lumal-admin build
node packages/create-lumal-admin/dist/cli.js tmp-admin
```

更多说明：[create-lumal-admin 包文档](/packages/create-lumal-admin)
