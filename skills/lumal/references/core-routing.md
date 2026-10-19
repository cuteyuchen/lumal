# @lumal/core：路由、权限与布局

## 什么时候用

需要把静态/后端菜单接入 Vue Router、按权限过滤导航，或使用 Lumal 后台布局、标签与缓存时读取。普通业务页面不应自己重复实现这套运行时。

## 选择公开入口

| 入口 | 常用 API |
| --- | --- |
| `@lumal/core/router` | `createMenuRouteRuntime`、`createRouteRegistry`、`normalizeMenuNodes`、`createSidebarMenus`、`createGlobComponentResolver` |
| `@lumal/core/permission` | `createPermissionStore`、`setupPermissionGuard`、`LumalAccessControl` |
| `@lumal/core/directives` | `registerAuthorityDirectives`、`createAuthorityDirective` |
| `@lumal/core/layout` | `LumalLayout`、`LumalRouterView`、`LumalTabs`、`LumalBreadcrumb`、`LumalGlobalSearch` |

## 菜单与动态路由

标准菜单使用 `path/name/component/children/meta`；标题和权限位于 `meta.title/meta.authority`。公司字段在应用 adapter 转换，不散落在布局中。

以下是独立的最小运行时。真实应用复用已有 router，并使用本地视图映射替换示例白名单：

```ts
import type { RouteRecordRaw } from 'vue-router'
import { createPermissionStore } from '@lumal/core/permission'
import { createMenuRouteRuntime } from '@lumal/core/router'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

const router = createRouter({ history: createMemoryHistory(), routes: [] })
const permissions = createPermissionStore({ permissions: ['project:view'] })
const views = { ProjectView: defineComponent({ setup: () => () => h('div') }) }

const menus = createMenuRouteRuntime({
  // 通用路由记录在 Vue Router 边界转换，保留 getRoutes 供冲突检查。
  router: {
    addRoute: route => router.addRoute(route as RouteRecordRaw),
    getRoutes: () => router.getRoutes(),
    hasRoute: name => router.hasRoute(name),
    removeRoute: name => router.removeRoute(name),
  },
  staticMenus: [
    {
      path: '/projects',
      name: 'Projects',
      component: 'ProjectView',
      meta: { title: '项目', authority: ['project:view'] },
    },
  ],
  componentResolver: name => views[name as keyof typeof views],
  hasPermission: values => permissions.hasPermission(values, 'every'),
  hasRole: values => permissions.hasRole(values, 'every'),
})
```

示例组件只是白名单占位；真实消费项目通常使用 SFC 懒加载器。远程菜单可传 `loadRemoteMenus`，登录后 `await menus.loadRemote()`；退出 `menus.resetRemote()`，应用释放 `menus.dispose()`。

- 远程菜单只接受白名单可解析的组件字符串，不能把远程路径直接传给任意动态 import。
- `createMenuRouteRuntime` 在注册前检查重复 path/name 和应用既有路由冲突；需要真实 Router 的 `getRoutes()`。
- 通用路由模型与 Vue Router 的重载类型不同，严格类型项目沿用上例显式桥接，不用 `any` 隐藏不匹配。
- 路由必须通过 `name/path` 保持稳定身份；不要在业务 watcher 里反复 `addRoute`。
- 简单场景也可用 `createRouteRegistry`；退出时调用 `reset()`，不要遗留跨账号动态路由。

## 权限接入

`createLumalAdmin({ permissionStore })` 自动注入 Store；指令仍需通过 `registerAuthorityDirectives(app, store)` 注册。组件/指令不负责请求用户信息。

- `LumalAccessControl` 同时设置权限和角色时为 AND；各自的 `mode/roleMode` 决定 some/every。
- 路由守卫逐层检查 matched 记录，父级约束不能被子级覆盖。
- 菜单可见不等于路由可访问。保留路由守卫和服务端鉴权。
- 退出时清理会话、权限、字典、动态菜单及标签快照；切换用户应重建壳层或使用用户作用域 storage key。

## 布局和标签缓存

`LumalLayout` 接收完整 `menus` 和 `preferences`。`sidebar-nav/top-nav/mixed-nav` 由偏好驱动，应用不必另造顶栏/侧栏菜单状态。

启用 `route-driven` 后，让 Layout 管理访问标签；用 `fixed-tabs`、`route-tab-filter`、`route-tab-resolver` 扩展，不再维护第二份标签数组。

缓存接线示意，`viewKey` 和 `cacheKeys` 必须使用同一套 `path:version` 规则：

```vue
<LumalLayout v-slot="{ tabs }" route-driven :preferences="preferences">
  <LumalRouterView
    cache
    :cache-max="20"
    :view-key="viewKey"
    :cache-keys="tabs.map(tab => `${tab.path}:${versions[tab.path] ?? 0}`)"
  />
</LumalLayout>
```

- 刷新只增加当前标签的 version；关闭标签时移除其版本记录并同步 cacheKeys。不要用一个全局版本让所有缓存一起失效。
- `route.meta.keepAlive === false` 禁用该页缓存。默认最大缓存 20 项，不依赖 Vue 私有缓存字段。
- 缓存失活不是卸载；轮询/图表订阅在 `onDeactivated` 暂停，`onActivated` 恢复。
- 标签快照使用 `sessionStorage`；退出主动清理，不能只等组件卸载。
- 新窗口地址沿用 `router.resolve(path).href`，避免破坏 hash/history/base。
- `progress/loading` 反映真实导航，不额外添加固定时长假进度。

完整接线可核对 `packages/create-lumal-admin/src/scaffold.ts` 或 `apps/lumal-admin/src/App.vue`；以消费项目的用户/权限适配为准，不照搬 Demo 业务。
