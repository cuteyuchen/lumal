# 应用 API 契约

Local 与 HTTP 实现 `src/services/contracts.ts` 的同一服务接口。Core 不包含业务协议。

| 方法 | 路径 | 标准 JSON 响应 |
| --- | --- | --- |
| POST | `/auth/login`，body `{ username, password }` | `{ accessToken, refreshToken?, expiresAt? }` |
| POST | `/auth/refresh`，body `{ refreshToken }` | 同上 |
| GET | `/session/me` | `{ id, username, name }`，均为字符串 |
| GET | `/session/access` | `{ roles: string[], permissions: string[] }` |
| GET | `/menus` | `LumalMenuRecord[]` |
| POST | `/auth/logout` | 204 或 JSON |
| GET | `/system/:resource?page=1&pageSize=10&keyword=` | `{ items: object[], total: number }` |
| POST/PUT/DELETE | `/system/:resource[/:id]` | JSON 或 204 |

菜单组件使用 `src/router/views.ts` 的本地白名单，禁止任意远程 import。标准模块资源为
`users`、`roles`、`menus`、`organizations`、`dictionaries/types`、`dictionaries/items`、`config`。
标准 CRUD 接口按记录管理；配置记录使用 `id/key/value/description`。
后端仍需检查每项权限，不能依赖前端隐藏按钮。

HTTP 模式必须配置 `VITE_API_BASE_URL`，未配置立即报错，绝不回退本地登录。
默认直接消费标准 JSON。包装、字段及权限映射集中在应用 `http-adapter.ts`。
需要 Cookie/CSRF、租户或 SSO 时在应用 transport 接入，不将密钥写到 `VITE_*`。
默认凭据存于 localStorage，请按安全要求选择内存/HttpOnly Cookie 策略。

## 接入仓库 Lumal Mock API

启动独立的 `lumal-mock-api` 后，设置 `VITE_API_BASE_URL=http://127.0.0.1:5320/api`
和 `VITE_API_ADAPTER=lumal-mock`。这是显式选择的演示后端，不是生产默认值。
该 adapter 映射 `statusCode/result/resultMsg`、snake_case Token、`records/totalNum`；
只选择本预设存在的菜单，其余示例页面不生成。
Mock 的系统配置通过显式 adapter 转换为记录型配置；更新时保留原值类型。

401 GET 自动单飞刷新并最多重放一次；写请求不自动重放，避免重复提交。
初始化等待用户、权限和菜单全部就绪后注册路由。退出、刷新失败和重新登录清理
权限、菜单、动态路由、请求缓存、标签和页面缓存；旧会话请求会被取消。
真实接口的 403、校验或网络错误保持可见，不转换成成功响应。
