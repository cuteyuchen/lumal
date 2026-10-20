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
```

| 预设 | 内容 |
| --- | --- |
| `minimal` | 轻入口、布局、认证、权限、动态菜单、请求、主题、403/404 |
| `standard` | 默认预设；增加用户、角色授权、菜单、机构、字典、配置与 Schema/CRUD 示例 |
| `vben-compatible` | standard 加 Vben 5.7.0 Form、Grid、Dialog CRUD 与权限迁移页面 |

三种预设均支持 Local/HTTP 数据源、Hash/History 路由。可用
`--features system,examples` 选择业务层，或 `--features none` 禁用；
minimal 不接受业务模块。

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

兼容预设只增加 `@lumal/vben-compat`，页面显式导入 `/v5`；
不默认安装 VXE、图表、驾驶舱、富文本或国际化。

## 本地调试脚手架本身

```bash
pnpm --filter create-lumal-admin build
node packages/create-lumal-admin/dist/cli.js tmp-admin
```

更多说明：[create-lumal-admin 包文档](/packages/create-lumal-admin)
