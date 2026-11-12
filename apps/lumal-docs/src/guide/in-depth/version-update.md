# 版本更新提示

站点部署新构建后，仍停留在旧页面的用户会看到「发现新版本」提示，可以选择「稍后」或「立即刷新」。刷新是完整的 `location.reload()`，不会热替换已经上线的业务模块；对话框会明确提示未保存内容可能丢失，不会自动强制刷新。

## 默认行为

- Admin `standard` / `vben-compatible` 默认接入，生产构建启用；开发环境不轮询。
- 默认检查间隔 5 分钟，首次检查延迟 1.5 秒，避免应用启动期竞态。
- 首次检查直接与页面内置 `buildId` 比较，不会像“远端取基线”那样漏报已经过期的页面。
- 只比较 `buildId`；`version` 仅用于展示，同一框架版本可以对应多次构建。
- 同一个 `buildId` 只提示一次；点击「稍后」后同一标签页不再重复提示；检测到另一个构建身份会再次提示。
- `document.hidden` 时暂停计时；恢复可见或网络重新上线时立即检查。
- 无网、超时、非 200、非法 JSON、缺少 `buildId` 或 HTML SPA fallback 都只记录错误，不会产生假更新或阻止应用启动。

## 构建期：生成 version.json

`@lumal/vite` 提供独立的构建插件：

```ts
// vite.config.ts
import { createVersionManifestPlugin } from '@lumal/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    createVersionManifestPlugin(),
  ],
})
```

默认读取项目 `package.json` 的 `version` 与 Git 提交信息，构建时生成：

```json
{
  "buildId": "eb822ad-2026-11-04T08:51:20.900Z",
  "version": "0.1.2-beta",
  "commit": "eb822ad",
  "builtAt": "2026-11-04T08:51:20.900Z"
}
```

同时通过 `define` 向浏览器注入同名快照 `__LUMAL_VERSION_INFO__`。一次构建只创建一份快照，`version.json` 与 JS 注入的 `buildId` 必然相同。

插件选项：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 设为 `false` 时既不注入也不生成文件 |
| `info` | 自动读取 | 完整或部分构建身份；Admin 用已有的 `createAdminBuildInfo` 传入 |
| `fileName` | `version.json` | 静态文件名 |
| `defineName` | `__LUMAL_VERSION_INFO__` | 注入到浏览器代码的全局变量 |
| `inject` | `true` | 设为 `false` 时只生成文件 |
| `root` | `process.cwd()` | 读取 `package.json` 与 Git 的目录 |

插件只在 `build` 阶段生效。`emitFile` 的文件名相对本次 `build.outDir`，所以根路径 `/` 与 `/px/` 独立构建会各自生成自己的 `version.json`，不会互相覆盖。

## 运行期：检查与提示

`@lumal/core/composables` 提供无 UI 依赖的检查器：

```ts
import {
  createVersionChecker,
  resolveVersionManifestUrl,
} from '@lumal/core/composables'

const checker = createVersionChecker({
  current: __LUMAL_VERSION_INFO__,
  url: resolveVersionManifestUrl(import.meta.env.BASE_URL),
  interval: 5 * 60 * 1000,
  initialDelay: 1500,
  beforeReload: async () => confirm('有未保存的内容，仍要刷新吗？'),
  onUpdate: info => showUpdateDialog(info),
  onError: error => console.warn('[version]', error.reason, error.message),
})

checker.start()
// 卸载或不再需要时：
checker.stop()
```

Vue 组件内可以直接使用组合式函数，它会在 `onMounted` 启动、在作用域销毁时清理：

```ts
import { useVersionCheck } from '@lumal/core/composables'

const { update, dismiss, reload } = useVersionCheck({
  current: __LUMAL_VERSION_INFO__,
  url: resolveVersionManifestUrl(import.meta.env.BASE_URL),
})
```

主要选项：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 开发或测试环境可关闭 |
| `interval` | 5 分钟 | `<= 0` 时只做首查与可见性/联网触发 |
| `initialDelay` | `0` | 首次检查延迟；Admin 为 1.5 秒 |
| `timeout` | 10 秒 | 单次请求超时，使用 `AbortController` |
| `beforeReload` | 无 | 返回 `false` 时保留页面与提示 |
| `environment` | 浏览器全局 | 可注入 `document` / `window` / `fetch` / 定时器 / `location.reload` 用于测试 |

`check()` 并发调用会复用同一个请求；`stop()` 会清理计时器、事件监听和未完成请求，之后可以再次 `start()`。

## 刷新守卫

业务页面可以注册未保存内容守卫。守卫返回 `false` 或抛错时都会阻止刷新：

```ts
import { onBeforeUnmount } from 'vue'
import { registerVersionReloadGuard } from '@/app/services/version-check'

const unregister = registerVersionReloadGuard(() => !editor.hasUnsavedChanges())
onBeforeUnmount(unregister)
```

## 部署与缓存

`scripts/prepare-vercel-output.mjs` 在 Build Output API v3 中为以下路径设置缓存头：

- `/version.json`、`/px/version.json`：`Cache-Control: no-store, max-age=0`
- `/`、`/index.html`、`/px`、`/px/index.html`：`Cache-Control: no-cache, max-age=0, must-revalidate`

内容哈希的 JS/CSS 保持平台默认的长缓存，不需要改动。Hash 路由的站点不需要 SPA rewrite；不要把 `/(.*)` 重写到 `index.html`，否则缺失的 `version.json` 会得到 200 HTML，虽然运行时会拒绝解析，但会增加误判成本。

## Admin 配置

Admin 的默认值集中在 `apps/lumal-admin/src/services/version-check.ts`：

```bash
# 生产环境显式关闭
VITE_VERSION_CHECK=false

# 覆盖检查间隔（毫秒）
VITE_VERSION_CHECK_INTERVAL=600000

# 覆盖检测地址（默认按 BASE_URL 拼接）
VITE_VERSION_CHECK_URL=/ops/version.json
```

常规使用不需要写这些变量。Admin 使用现有的 Element Plus `ElDialog`，根组件只挂载一份，不依赖路由页面，也不会在每次导航时重建定时器。

## 边界

- **非原子部署**：新旧文件短暂并存时，可能先拿到新 `version.json`，但旧页面仍能继续工作；刷新后如果旧 chunk 已被删除，由业务错误页或浏览器缓存策略处理，本功能不会扫描或改写运行中的模块。
- **回滚**：回滚会改变部署身份，同样可能触发提示；刷新后回到回滚版本，这是预期行为。检查器不会把回滚当成持续更新反复弹窗。
- **开发与预览**：`vite dev` 不生成清单；`vite preview` 使用构建产物，可以验证检测流程。
- **未保存内容**：首版通过明确文案和可选的 `beforeReload` 守卫保护；没有引入路由级拦截或自动保存。
- **首次加载**：首次检查在应用挂载后延迟执行，避免与登录、菜单和首屏请求竞争；它仍然直接比较内置 `buildId`，不会漏掉已经过期的页面。
