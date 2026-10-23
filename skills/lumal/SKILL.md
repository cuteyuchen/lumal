---
name: lumal
description: 使用 Lumal（@lumal/*、create-lumal-admin）构建或维护 Vue 后台、图表与 DataV 大屏、驾驶舱、图标和 Vite 集成，或迁移 Vben 代码时使用。指导包选型、公开入口、最小接入和常见误区。不用于未使用 Lumal 的普通 Vue 问题。
---

# Lumal

先按需求选择最少的包，再读取对应参考。不要为使用其中一个能力而安装或导入整套生态。

## 先确定上下文

1. 区分消费项目与 Lumal 仓库维护：消费项目只使用 npm 包的公开入口，不依赖 `packages/*/src` 或工作区 alias。
2. 检查已有依赖、锁文件、入口代码与样式。复用现有 Router、Pinia、Element Plus 和请求适配，不重复创建。
3. 本 Skill 以 `0.0.5-beta` 的公开 API 为基准，不将此版本视为 npm 最新版本。版本不一致时，以实际安装包的 `package.json.exports`、声明文件和源码为准，不猜测导出。
4. 只读取下表与任务有关的参考；跨包任务再组合读取。

## 包选型

| 需求 | 选择 | 按需读取 |
| --- | --- | --- |
| 新建独立后台项目 | `create-lumal-admin` | [脚手架](references/create-lumal-admin.md) |
| 已有 Vue 应用接入、页面、Schema 表单/表格、CRUD | `@lumal/core` | [启动与组件](references/core.md) |
| 菜单、动态路由、权限、布局、标签缓存 | `@lumal/core` 对应子入口 | [路由与布局](references/core-routing.md) |
| 请求、登录会话、字典、主题和偏好 | `@lumal/core` 对应子入口 | [服务能力](references/core-services.md) |
| 后台 ECharts 图表、查询/图表/表格切换面板 | `@lumal/charts` | [图表](references/charts.md) |
| 纯 Vue / Screen / Admin 工作区尺寸与三级适配 | 开发分支 `@lumal/viewport` | [视口](references/viewport.md) |
| 大屏边框、装饰、数字、飞线、滚动榜单、DataV 配置 | `@lumal/datav` | [DataV](references/datav.md) |
| 驾驶舱左右区域编排、模块注册、多布局、可视化设计 | `@lumal/cockpit` | [驾驶舱](references/cockpit.md) |
| 不依赖 Vue 的图标注册、SVG 处理、Data URI、可选状态形变 | `@lumal/icons`、`@lumal/icons/morph` | [图标内核](references/icons.md) |
| Vue 图标组件、选择器、响应式图标注册表 | `@lumal/icons-vue` | [Vue 图标](references/icons-vue.md) |
| Vite resolver、Lumal 仓库源码 alias、可选 Devtools | `@lumal/vite` | [构建辅助](references/vite.md) |
| 迁移 Vben 5 页面或旧 Lumal 适配代码 | `@lumal/vben-compat/v5` 或 `/legacy` | [Vben 迁移](references/vben-compat.md) |
| 修改包源码、公共 API、脚手架模板、发布边界 | 对应包及受影响消费者 | [仓库维护](references/repository.md)，再读相应分包参考 |

## 共同约束

- 严格轻量启动使用 `@lumal/core/minimal`；根入口即使设置 `preset: 'minimal'` 仍引用默认组件表，不是体积隔离边界。
- 纯请求等场景直接使用服务子入口，不为了一个函数导入 core 根入口；图表、DataV、Designer 和兼容层均按需引入。
- UI 包需要显式样式及对应 peer。`minimal` 不代表使用 UI 时可以省略 Element Plus。
- 后端字段和业务状态码留在应用 adapter。分页使用 `{ items, total }`，字典使用 `{ items }`，会话使用 `{ accessToken, refreshToken?, expiresAt? }`；异常字段通过 `fieldNames`、`parseResponse` 或 `transform` 显式转换。
- 脚手架默认 `standard/local/hash`，HTTP 模式必须接真实后端，不能将未配置或认证失败静默改为演示登录。新版命令须先确认对应版本已发布，不能用旧版 CLI 验证新版模板。
- 菜单隐藏、按钮权限只改善前端体验，不能代替服务端鉴权；远程菜单组件只允许映射到应用白名单。
- 图标 SVG 必须来自可信静态资源。图标注册和格式校验不等于安全净化。
- 不把消费方的地图、业务接口、行业皮肤和持久化策略写进通用包；Cockpit 不负责这些业务能力。

## 写代码时

- 沿用消费项目约定；Lumal 仓库内使用 `<script setup lang="ts">`，按 `/***********************说明*********************/` 划分组合式逻辑功能块，模板引用使用 `useTemplateRef`。
- 优先原生 Lumal schema；迁移 Vben 5 使用 `/v5` 的组件元组与单数 `schema`，根及 `/legacy` 仍是旧 `[register, api]`。不承诺 Vben/VXE 的完整兼容。
- 使用图表前先确认引擎：`@lumal/charts` 使用 ECharts + vue-echarts；DataV 的 `config` 与 ECharts 的 `option` 是不同协议，不互转。
- 一个大屏只选择一层缩放责任；DataV 全屏容器包裹 Cockpit 时读取驾驶舱参考中的 `external` 模式。

## 验证与交付

按改动运行对应的类型检查、单元测试和构建。只有任务涉及浏览器行为且确有必要时，再增加实机验证；不要为了文档或类型变更默认启动整套应用。

交付说明所选包、公开导入路径、必要样式/peer、应用侧适配点以及已完成的验证。不要把未验证的性能收益、占位示例或未实现的功能描述为已完成。
