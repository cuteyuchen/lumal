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

上面的客户端只展示请求接线，没有实现刷新接口或完整登录流程。新项目优先使用
[脚手架的应用服务](create-lumal-admin.md)，而不是把示例当作可用认证系统。
自行接入时，刷新请求用不参与认证刷新的客户端；捕获旧凭据与会话 AbortSignal，
响应后确认未取消且身份未切换，再调用 `session.setSession`。取消应传播为取消错误，
不能再触发新用户的退出。Core 不会替应用取消所有旧请求或清理业务 Store。

## 可选请求缓存

缓存默认关闭。需要时逐请求配置 `cache: { enabled: true }`；
客户端的 `cache` 选项接收 `RequestCache` 存储实现，不是启用开关。

- 默认只缓存 GET；非 GET 必须提供能区分请求体的 `cache.key`。
- 多租户可传 `getCacheScope`，同一用户的用途可传请求级 `cache.scope`。
- 退出/切换上下文调用 `request.clearCache()`；不要把 Token 拼入自定义 cache key，也不要让不同用户共用无身份区分的数据。
- 旧在途请求在清理后不能重新回填缓存；不要用额外的全局 Map 绕开此生命周期。
- `clearCache()` 同时解绑共享刷新任务，让新会话不等待旧刷新，但不会自动取消旧网络请求；应用仍须传入会话 signal 并保护刷新结果写入。
- `0.1.0-beta` 会话隔离：清理/作用域切换后的旧401与旧刷新失败返回 `cancelled/STALE_SESSION`，
  不触发新身份退出。失效通知按会话版本、scope和实际凭据隔离，连续两次失效会话各自能通知。
  仅替换Token也隔离刷新锁、迟到写请求及刷新失败；安全GET可使用更新凭据重放一次，
  退出后不匿名重放。显式或Hook外部Authorization不跟随客户端Token刷新，
  由对应客户端的应用失效策略处理。
  成功旧响应仍可能返回给调用者，因此应用侧的 AbortSignal 与结果写入检查不能删除。
- `ArrayBuffer` 与 TypedArray 作为二进制发送，不 JSON 编码；Multipart 使用 upload 或 FormData，
  不手动设置 multipart boundary。GET/DELETE 的参数放 query，POST/PUT/PATCH 的业务数据放 body。

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

消费端 `@lumal/vite` 开启后，Core 主题 token 自动按同一个设计宽度输出普通 vw；
初始化、偏好修改和恢复均如此，未开启时输出 px。无需主题长度回调或业务根单位。
构建转换不受运行时路由开关撤回；局部使用应配置文件/选择器范围。

仓库核对位置：`packages/core/src/{request,auth,dictionary,theme}` 下的公开入口、类型和测试。接口适配示例参考 Admin 的 `src/services`，不要将演示 API 当作通用包契约。
