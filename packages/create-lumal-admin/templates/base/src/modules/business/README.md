# 业务模块

在此目录新增 `orders/module.ts`，导出 `menus`、`views` 和可选 `permissions`。
应用仅自动加载模块元数据，页面使用 `() => import('./OrderView.vue')`。
业务类型与 API 放在同一模块内，不要向系统管理或 Core 添加业务依赖。

```ts
import type { AppModule } from '../../../app/module';

export const menus: AppModule['menus'] = [
  {
    path: '/orders',
    name: 'Orders',
    component: 'business/orders',
    meta: { title: '订单', authority: ['orders:list'] },
  },
];
export const views: AppModule['views'] = {
  'business/orders': () => import('./OrderView.vue'),
};
export const permissions: AppModule['permissions'] = [
  { id: 'orders:list', label: '订单列表', permission: 'orders:list' },
];
```

后端 `/menus` 必须返回此组件白名单键；HTTP 不会把本地路由悄悄融合到远端菜单中。
本地开发的权限来自显式注册表，生产权限始终由后端检查。

业务 API、输入/响应类型与页面放在 `orders/` 内，通过 `BusinessTransport` 发送请求。
Local 模式可在同目录提供 `local.ts`，导出满足 `LocalModule` 的 `createLocalHandler`：
`handles(path)` 仅匹配本模块端点，`request(method, path, input)` 实现开发行为。
处理器通过上下文的 `db/user/assertPermission` 读写演示数据、确认身份和检查权限。
路由元数据和 Local 处理器均自动发现，无需改写中心注册文件；HTTP 仍需真实后端实现同一端点。
