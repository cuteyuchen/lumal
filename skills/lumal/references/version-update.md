# 部署版本更新提示

## 什么时候用

静态站点重新部署后，仍停留在旧页面的用户需要知道有新构建。该能力只轮询部署清单，
不引入后端推送、WebSocket 或 Service Worker；适合 Vercel、对象存储和 Nginx 等静态托管。

构建期由 `@lumal/vite` 生成 `version.json`，运行期由 `@lumal/core/composables` 检查。

## 构建期：生成清单

```ts
import { createVersionManifestPlugin } from '@lumal/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [createVersionManifestPlugin()],
})
```

构建时生成并注入同一份快照：

```json
{
  "buildId": "eb822ad-2026-11-04T08:51:20.900Z",
  "version": "0.1.2-beta",
  "commit": "eb822ad",
  "builtAt": "2026-11-04T08:51:20.900Z"
}
```

- `buildId` 是部署身份，默认由 `commit-builtAt` 组成；同一版本号多次构建也能区分。
- 默认注入 `__LUMAL_VERSION_INFO__`，文件名 `version.json`，读取 `process.cwd()` 的
  `package.json` 与 Git；只在 `build` 阶段生效。
- `inject: false` 只生成文件不注入；`enabled: false` 全部关闭；`info` 可传完整或部分身份。
- 文件名相对 `build.outDir`，`/` 与 `/px/` 各自构建会生成自己的清单，互不覆盖。
- SSR 构建默认不生成部署清单，需要时显式开启。

## 运行期：检查与提示

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
})

checker.start()
checker.stop()
```

Vue 内使用 `useVersionCheck`，作用域销毁时自动清理；返回 `update`、`dismiss`、`reload`。

- 首查直接与页面内置 `buildId` 比较，不先取远端基线，已过期页面不会漏报。
- 同一个 `buildId` 只提示一次；`dismiss()` 后同一标签页不再提示，检测到另一个身份会再次提示。
- `document.hidden` 暂停；恢复可见或 `online` 时立即检查。
- `check()` 并发复用同一请求；`timeout` 默认 10 秒，使用 `AbortController`。
- 404、500、HTML SPA fallback、非法 JSON、缺 `buildId` 都只回调错误，不产生假更新。
- `stop()` 清理计时器、监听和在途请求；之后可以再次 `start()`。

## Admin 模板

`standard` / `vben-compatible` 默认接入，`minimal` 不生成检测代码。
默认生产启用、5 分钟、首查延迟 1.5 秒；开发服务器不生成清单也不轮询。

```bash
VITE_VERSION_CHECK=false
VITE_VERSION_CHECK_INTERVAL=600000
VITE_VERSION_CHECK_URL=/ops/version.json
```

业务未保存内容通过 `registerVersionReloadGuard` 注册守卫；返回 `false` 或抛错时保留页面。

## 部署要求

- `version.json` 使用 `Cache-Control: no-store, max-age=0`。
- `/`、`/index.html`、`/px/` 入口使用 `no-cache, max-age=0, must-revalidate`。
- 内容哈希 JS/CSS 保持长缓存。
- 不要把未知路径统一重写到 `index.html`：缺失清单会返回 200 HTML，运行时会拒绝解析，
  但会掩盖真实 404。Hash 路由不需要 SPA rewrite。
- 非原子部署或回滚会改变 `buildId`，可能提示刷新；刷新后旧 chunk 缺失由业务错误页处理。

## 验证

```bash
pnpm --filter lumal-admin build
cat apps/lumal-admin/dist/version.json
cat apps/lumal-admin/dist/px/version.json
```

两次构建的 `buildId` 必须不同；`scripts/check-version-manifests.mjs` 会校验两份产物中的
JSON 与 JS 注入值一致。`vite preview` 可以验证检测流程；E2E 可用路由拦截返回另一个
`buildId` 模拟新部署，并断言只刷新一次。
