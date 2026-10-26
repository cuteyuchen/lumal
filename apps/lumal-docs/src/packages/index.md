# 包使用概览

Lumal 按职责拆包。应用只消费 **公开 `exports` 入口** 与样式路径，不要依赖 `packages/*/src` 或测试内部文件。

本组文档对应 `0.0.7-beta` 的十包候选契约，不代表 registry 已发布。
历史十包核验见 [0.0.6-beta 发布记录](/reference/npm-release-0.0.6-beta)。
下列命令显式选择候选版本；核验前的 tarball 接入方式见 [安装说明](/guide/essentials/installation)。

## 选型建议

| 场景 | 推荐包 |
| --- | --- |
| 后台壳、布局、权限、表单表格 | `@lumal/core` + icons 系列 |
| 后台图表工作流 | `@lumal/charts` |
| 纯 Vue / Screen / Admin 工作区适配 | `@lumal/viewport` |
| 大屏边框 / 装饰 / 飞线等 | `@lumal/datav` |
| 可编排驾驶舱布局与 Designer | `@lumal/cockpit`（+ 可选 datav） |
| Vite 自动导入 / monorepo alias | `@lumal/vite` |
| 从 Vben 迁移 | `@lumal/vben-compat` |
| 快速起项目 | `create-lumal-admin` |

## 包卡片

| 包 | 说明 | 文档 | 本地路径 |
| --- | --- | --- | --- |
| [@lumal/core](./core) | 安装器、布局、路由权限、请求、主题、Schema 组件 | [在线文档](https://lumal.cuteyuchen.top/packages/core) | `packages/core` |
| [@lumal/icons](./icons) | 框架无关图标内核 | [在线文档](https://lumal.cuteyuchen.top/packages/icons) | `packages/icons` |
| [@lumal/icons-vue](./icons-vue) | Vue 图标组件 | [在线文档](https://lumal.cuteyuchen.top/packages/icons-vue) | `packages/icons-vue` |
| [@lumal/charts](./charts) | ECharts 图表与面板 | [在线文档](https://lumal.cuteyuchen.top/packages/charts) | `packages/charts` |
| [@lumal/viewport](./viewport) | 纯 Vue 的应用默认、页面和容器适配 | [在线文档](https://lumal.cuteyuchen.top/packages/viewport) | `packages/viewport` |
| [@lumal/datav](./datav) | DataV 风格可视化组件 | [在线文档](https://lumal.cuteyuchen.top/packages/datav) | `packages/datav` |
| [@lumal/cockpit](./cockpit) | 驾驶舱编排框架 | [在线文档](https://lumal.cuteyuchen.top/packages/cockpit) | `packages/cockpit` |
| [@lumal/vite](./vite) | Resolver 与 workspace alias | [在线文档](https://lumal.cuteyuchen.top/packages/vite) | `packages/vite` |
| [@lumal/vben-compat](./vben-compat) | Vben 常用 API 兼容 | [在线文档](https://lumal.cuteyuchen.top/packages/vben-compat) | `packages/vben-compat` |
| [create-lumal-admin](./create-lumal-admin) | 脚手架 CLI | [在线文档](https://lumal.cuteyuchen.top/packages/create-lumal-admin) | `packages/create-lumal-admin` |

> npm 包地址与安装方式见 [安装与版本](/guide/essentials/installation)。

## 安装顺序（典型 Admin）

```bash
pnpm add vue@^3.5 vue-router@^4.5 element-plus@^2.11 @iconify/vue@^5
pnpm add @lumal/core@0.0.7-beta @lumal/icons@0.0.7-beta @lumal/icons-vue@0.0.7-beta
# 按需
pnpm add @lumal/charts@0.0.7-beta echarts@^6 vue-echarts@^8
pnpm add @lumal/viewport@0.0.7-beta
pnpm add -D @lumal/vite@0.0.7-beta
```

Pinia 按应用需要安装。纯服务接入优先使用 `@lumal/core/minimal` / `request`，无需 Element Plus；UI 入口需安装对应 peer 与样式。

开发工作区内的新功能时使用 `workspace:*` 或 `file:`，不要把未发布 API 当作 npm 同版能力，见 [安装与版本](/guide/essentials/installation)。
