# @lumal/core

Lumal 后台核心包，提供应用安装器、布局、路由菜单辅助、权限、请求、主题和基础组件。

本文 API 基线为 `0.1.0-beta.0`，实际版本可用性以 registry 为准。

```ts
import { createLumalAdmin } from '@lumal/core'
import { LumalCrudTable, LumalSchemaForm } from '@lumal/core/components'
import '@lumal/core/theme-chalk/index.scss'
import '@lumal/core/style.css'
```

`createLumalAdmin` 支持 preset、异步 mount、应用侧 `router` / `pinia`、权限 Store 自动注入、Element Plus options 和选择性全局组件注册；这些依赖保持为 peer dependency，不会由 core 默认创建。

纯服务或需要严格按需加载时，使用无默认 UI 注册表的轻入口：

```ts
import { createLumalAdmin } from '@lumal/core/minimal'
await createLumalAdmin({ rootComponent: App }).mount('#app')
```

轻入口默认不安装字典，只接受显式 `components: { MyComponent }` 映射，不静态加载 Element Plus 或 Sortable。根入口的 `preset: 'minimal'` 只关闭默认注册，不是体积隔离边界。`@lumal/core/request` 等纯服务子入口也无需安装 Element Plus；UI 子入口仍需安装对应 peer 和样式。

路由子入口提供 `createMenuRouteRuntime`，统一静态与远程菜单的校验、排序、组件解析和原子注册。布局子入口提供面包屑、全局搜索、菜单徽标与 `activeMenu` 高亮；主题偏好支持持久化动态标题、导航开关和 12-20px 全局字号。

详细说明见仓库文档 `docs/core-api.md`。

## 纯 vw 接入

在消费项目的 `@lumal/vite` 中启用转换并配置一次 `viewportWidth`。
Core 依赖轻量 `@lumal/viewport` 工具，自有静态 CSS 和动态主题 token 使用同一设计宽度。
未启用时保持 px；启用时，主题初始化、修改和恢复均输出普通 vw，不需要主题长度回调或尺寸变量协议。

Layout/Tabs 默认在启用 vw 时保留桌面编排，未启用时保留原响应式断点。
表格数字列宽、表单数字标签宽度、编辑器数字尺寸和图标数字 size 是设计 px，由组件内部换算。
显式 CSS 字符串保持原义；DOM 测量和 Popper 坐标不参与换算。

接线、选择范围与第三方样式授权见 `docs/screen-viewport-guide.md`。
不扫描业务脚本、不缩放整页。候选版本尚未发布，需用当前 tarball 验证。

## 已有修复

以下变更属于本版，不能通过重新安装历史同版本包取得；发布核验前使用候选 tarball：

- 序号列 `{ type: 'index', label: '序号' }` 不要求业务 field，支持跨页/选中行导出，不派生 CRUD 表单。
- 清理缓存、切换 scope 或替换客户端凭据后，旧写请求401/刷新失败不触发新会话退出；刷新与过期通知按会话隔离。
- TypedArray 保留二进制请求体。业务成功码、字段和上下文继续由应用 Adapter 处理。

`clearCache` 不替应用取消在途请求或保护自定义刷新写入。应用仍须使用会话 AbortSignal/代次。
升级含旧补丁的消费者前，先在隔离副本验证候选tarball；详见 `docs/upgrade-guide.md`。
