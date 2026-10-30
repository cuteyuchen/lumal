# 升级与迁移指南

本文对应已发布的 `0.1.1-beta`，正式门禁、registry 与独立消费者见
[本版发布记录](./npm-release-0.1.1-beta.md)。安装时显式选择本版；开发未发布源码时使用精确提交 tarball。
上一版 `0.0.7-beta` 的正式标签、registry 与消费者证据保留在 [发布记录](./npm-release-0.0.7-beta.md)。
公共包发布不代表业务升级通过，也不授权部署或修改真实业务仓库。
实际兼容证据与未执行事项见[真实消费者矩阵](./real-consumer-compatibility.md)；
历史 `0.0.6-beta`、`0.0.5-beta` 发布与旧验收记录继续保留，不覆盖为本轮结果。

## 升级原则

- 现有完整 Admin 保留入口和行为，新 Blank 不依赖 Core，Screen 只安装选择的能力。
- DataV/Cockpit 删除旧画布缩放算法和模式 prop；使用统一设计宽度输出 vw，布局、引擎、保存等业务能力保留。
- 请求解析、上下文字段、菜单来源、API DTO 和业务表单由应用 Adapter 负责。
- 所有身份切换同时处理请求、菜单、字典和业务状态，前端权限不代替后端授权。
- 公共修复通过包升级传播；生成的页面、服务接线和布局由业务项目拥有，不承诺自动覆盖更新。

## 从 Core 0.0.4 升级

省级项目有实际启用的 pnpm patch，不应把“源码修复完成”当作“可立即删除业务补丁”。
建议仅在独立临时副本执行以下步骤，原项目保持只读：

1. 保留原 package.json、pnpm 配置、lockfile、patch 和原质量门禁结果，记录目标版本与来源。
2. 使用已核验的 `0.1.1-beta` registry 包；开发更新源码时构建并 pack 精确提交，记录每个 tarball 的 SHA256。
   Core、Icons、Charts、Vite 和 Viewport 的内部依赖必须来自同一版本或同一候选，不混用源码 alias。
3. 在副本用精确版本或 tarball/overrides 替换原有 `@lumal/*`，不盲目升级所有 Vue/Vite/TypeScript 生态依赖。
   检查实际 `pnpm why`、peer 和 lockfile，避免传递依赖回落到 registry 的历史版本。
4. 只在副本移除旧 `@lumal/core@0.0.4-beta` 的 patchedDependencies 绑定；
   候选 tarball 不是旧压缩 chunk，不能把旧 patch 强打上去。不要先删除原项目补丁文件。
5. 首次升级安装正常生成新 lockfile，然后独立执行 `pnpm install --frozen-lockfile`；
   不能要求不存在或已失配的锁文件首次 frozen 安装成功。
6. 使用**真实项目自己的命令**执行 lint、typecheck、test:run、build。
   两个业务项目当前的 `format` 是 ESLint fix，不假定已存在新模板的 format:check/check 脚本。
7. 验证下列行为，保留失败/通过日志和生产截图。只有目标版本无 patch 的业务回归通过，
   才在单独业务升级 PR 中删除旧 patch、更新依赖与 lockfile。
8. 回滚时在副本或经业务仓库授权的升级 PR 中恢复精确依赖与对应 lockfile；
   不对原业务工作树执行 reset 或覆盖用户修改。

历史版本已按上述方法在省级临时副本对照旧版与
`c2dd61695a539859e89be780b6da28d6dc484b41` 历史候选（不是本轮纯 vw 的验收）：无旧Core patch绑定时，
normal/frozen安装、lint、typecheck、生产构建均通过；原测试仍为相同的六项失败和一个部署suite加载错误，
七个FAIL标题与基线逐字一致。候选精确tarball哈希、环境差异和JS/CSS体积见
[隔离候选对照](./real-consumer-compatibility.md#省级隔离候选对照)。
这些证据不等于真实后端、原Dashboard浏览器或部署验收，不应直接批准删除业务补丁。

### 必须验证的行为

| 能力            | 升级关注点                                                    | Core 中的依据                                              |
| --------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| 启动/导出       | 根入口、minimal、独立 auth/request/router/layout 等子入口     | `packages/core/package.json` 的 exports、发布边界检查      |
| 主题/字号       | 用户字体偏好默认14、范围12–20，Element Plus 映射保持          | `packages/core/src/theme/`，现有主题测试                   |
| Layout/标签     | 菜单选择、刷新、关闭缓存、viewKey/cacheKeys、最大化动画       | 既有 Layout/生产浏览器回归，业务 key 仍需现场验证          |
| 权限/菜单       | 保留后端授权树，站内回跳白名单、403/404 不循环                | router/permission 包测试及 hybrid 脱敏测试                 |
| 请求            | 系统/业务不同成功码、顶层字段、公开登录401与失效分离          | 请求契约测试；保留业务 parse adapter                       |
| 会话切换        | 旧401/旧刷新不退出新会话；旧成功响应不写新业务状态            | Core 本轮前两项有回归，后一项仍由应用代次/AbortSignal 保护 |
| Schema/CRUD     | 序号、跨页、CRUD分页、错误保留编辑器、表单字段、插槽          | `schema-table-*`、`crud-table-component.test.ts`           |
| Dictionary      | 字符串值、过滤、缓存失效、身份切换重置                        | Dictionary 公共 store/fetcher；业务失效服务保留            |
| Charts/Resolver | 类型、组件解析、按需图表引擎、生产资产                        | Charts/Vite 公共构建与独立消费者；真实配置仍需复测         |
| Dashboard       | 内容容器尺寸、地图 updateSize、浮层高度、Teleport、浏览器缩放 | 通用视口实验室已验证，不替代真实页面验收                   |

本轮 `e70adb4` 原生覆盖旧 patch 的无 field 序号、稳定列标识、跨页序号、
序号不派生表单/字典等契约；新增回归还覆盖选中行导出。普通列仍要求有效业务字段，
不要为了序号将所有 `field` 改成可选。补丁删除的最终条件是副本实际消费的 tarball 通过，而非版本号比较。

`SchemaTableColumn` 现在是判别联合，`CrudTableColumn<T>` 是交叉类型。
如果业务原来声明 `interface CustomColumn extends CrudTableColumn` 或
`extends SchemaTableColumn`，需改为 `type CustomColumn = CrudTableColumn<Row> & { ... }` 等组合形式。
普通数据列的 `field` 仍按行类型校验；序号列使用 `type: 'index'` 且不传 `field`，
不要使用类型断言绕过这一区分。

### 请求 Adapter 不可删错的部分

本轮按scope/reset/客户端实际管理的Authorization隔离迟到401、刷新及失效通知，错误为
`RequestError { code: 'STALE_SESSION', kind: 'cancelled' }`。
即使没有改变scope或调用 `clearCache`，仅Token切换后的旧POST/匿名请求或旧刷新结果
也不能退出新会话；Token清空、并发刷新和Abort均有仓库回归。
外部显式Authorization不跟随客户端默认Token自动刷新。
连续会话不复用上一身份的失效通知锁。
它们不会取消所有在途请求，也不替应用验证异步业务状态。
旧成功响应、应用自定义 refresh 写 Token、延迟菜单结果必须继续检查会话代次。
省级 `src/api/request.ts` 的严格会话保护可以评估简化，但不能整段直接删除。

Parser 只在显式接入时解包。系统成功200与某业务接口成功0/200的差异留应用层，
不放宽所有接口；登录失败不得被伪装成成功或切换到 Demo。
超时使用 `AbortSignal`，请求取消和身份变更应避免弹出普通业务失败提示。
普通写请求默认不因认证刷新自动重放；确有幂等保障时显式 `retryOnAuthRefresh: true`。
旧客户端的 POST `cache: true` 不能直接搬用：新配置应显式设置
`cache: { enabled: true, key, scope }`，非 GET 的 key 必须区分请求体语义，业务读写失效规则仍由应用控制。

## 从 gr-framework 迁移

这不是直接兼容包，不提供改一次 import 就完成整站迁移的保证。
真实小流域项目已使用一个 Router 和两个布局，应先迁移共享契约，再按页面渐进迁移。
不要同时把业务权限、地图、AI编排、图表和请求全量改写。

| 旧 API/入口                                             | Lumal 对应公开 API                                                                        | 迁移等级与注意事项                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `createGrFramework`                                     | Core 根入口或 `@lumal/core/minimal` 的 `createLumalAdmin`                                 | 需适配：permission/dict/theme/preset 选项结构不同；保留同一 Pinia/Router       |
| `AppLayout`                                             | `LumalLayout`，来自 `@lumal/core/layout`                                                  | 需适配 props/slots/events；Screen 不必使用 Admin Layout                        |
| `AppRouterView`                                         | `LumalRouterView`                                                                         | 需适配 cache/viewKey/cacheKeys 与刷新策略，不按组件名推测一致                  |
| `createAdminPermissionRouter`                           | `createMenuRouteRuntime` + `createPermissionStore` + `setupPermissionGuard`               | 组合迁移，不是同签名替换；保留 Screen 公共路由和站内回跳规则                   |
| `buildDynamicRoutes`/菜单构建                           | `normalizeMenuRecords`、`createRouteRecords`、`createSidebarMenus`、`createRouteRegistry` | 需映射字段与组件白名单；菜单 `meta.authority` 和守卫 `meta.permissions` 不混淆 |
| `GCrudTable`                                            | `LumalCrudTable`，来自 `@lumal/core/components`                                           | 需适配：prop→field、分页、dataSource、操作命名、插槽和错误语义                 |
| `GSchemaForm`/`GSchemaTable`                            | `LumalSchemaForm`/`LumalSchemaTable`                                                      | 需适配 schemas/rows、字段上下文、事件、treeProps 和泛型；不是旧 Ref 实例       |
| `rowCreate/rowEdit/rowShow/fetchData`                   | `openCreate/openEdit/openView/reload`                                                     | 逐项检查参数及返回值；不要读取组件内部 form Ref                                |
| 旧 default/standard Axios 请求客户端                    | `createRequestClient`、公开 Parser、`parsePageResult`                                     | 需替换接线：Fetch RequestInit/AbortSignal 与 Axios config/interceptor 不同     |
| `useDict`/`installDict`/`createDictFetcherWithFallback` | `useDictionary`/`installDictionary`/`createDictionaryFetcherWithFallback`                 | 需适配返回形态、options字段和显式 fallback；不可给认证接口加演示兜底           |
| 旧 viewport 尺寸函数 | `@lumal/viewport` 的 `viewportLength`/`useViewportWidth` | 普通CSS由Vite转换；数字设计尺寸按浏览器宽度，实际容器测量不换算 |
| 旧 Vite `createViewportTransformPlugin`                 | `@lumal/vite` 同名可选插件                                                                | 受控 CSS 与 Vue 模板 style/:style 使用 AST；不扫描脚本，第三方依赖须精确授权 |
| `GrFrameworkResolver`                                   | `createLumalComponentResolver`，来自 `@lumal/vite`                                        | 改组件名和解析入口；通过独立构建验证，没有虚构 `/resolver` 子入口              |
| 行业上下文字段、权限码、地图、AI与复杂业务弹窗          | 应用自己的 API/Store/组件                                                                 | 留业务层；不纳入公共框架兼容承诺                                               |

### CRUD 的失败协议

旧页面常使用 `saveHandler(form, mode): Promise<boolean>`。
新 `CrudDataSource.create/update/remove` 为 `Promise<unknown>`；
正常 resolve 表示操作完成，reject 才保留错误状态。返回 `false` 不能阻止关闭。
应在应用 API 层检查成功码，不成功时抛出保留消息的错误，再让 CRUD 展示错误和允许重试。
不要 catch 后只显示消息并吞掉异常，也不要为兼容旧 boolean 处理再造一个巨型组件。

普通重复表单可沿用列派生，复杂关联使用 `formSchemas` 和 `form-${field}`；
授权树、文件预览、地图取点、自定义弹窗用普通 Vue + Element Plus 与公开 slots 组合。
`formSchemas` 是整体替换而非自动与派生字段合并，隐藏ID和敏感字段要在 API DTO 中明确处理。
具体20页审计结论见[CRUD矩阵](./real-consumer-compatibility.md#crud-页面审计)。

### Admin 与 Screen 共存

保留一个 Router。公共 Screen 独立 route tree 明确 `requireLogin: false`，
后台 route tree 默认需要认证及权限；不要在受保护的 Admin 父节点下期望子节点覆盖全部继承规则。
分别给布局传菜单，公共页面不要为了共享会话安装系统管理模块。
身份变更重置远程 route registry/授权、重算菜单，并通过公开 Router API 重新匹配当前路由。
登录、403、404 必须有可结束的入口，回跳仅接受站内白名单地址。

KeepAlive 是否保留地图由应用决定：希望切后台再回来保持地图时使用一致缓存 key，
需要销毁轮询/地图时显式关闭缓存。后台标签不能顺便改变公开页面的 key 或清缓存策略。
移除外层画布缩放及 Cockpit 旧模式配置。DataV 与 Cockpit 自身不再施加整画布缩放，
统一通过项目的设计宽度生成 vw；嵌入容器也不改变换算基准。
编译范围与地图/Teleport约束见[屏幕适配指南](./screen-viewport-guide.md)。

## 模板代码的维护边界

| 位置                                                    | 归属与升级方式                                               |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| 公共包 request/router/permission/layout/Schema/viewport | 集中测试和发布后升级依赖，不复制 Monorepo 私有源码           |
| 生成的 main/router/services/API adapters                | 应用拥有；可按项目接口修改，对照模板升级说明手动合并相关修复 |
| 生成的页面、选项、业务类型/布局/地图                    | 应用拥有；不能通过升级公共包自动替换                         |
| ESLint/Prettier/EditorConfig/AGENTS/DEVELOPMENT         | 项目规范基线；按目录形态调整边界，避免升级时无关全量格式化   |
| 生成的 lockfile                                         | 首次安装产生，随业务版本审查；之后 frozen 安装复现           |

CLI 保留 `create-lumal-admin` 命令和 Admin preset；旧适配模式参数已删除，
改用 `--viewport`/`--no-viewport` 与单一 `--design-width`。新项目类型与可选能力见
[项目模板指南](./project-template-guide.md)。通用 `create-lumal` bin 由已发布的 `create-lumal-admin@0.1.1-beta` 分发，
独立 `create-lumal` npm 包仍未发布，也没有删除或更名旧入口。后续新增 npm 名称时须另行核对 registry 与发布权限。

### 历史：0.0.6-beta 到 0.0.7-beta

以下仅说明旧版本之间的变化，不是当前纯 vw 版本的接入方式。
该次升级保持十包内部依赖同版，显式安装 `0.0.7-beta`，不依赖浮动 `latest`。
Viewport 运行时公开 API 未改变。Vite 默认继续关闭转换，但启用时额外保护行高、最小尺寸和已有适配表达式；
旧项目若确需转换最小尺寸，显式设置 `minSize: true` 后验证布局，不要扩大整个文件范围。
`inlineStyles: true` 才处理可静态分析的 Vue style，业务脚本、动态表达式和地图坐标保持原样。
Screen 共享 `viewport.config.ts` 是生成代码改进，已有项目按需手工合并；依赖升级不会覆盖业务文件。
Cockpit Designer 名称输入修复已随本版发布，不需要消费方复制内部组件。

## P2 审查

### 增量模块生成：暂缓实现

真实页面有重复的查询/列/API骨架，但目录和路由所有权并不统一：
省级是 `views/data` 与后端授权菜单，小流域是 Admin/Screen/Shared 加动态 Screen 子路由；
树管理、文件、关联授权、行业资源页又需要不同工作流。
现有证据不足以证明统一 `add module/page` 能明显减少维护，而不引入额外配置或错误注册路由。
本轮不创建未经验证的生成器，不把“少数文件写出”冒充完整增量能力。

后续最小方案只考虑复用现有脚手架安全写入/回滚机制：
显式选择业务根和名称，生成独立 typed 页面、API类型及测试，返回待人工接入的路由声明；
已有文件一律拒绝覆盖，不自动修改后端菜单，不扫描/重写任意业务 AST。
先对两个消费者各迁移一个重复页面，记录原/新行数、维护步骤和测试成本；
收益成立才加入 CLI 与取消/冲突/事务回滚测试。没有证据前不引入插件市场或自动迁移平台。

### OpenAPI：最小接入方案，未验证真实 Schema

只读检查得到：

| 后端   | 源码证据                                                                                | 能确认/不能确认                                            |
| ------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 省级   | `backend/pom.xml` Springfox 3.0.0；SwaggerConfig 使用 `DocumentationType.OAS_30` 与开关 | 有 OAS3 生成配置；未启动后端、未取得实际导出、未验证覆盖率 |
| 小流域 | `backend/DevBase-jar/pom.xml` Springfox 2.9.0；Swagger2Configuration 使用 `SWAGGER_2`   | 有 Swagger2 分组和鉴权声明；未验证运行时生成或真实可用地址 |

只在约定的源码/构建产物范围搜索，未发现可供本轮使用的静态 OpenAPI/Swagger JSON/YAML。
没有访问内部文档服务，也没有把 Schema 上传第三方转换服务。
因此不声称已针对两个真实 Java 后端运行类型生成。

最小方案使用成熟工具，不给 Lumal 增加 OpenAPI 运行时：

1. 由业务项目在授权环境导出并脱敏 schema，检查私有地址、示例数据、鉴权信息和引用。
2. OpenAPI3 使用 `openapi-typescript` 生成 TypeScript 声明；Swagger2 先在本机用
   `swagger2openapi` 转换，检查 nullable、分页、泛型包装、multipart 和鉴权语义后再生成。
3. 工具作为业务 devDependency 固定评审过的精确版本并提交 lockfile；
   生成物只包含类型，服务函数继续通过已有 `createRequestClient`/Adapter 调用。
4. CI 对同一脱敏schema重新生成并检查 diff，再执行 typecheck/契约测试；
   不自研解析器，不生成第二套客户端，不把生成类型当作运行时响应校验。

取得有效 OpenAPI3 文件后可使用如下业务脚本，路径为通用示例，并非本轮已取得的真实schema：

```json
{
  "scripts": {
    "api:types": "openapi-typescript docs/contracts/openapi.json -o src/api/generated/schema.d.ts"
  }
}
```

2026-10-23核对的官方参考：
`https://openapi-ts.dev/introduction`（支持OpenAPI3.0/3.1，类型生成不增加运行时）；
`https://github.com/Mermade/oas-kit`（包含Swagger2到OpenAPI3转换工具）。
实际后端schema缺失、工具版本选择和类型覆盖率仍是后续验证项，不以本例宣称生产接入完成。
