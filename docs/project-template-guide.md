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

## Screen 能力

```sh
node packages/create-lumal-admin/dist/project-cli.js static-screen --template screen --no-interactive
node packages/create-lumal-admin/dist/project-cli.js data-screen --template screen --data http --no-interactive
node packages/create-lumal-admin/dist/project-cli.js internal-screen --template screen --auth http --data http --router-mode history --no-interactive
node packages/create-lumal-admin/dist/project-cli.js demo-screen --template screen --auth local-demo --data local --no-interactive
```

`--auth none|local-demo|http` 与 `--data none|local|http` 独立。
HTTP 认证即使搭配 `--data none` 也会发起登录/刷新网络请求。
没有网络能力的项目不生成 HTTP 配置、接口地址或无用请求文件。
Local Demo 只在开发允许 `demo / demo`，生产禁用，不能借演示账号绕过后端失败。

认证门禁保留当前路径，通过内容切换保护页面，不强制安装 Router。
会话服务复用 `@lumal/core/auth`，HTTP 复用 `@lumal/core/request`，不引入 Admin UI。
HTTP 契约、超时、Token 存储和后端字段映射位于生成的 `API-CONTRACT.md` 与 `src/services`。
这只是应用接入层，不声称真实业务后端已经可用。

`--visualization none|charts|datav|cockpit` 与认证、数据独立，只生成所选演示。
Charts 使用 ECharts；DataV 数字/边框不要求 ECharts；Cockpit 只使用 runtime，
不加载 Designer。`--viewport disabled|responsive|contain|width|vw` 单独控制适配，
默认 responsive 不增加依赖；非默认适配才加入 `@lumal/viewport`。
`scale` 保留为 contain 的别名，不是第二套算法。

```sh
node packages/create-lumal-admin/dist/project-cli.js datav-screen --template screen --visualization datav --viewport contain --no-interactive
node packages/create-lumal-admin/dist/project-cli.js chart-screen --template screen --visualization charts --viewport responsive --no-interactive
```

模板采用 `common + vue + blank/screen` 或 `base + common + Admin 功能层` 组合。
Blank/Screen 从不叠加 Admin base，不依靠先生成再删除业务文件来精简。

## Admin 与 Screen 共存

Hybrid 不作为必选的第四种框架。已有应用保留一个 Router、一个会话和所需的 Store，
按顶级路由组合不同布局。以下是应用自有路由的接线片段，组件由应用导入：

```ts
const routes = [
  {
    path: '/screen',
    name: 'Screen',
    component: ScreenPage,
    meta: { requireLogin: false, layout: 'public', keepAlive: true },
  },
  {
    path: '/admin',
    component: AdminShell,
    meta: { requireLogin: true },
    children: [
      {
        path: 'records',
        name: 'Records',
        component: RecordsPage,
        meta: { permissions: ['records:read'] },
      },
    ],
  },
];
```

使用 `setupPermissionGuard`，开启 `requireLoginByDefault`，为访客 Screen、403、404 显式设置
`requireLogin: false`，登录页由守卫放行。`layout` 只是应用元信息，不授予权限。
路由守卫读取 `meta.permissions/roles`；菜单模型读取 `meta.authority`，不要混用。
服务端仍须独立鉴权，公开大屏也不能绕过其数据接口权限。

`AdminShell` 使用 `LumalLayout`，传入后台自己的菜单和
`:route-tab-filter="route => route.path.startsWith('/admin/')"`；
Screen 不进入后台标签。`LumalRouterView` 的稳定 viewKey 与 cacheKeys 保持一致，
让 Screen 在顶层缓存，后台页在 AdminShell 内按标签缓存；关闭后台标签不能销毁地图实例。
KeepAlive 停用时暂停页面轮询和尺寸监听，返回后恢复，不重新初始化地图。

权限更新后先更新菜单/动态路由，再用
`router.replace({ path: router.currentRoute.value.fullPath, force: true })` 重新鉴权当前页。
动态业务路由通过 `createRouteRegistry` 或菜单运行时管理，不在 watcher 中反复 addRoute。
退出时按会话清理请求、权限、远程路由和标签，避免旧初始化覆盖新身份。

页面适配使用 `route.meta.viewport` 或局部 `LumalViewport`，仅包住实际工作区；
后台系统页面设为 false，不全局变换字体或 DOM 根。全局/页面/容器示例与 Teleport、
地图和图表边界见 [屏幕适配](./screen-viewport-guide.md)。

可执行契约在 `packages/core/tests/hybrid-consumer.test.ts`：访客导航、登录回跳、
403/404、身份切换、重复动态注册与标签隔离均通过现有公开 API 验证，无需新增布局框架。

## 开发

首次生成没有锁文件，先执行 `pnpm install`，提交生成的锁文件，
后续独立安装和 CI 使用 `pnpm install --frozen-lockfile`。安装后执行 `pnpm check`，
依次运行 lint、格式检查、类型检查、单元测试和生产构建。

格式职责和 AI 开发约定见 [工程规范](./development-standards.md)。
生成项目中的页面和 Adapter 可以按业务修改；公共行为修复应优先贡献到公共包，
不要复制 Monorepo 私有实现。
