# @lumal/core：请求、会话、字典与主题

## 什么时候用

需要独立服务或为 Lumal UI 接入数据时读取。直接导入子入口；请求/会话消费者不需要 Element Plus。

## 请求与会话

```ts
import { createAuthSession } from '@lumal/core/auth'
import { createRequestClient, createStandardResponseParser } from '@lumal/core/request'

const session = createAuthSession({ storage: localStorage })
const request = createRequestClient({
  baseURL: '/api',
  getToken: () => session.getToken() || undefined,
  // 仅在后端使用 { code, data, message } 包装时启用。
  onResponse: createStandardResponseParser(),
  onSessionExpired: () => session.handleSessionExpired(),
})

const page = await request.get<{ items: { id: number }[], total: number }>('/projects')
```

这里 `page` 是解包后的数据，不是 Axios 的 Response。Token 持久化策略由应用选择，示例使用 localStorage 不代表适合所有安全需求。

- 标准会话为 `{ accessToken, refreshToken?, expiresAt? }`；`parseAuthSession` 通过 `fieldNames` 映射后端字段。`session.clearToken()` 清除访问和刷新凭据，`logout()` 还会调用应用传入的会话过期回调。
- 默认请求返回响应数据，不默认猜业务包装。`createStandardResponseParser` 默认成功码为 `0/200`；公司状态码显式配置 `successCodes/sessionExpiredCodes/fieldNames`。
- `RequestError.kind` 区分 `network/http/business/session/duplicate/cancelled`。应用决定通知方式，不在每个组件重复判断公司业务码。
- `authRefresh.refresh` 更新 session 后再完成 Promise。并发认证失败共享一次刷新；GET 最多重放一次，POST/PUT/PATCH/DELETE 只有逐请求 `retryOnAuthRefresh: true` 才允许重放，先确认幂等性。
- 刷新最终失败走 `onSessionExpired`；路由、权限、标签和业务 Store 的退出清理由应用统一完成。
- 非标准分页使用 `parsePageResult(raw, { fieldNames: { items: 'records', total: 'count' } })`，不要在组件里猜字段。

## 可选请求缓存

缓存默认关闭。需要时逐请求或客户端配置 `cache: { enabled: true }`。

- 默认只缓存 GET；非 GET 必须提供能区分请求体的 `cache.key`。
- 多租户可传 `getCacheScope`，同一用户的用途可传请求级 `cache.scope`。
- 退出/切换上下文调用 `request.clearCache()`；不要把 Token 拼入自定义 cache key，也不要让不同用户共用无身份区分的数据。
- 旧在途请求在清理后不能重新回填缓存；不要用额外的全局 Map 绕开此生命周期。

## 字典

从 `@lumal/core/dictionary` 导入 `installDictionary`、`useDictionary`、`createDictionaryStore`、`normalizeDictionaryOptions` 等。通过启动器传 `dictionary` 或手动安装上下文，二选一接线。

```ts
import { createDictionaryStore } from '@lumal/core/dictionary'

const dictionary = createDictionaryStore({
  fetcher: async () => ({
    items: [
      { label: '启用', value: 'enabled', color: '#15803d' },
      { label: '停用', value: 'disabled', color: '#64748b' },
    ],
  }),
})

await dictionary.loadDictionary('status')
```

示例是静态数据源；接接口后仍返回 `{ items }`，或显式配置 `fieldNames/parseResponse`。

- Schema/CRUD 使用 `dictionary: 'status'` 自动加载和回显；有字典键时字典结果优先，手工 options 仅在没有字典键时使用。
- 字典标准字段为 `label/value/color/disabled/children`；不要让数值与字符串类型漂移。
- `setDictionary/removeDictionary/clearDictionary` 使旧在途加载失效。切换账号或租户时清理 Store，避免跨身份回显。
- `@lumal/core/minimal` 默认不安装字典，需要时显式配置。

## 主题与偏好

```ts
import { createPreferencesStore } from '@lumal/core/theme'

const preferences = createPreferencesStore({
  storage: localStorage,
  storageKey: 'my-admin:preferences',
  defaults: { app: { layout: 'mixed-nav' } },
})

preferences.patch({
  theme: { mode: 'system', fontSize: 14 },
  header: { globalSearch: true },
})
```

- 需要完整应用偏好使用 `createPreferencesStore`；只需要主题可用 `createThemeStore`。
- 优先语义 CSS 变量，不把主题色散落到每个组件。字号范围为 12～20px。
- `reset()` 恢复偏好，`exportCurrent()` 输出配置；实例释放时 `dispose()` 清理监听。
- 不假设偏好 Store 提供多语言系统或业务配置存储。

仓库核对位置：`packages/core/src/{request,auth,dictionary,theme}` 下的公开入口、类型和测试。接口适配示例参考 Admin 的 `src/services`，不要将演示 API 当作通用包契约。
