# create-luma-admin

`create-luma-admin` 是 Luma 的轻量后台基座脚手架，用于生成通过公开包入口消费 `@luma/core` 和 `@luma/icons` 的 Vue 应用。

## 使用

```bash
pnpm create luma-admin my-admin
pnpm create luma-admin my-admin-http --api-mode http
```

`--api-mode local` 是默认模式，保留浏览器内请求示例；`--api-mode http` 会额外生成接口环境变量、标准请求客户端、登录刷新示例和 `API-CONTRACT.md`，但不会生成完整业务后端。

生成后执行：

```bash
cd my-admin
pnpm install
pnpm dev
```

## 生成内容

- Vue 3 + TypeScript + Vite。
- Element Plus 作为 UI 基础。
- `@luma/core/theme-chalk/index.scss`、`@luma/core/style.css` 和 SCSS 样式入口。
- `createLumaAdmin` 应用启动代码。
- `LumaLayout` 后台布局壳和 `LumaRouterView` 路由出口，采用路由驱动标签模式：固定首页页签、`routeTabResolver` 按导航动态追加页签、`tabStorageKey` 会话级持久化、标签刷新重载视图。
- 登录页、会话状态、权限菜单和路由守卫。
- 工作台、受保护业务占位页、403 与独立 404 页面。
- 主题切换、布局与标签偏好持久化、全局设置抽屉。
- `createRequestClient` 请求封装示例。
- Element Plus、Vue 和 Luma 公共能力的明确 vendor 分包配置。

脚手架生成的项目只通过 `@luma/core`、`@luma/icons` 等公开包入口消费能力，不依赖 monorepo 内部源码路径。

脚手架不会生成用户、角色、菜单、字典、配置等完整系统管理业务；这些应由具体项目按自身接口和权限模型实现。
