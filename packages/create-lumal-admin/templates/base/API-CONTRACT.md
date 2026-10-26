# 应用 API 契约

基础契约在 `src/app/services/contracts.ts`，业务入参和解析在各模块 `api.ts/types.ts`。
Local 与 HTTP 使用同一组页面及端点；Core 不包含业务协议。
系统接口仅在选择 system 时调用，个人中心仅 standard / vben-compatible 启用。

| 方法            | 路径                                                                   | 标准 JSON 响应                                                       |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| POST            | `/auth/login`，body `{ username, password }`                           | `{ accessToken, refreshToken?, expiresAt? }`                         |
| POST            | `/auth/refresh`，body `{ refreshToken }`                               | 同上                                                                 |
| GET             | `/session/me`                                                          | `{ id, username, name }`，均为字符串                                 |
| GET             | `/session/access`                                                      | `{ roles: string[], permissions: string[] }`                         |
| GET             | `/menus`                                                               | `LumalMenuRecord[]`                                                  |
| POST            | `/auth/logout`                                                         | 204 或 JSON                                                          |
| GET             | `/system/users`、`/system/roles`                                       | `{ items: User[] \| Role[], total }`                                 |
| POST/PUT/DELETE | `/system/users[/:id]`、`/system/roles[/:id]`                           | 对应模块输入 / 记录；删除 204 或 JSON                                |
| PATCH           | `/system/users/:id/status`                                             | `{ status }` / `User`                                                |
| PUT             | `/system/users/:id/roles`                                              | `{ roles: string[] }` / `User`                                       |
| PATCH           | `/system/users/batch/status`                                           | `{ ids, status }` / `{ items, updated }`                             |
| PUT             | `/system/users/batch/roles`                                            | `{ ids, roles, mode: 'append' \| 'replace' }` / `{ items, updated }` |
| POST            | `/system/users/:id/reset-password`                                     | `{ temporaryPassword }`                                              |
| GET             | `/system/roles/options`、`/system/organizations/options`               | `{ label, value, disabled?, children? }[]`                           |
| GET             | `/system/permissions/tree`                                             | `{ id, label, permission?, children? }[]`                            |
| GET/PUT         | `/system/roles/:code/permissions`                                      | PUT `{ permissions: string[] }`；响应 `string[]`                     |
| GET             | `/system/menus`、`/system/organizations`                               | 对应树形记录数组，`children`；机构可带 `userCount`                   |
| POST/PUT/DELETE | `/system/menus[/:id]`、`/system/organizations[/:id]`                   | 对应模块输入 / 记录                                                  |
| GET             | `/system/dictionaries/types`、`/system/dictionaries/items?typeCode=`   | 对应记录数组                                                         |
| POST/PUT/DELETE | `/system/dictionaries/types[/:id]`、`/system/dictionaries/items[/:id]` | 对应模块输入 / 记录                                                  |
| GET             | `/system/dictionaries/options/:code`                                   | `{ label, value, color? }[]`                                         |
| GET/PUT         | `/system/config`                                                       | `{ appName, colorPrimary, layout, tabbarEnable, transitionEnable }`  |
| POST            | `/system/config/restore`                                               | 恢复默认，响应同上                                                   |
| GET/PUT         | `/profile`                                                             | GET `User`；PUT `{ nickname, phone }` / `User`                       |
| PUT             | `/profile/password`                                                    | `{ currentPassword, newPassword }` / 204 或 JSON                     |

用户查询支持 `page/pageSize/keyword/organizationId/roles/status`，角色支持
`page/pageSize/keyword/status`。分页默认第一页，页号和每页条数必须为正整数。
`UserInput` 为 `username/nickname/organizationId/roles/phone/status`；响应另有 `id/createdAt`。
`RoleInput` 为 `code/name/description/status`；响应另有 `id/builtIn`，不接收 permissions。

## 业务约束与权限

- 用户操作对应 `system:user:list/create/update/delete/status/assign-roles/reset-password`。
- 角色对应 `system:role:list/create/update/delete/authorize`；资料和授权分别保存，不宣称两个请求是事务。
- 授权树来自真实接口，非叶访问权限独立回显；授权已写入但会话重读失败时明确提示部分成功，只重试重读。
- 菜单、机构、字典的权限前缀分别为 `system:menu`、`system:organization`、`system:dict`，操作是 `list/create/update/delete`。
- 配置读取需 `system:config:view`，写入需 `system:config:update`；无写权限显示只读表单，不是 key/value 记录列表。
- 服务端须保护内置管理员和角色、角色引用、机构关联用户和父子关系；批量写入应先校验全部目标。
- 字典同分类值唯一，删除分类级联处理字典项；修改后清理共享 `dictionaryStore`，业务表单应使用同一 Store。
- 个人中心由后端确认当前身份；密码必须经后端验证并持久化。接口不存在时展示真实错误，不伪造成功。

完整字段以各模块 types.ts 为准。没有指标接口时工作台不请求或编造业务指标。

HTTP 模式必须配置 `VITE_API_BASE_URL`，未配置立即报错，绝不回退本地登录。
默认直接消费标准 JSON。包装、字段及权限映射集中在应用 `http-adapter.ts`。
需要 Cookie/CSRF、租户或 SSO 时在应用 transport 接入，不将密钥写到 `VITE_*`。
默认凭据存于 localStorage，请按安全要求选择内存/HttpOnly Cookie 策略。

## 菜单信任边界

菜单组件使用 `src/app/router/views.ts` 汇集的本地白名单，键必须是自有函数加载器；
拒绝 constructor、**proto**、prototype 和任意 import URL，递归子菜单同样校验。
HTTP 菜单替换本地菜单，不静默融合。子路由使用属于父路径的绝对地址；
目录默认跳到当前身份可访问的首个子页，无子页时隐藏。路由守卫逐层检查父子权限，
远程 ignoreAccess/requireLogin 不能关闭认证或权限。

外链只接受无用户名密码的 HTTP(S) 绝对地址，禁止 javascript/data/vbscript、
协议相对地址、反斜线和控制字符。iframe 只能使用 `app/iframe`，且完整来源必须
注册在 `VITE_IFRAME_ORIGINS`（逗号分隔），使用独立 sandbox。

## 接入仓库 Lumal Mock API

启动独立的 `lumal-mock-api` 后，设置 `VITE_API_BASE_URL=http://127.0.0.1:5320/api`
和 `VITE_API_ADAPTER=lumal-mock`。这是显式选择的演示后端，不是生产默认值。
该 adapter 映射 `statusCode/result/resultMsg`、snake_case Token、`records/totalNum`；
只选择本预设存在的菜单，其余示例页面不生成。
Mock 的配置字段与上表一致；历史写权限 `system:config:view` 显式映射到应用 update 权限。
第三方后端应按真实协议调整 Adapter，不假定均兼容此演示协议。

401 GET 自动单飞刷新并最多重放一次；写请求不自动重放，避免重复提交。
初始化等待用户、权限和菜单全部就绪后注册路由。退出、Token 刷新失败和重新登录清理
凭据、权限、菜单、动态路由、请求缓存和标签；旧会话请求会被取消。
主动重读权限失败时清空旧授权及路由，保留凭据供显式重试。
真实接口的 403、校验或网络错误保持可见，不转换成成功响应。
Local 存储可被浏览器用户修改，仅供开发，不能替代服务端鉴权。
