# Screen HTTP 契约

仅为生成项目的应用 Adapter 约定，不是对任意真实后端的兼容承诺。
先配置 `VITE_API_BASE_URL`。无配置明确报错，不使用演示数据兜底。

- 选择 HTTP 业务数据时：`GET /screen/metrics` 返回 `[{ label: string, value: number }]`。
- 选择 HTTP 认证时：`POST /auth/login` 接收 `{ username, password }`，
  返回 `{ accessToken, refreshToken?, expiresAt? }`。`expiresAt` 是毫秒时间戳。
- 配置了 refreshToken 时，认证失效通过 `POST /auth/refresh` 接收 `{ refreshToken }`，
  返回相同会话结构。刷新失败退出，不降级。未提供 refreshToken 时过期直接退出。
- `Authorization: Bearer <token>` 由 Core 注入。后端仍必须执行权限检查。
- 默认请求超时 15 秒；取消不会伪装为成功。退出、切换身份会取消旧会话请求。
- 无认证的 HTTP 数据请求 401 只展示错误，不假定需要登录。

`http.ts`、`auth-adapter.ts`、`metrics.ts` 是应用可以修改的 Adapter。
后端有 `code/data/msg` 包装时，在客户端的 `onResponse` 显式接入
`createStandardResponseParser`；字段映射和业务上下文不得写进 Core。
Token 使用当前标签页的 sessionStorage；按部署安全要求调整，不把演示凭据用于真实后端。
登录页只在原路径切换内容，路由不会来回跳转或丢失当前 Screen 路径。
服务端 Token 撤销、单点登录和业务 Store 清理由应用按接口契约补充。
