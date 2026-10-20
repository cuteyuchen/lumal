# 脚手架项目

使用 `create-lumal-admin` 生成独立后台基座，**只通过公开包入口**消费 `@lumal/*`，不依赖 monorepo 内部路径。

## 命令

工作区准备版本为 `0.0.4-beta`，要求 Node.js `>=22.12.0`、pnpm `10.33.0`。以下 npm 命令在本版发布后使用，显式指定版本：

```bash
pnpm create lumal-admin@0.0.4-beta my-admin
pnpm create lumal-admin@0.0.4-beta my-admin --api-mode local   # 默认
pnpm create lumal-admin@0.0.4-beta my-admin-http --api-mode http
```

| 模式 | 内容 |
| --- | --- |
| `local` | 浏览器内请求示例 |
| `http` | 额外生成 `VITE_API_BASE_URL`、请求客户端、登录刷新示例、`API-CONTRACT.md` |

## 生成内容

- Vue 3 + TypeScript + Vite + Element Plus
- `@lumal/core/minimal` 的 `createLumalAdmin` + 显式 UI / 路由 / 权限接线和样式
- `LumalLayout` + `LumalRouterView`（路由驱动标签、固定首页、会话持久化、按标签刷新和缓存剔除）
- 登录、会话、权限菜单、守卫、403 / 404
- 主题与布局偏好、设置抽屉
- 明确 vendor 分包配置

**不会**生成完整用户 / 角色 / 菜单 / 字典系统管理业务（参考 `apps/lumal-admin`）。

Core 与图标依赖精确使用同版 `0.0.4-beta`，不依赖浮动标签。模板按用户隔离布局状态，登录前清理旧快照。HTTP 模式仍需项目实现实际接口、响应适配和认证接线。

## 本地调试脚手架本身

```bash
pnpm --filter create-lumal-admin build
node packages/create-lumal-admin/dist/cli.js tmp-admin
```

更多说明：[create-lumal-admin 包文档](/packages/create-lumal-admin)
