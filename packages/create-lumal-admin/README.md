# create-lumal-admin

`create-lumal-admin` 是 Lumal 的轻量后台基座脚手架，用于生成通过公开包入口消费 `@lumal/core`、`@lumal/icons` 和 `@lumal/icons-vue` 的 Vue 应用。

## 使用

环境要求：Node.js `>=22.12.0`、pnpm `10.33.0`。本版为 `0.0.3-beta`；以下命令显式指定版本，避免解析到旧的 `latest`。

```bash
pnpm create lumal-admin@0.0.3-beta my-admin
pnpm create lumal-admin@0.0.3-beta my-admin-http --api-mode http
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
- `@lumal/core/theme-chalk/index.scss`、`@lumal/core/style.css` 和 SCSS 样式入口。
- `@lumal/core/minimal` 的 `createLumalAdmin` 启动代码，显式安装 Element Plus、Router 和权限，不注册默认全量组件表。
- `LumalLayout` 后台布局壳和 `LumalRouterView` 路由出口，采用路由驱动标签模式：固定首页页签、`routeTabResolver` 动态追加、会话级持久化、按标签版本刷新、`cacheKeys` 联动关闭与缓存剔除。
- 登录页、会话状态、权限菜单和路由守卫。
- 工作台、受保护业务占位页、403 与独立 404 页面。
- 主题切换、布局与标签偏好持久化、全局设置抽屉。
- `createRequestClient` 请求封装示例。
- Element Plus、Vue 和 Lumal 公共能力的明确 vendor 分包配置。

脚手架生成的项目只通过 `@lumal/core`、`@lumal/icons`、`@lumal/icons-vue` 等公开包入口消费能力，不依赖 monorepo 内部源码路径。

三个 Lumal 依赖由构建步骤注入与脚手架相同的精确版本 `0.0.3-beta`，不使用浮动版本。模板按用户重建布局壳，登录前清理旧会话与标签快照。轻入口不代表移除模板所需的 Element Plus。

维护者可在仓库根目录执行 `pnpm build` 后运行 `pnpm test:create-consumer`，从实际 tarball 验证无 UI 的 minimal/request 消费及 `local`、`http` 两种生成模式的独立安装和构建。

脚手架不会生成用户、角色、菜单、字典、配置等完整系统管理业务；这些应由具体项目按自身接口和权限模型实现。
