# 真实消费者兼容性

审计日期：2026-10-23。本文针对当前开发分支，不将历史发布的同版本号视作包含本轮修改。
两个业务仓库仅只读检查，没有修改源码、锁文件、补丁、部署或会话数据。
公开仓库只保留文件定位和协议结论，不包含业务实现、服务地址、账号、地图数据或商业资产。

## 证据等级

| 等级           | 本轮含义                                               | 不能证明的事项                                                           |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| 源码审计       | 阅读实际 manifest、配置、请求、页面及后端 Swagger 声明 | 真实后端可访问、整套业务升级成功                                         |
| 脱敏契约       | Core 的独立请求、CRUD、路由测试                        | 企业接口、数据权限、网络和部署正确                                       |
| 隔离浏览器夹具 | 通用地图、图表、浮层在真实 Chromium 中运行             | 省级 Dashboard 原页面已经修复                                            |
| 完整消费者升级 | 用候选 tarball 安装到业务项目隔离副本并执行原质量门禁  | 原门禁全绿、真实后端可用或生产页面已验收；本轮只能证明隔离对照无新增失败 |

下文用 `P/` 表示省级项目 `frontend/`，`S/` 表示小流域项目 `frontend/`。
本机原始路径分别为任务指定的两个只读项目，不把其绝对路径写入生成模板。

## 消费基线

| 项目   | 实际依赖与结构                                                                                         | 对 Lumal 的要求                                                      |
| ------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 省级   | `P/package.json` 固定 Core、Charts、Icons、Vite 为 `0.0.4-beta`；独立前后端                            | 保持公开子入口、现有 Layout/Schema/Dictionary 接入；补丁须按行为验证 |
| 小流域 | `S/package.json` 使用 `@guiren/framework ^0.2.5`；`src/admin`、`src/screen`、`src/shared`、一个 Router | 迁移而非改包名；保留访客 Screen、独立菜单、动态业务路由及共享会话    |

省级 `P/src/main.ts` 使用 Core 根入口启动、独立注册字典和权限；`P/vite.config.ts`
使用 `createLumalComponentResolver`。这些入口继续保留。新建轻量项目可以选
`@lumal/core/minimal`，但升级现有完整 Admin 不要求为了入口调整重写业务。
根入口传 `preset: 'minimal'` 不等于子入口的依赖隔离。

两个项目的 `eslint.config.mjs` 都使用 Antfu、TypeScript resolver 和
`import-x/no-restricted-paths`。小流域明确限制 Admin/Screen 互不依赖，Shared 不反向依赖业务域；
省级限制界面直接依赖 Mock，以及基础类型/工具反向依赖界面。生成项目只继承适用边界，
不能给没有这些目录的 Blank 强加混合项目规则。工程规范见[开发标准](./development-standards.md)。

## 请求行为矩阵

实际审计入口：

- `P/src/api/request.ts`、`P/src/services/session.ts`、`P/src/services/navigation.ts`。
- `P/src/api/system/user.ts`、`role.ts`、`dict-type.ts`、`dict-data.ts`。
- `S/src/shared/utils/request/{core,index,types,skip-bscd-options}.ts`。
- `S/src/shared/api/{auth,core,permission,common}.ts`、`S/src/admin/api/system/`。

| 契约                | 真实项目行为                                      | 当前 Lumal 接法及验证证据                                                                                              |
| ------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Token               | 省级 Bearer；小流域由旧请求 preset 注入           | `getToken`、`tokenPrefix`，特殊头用 `onRequest`；`consumer-request-contract.test.ts`                                   |
| 成功码、字段        | 省级系统与业务接口规则不同；小流域使用另一套包装  | `createStandardResponseParser`/`parseStandardResponse` 显式配置 `fieldNames`、`successCodes`；不在 Core 猜业务协议     |
| `msg`/`message`     | 省级按接口族选择字段，并保留完整顶层响应          | Parser 的 `fieldNames.message` 与 `transform`；Adapter 决定保留包装还是提取 data                                       |
| 登录失败            | 省级公开客户端把认证失败和已有会话失效区分        | 登录客户端不注册退出回调；业务错误必须 reject，不回退 Demo；脱敏公开/私有客户端测试                                    |
| 超时与取消          | 省级 fetch 包装配置超时；小流域 Axios timeout     | 原生 `AbortSignal`，超时 reason 保留为 `originalError`，错误 `kind: 'cancelled'`；契约测试                             |
| 错误类型            | 页面需要明确失败消息，不能把拒绝当成功            | `RequestError` 区分 network/http/business/session/duplicate/cancelled；已有 `request-client.test.ts`                   |
| GET/DELETE query    | 省级通过 `query`；小流域业务上下文注入 params     | 使用 `query`；业务上下文字段由应用 wrapper 合并，不增加行业专用 Core 选项                                              |
| POST/PUT/PATCH body | 省级明确 body，部分特殊接口确实使用 query         | 使用 `body`；不要凭 HTTP 方法强制改写所有后端契约；允许显式 query                                                      |
| Multipart           | 旧应用对上传上下文字段有特殊放置规则              | `upload`/`FormData`，不要手写 boundary；上下文放 query 还是 form 由 Adapter 决定                                       |
| 扩展 Hook           | 小流域有上下文注入和 skip 标记                    | 应用 wrapper 处理私有选项；公开 `onRequest` 操作最终 URL/init，不能照搬 Axios config                                   |
| 迟到 401            | 省级捕获会话代次，在 fetch/读 body/错误回调前校验 | 本轮 Core 对 `clearCache` 或 `getCacheScope` 变化后的旧 401 返回 `STALE_SESSION`，不触发退出；`request-client.test.ts` |
| 刷新并发            | 旧会话刷新不能占用新会话刷新锁                    | 本轮隔离刷新代次和 scope，旧刷新收尾不清除新锁；并发/换 scope/清缓存测试                                               |
| 缓存失效            | 省级切换身份清请求、字典、平台缓存                | `clearCache`、非敏感 `getCacheScope`；业务字典/地图/Store 仍由应用重置                                                 |
| 分页转换            | 省级存在 rows/total 与 list/total；旧项目包装更深 | `parsePageResult` 或 `CrudDataSource.parseResponse` 转为 `{ items, total }`；显式映射测试                              |

本轮请求修改集中在已有客户端，没有新增 Axios 替代包装层或另一套请求引擎。
最终请求契约的73项仓库回归覆盖scope/reset/实际管理的Authorization隔离，
包括仅Token改变的旧POST、匿名迟到POST、刷新期间Token替换/清空、并发刷新与Abort。
外部显式Authorization不跟随客户端默认Token自动刷新。
`clearCache()` **不自动取消所有旧成功请求，也不能阻止应用自己的 refresh 回调写回旧 Token**。
身份切换仍应先递增会话代次，取消应用拥有的请求，并在更新 Token、菜单和业务 Store 前检查代次。
省级已有的严格 `assertCurrent` 保护不可直接删除；先在隔离副本证明业务成功响应也不会串会话。
缓存 scope 不应包含明文 Token、账号隐私或内部凭据。

## CRUD 页面审计

检查了省级 10 页、小流域 10 页。以下按 10 种使用形态归类，不将同类三张数据表重复算成三种抽象需求。
保留列、查询、权限、API、业务校验的职责边界，不恢复第二个 GCrudTable。

| 形态与实际文件                                                                                                  | 真实差异/重复                                                               | 复用判断                                                                                         |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 上下文数据：`P/src/views/data/{Weather,Population,Gdp}.vue`                                                     | 查询/列/独立编辑 schemas；上下文选项、不同精度、分页和权限重复接线          | 现有 `CrudDataSource` 足够；模型切换和业务字段留页面/API，不新增行业 CRUD                        |
| 异步选项与字典：`S/src/admin/views/basicInfoManage/dangerousVillagesList.vue`                                   | 异步下拉、字典、掩码、坐标校验、旧 boolean 保存处理                         | Ref options、字典与 Schema rules 已有；格式器签名和失败语义需适配                                |
| 普通编辑：`S/src/admin/views/dataManage/basicManage/ContactBook.vue`                                            | 派生表单、隐藏字段、邮箱/手机规则、自定义删除后手动刷新                     | 使用现有派生表单与 `dataSource.remove`，减少手动关闭/刷新状态；业务消息仍可自定义                |
| 用户和关系：`P/.../permission/User.vue`、`S/.../permission/user.vue`                                            | 异步角色/机构、详情与列表不同、重置密码、自定义授权弹窗                     | `formSchemas`、`row-actions`、`form-${field}` 已可组合；关联完整性和敏感字段白名单留 API Adapter |
| 角色权限树：`P/.../permission/role/index.vue`、`S/.../permission/role.vue`                                      | 半选父节点、授权模式、不同详情结构                                          | 保留业务树组件/弹窗，使用插槽；不把某后端半选规则写进 Core                                       |
| 组织树：`P/.../permission/Organization.vue`、`S/.../permission/organization.vue`                                | 省级 CRUD；小流域 SchemaTable + SchemaForm + Dialog；父节点排除和树结构不同 | 两种组合均合理；树过滤和关系校验不应强制归入巨型 CRUD                                            |
| 菜单树：`P/.../permission/menu/index.vue`、`S/.../permission/menu.vue`                                          | 目录/页面/按钮、图标选择、权限码校验和条件字段                              | 继续公开 Schema/插槽；应用负责协议转换，不复用菜单编辑数据作为可执行组件                         |
| 字典父子页：`P/.../dictionary/{DictionaryType,DictionaryItem}.vue`、`S/.../dictionary/{dictype,dictionary}.vue` | 路由查询关联、异步类型选项、编辑后失效字典缓存                              | `v-model:query-model`、`querySchemas`、Dictionary store 已有；缓存失效由业务服务接线             |
| 文件管理：`P/src/views/system/FileManagement.vue`                                                               | 列表只读详情，外部上传/预览/下载和独立权限                                  | `toolbar-actions`/`row-actions` 组合普通 Element Plus；不把上传工作流塞入 CRUD 配置              |
| 资源与跨字段校验：`S/.../resourceManage/{safePoint,materialWarehouse}.vue`                                      | 容量/已用量关系、隐藏字段、数字校验、业务弹窗与旧表单 expose                | Schema 的 model/context 与业务组件足够；不能机械迁移 `tableRef.form.value`                       |

表内 `P/...` 均相对 `P/src/views/system/`，`S/.../permission`、`S/.../dictionary`
相对 `S/src/admin/views/system/`，`S/.../resourceManage` 相对 `S/src/admin/views/dataManage/`。
这是定位清单与行为摘要，不包含页面源码或数据。

### 最重要的迁移差异

- 旧 `prop` 改为 `field`，格式器旧 `(row)` 与新 `(value, row, index)` 不能机械替换。
- 新 `fetch({ page, pageSize, query })` 明确分页，返回标准结果或提供 `parseResponse`。
- 旧 `saveHandler` 的 `false` 不是新 API 的失败协议。新 create/update/remove 为
  `Promise<unknown>`，**fulfilled 表示完成，失败必须抛错/reject**，否则弹窗可能关闭。
- 旧 `rowCreate/rowEdit/rowShow/fetchData` 分别评估为 `openCreate/openEdit/openView/reload`；
  model 和插槽参数按新类型读取，不依赖内部 Ref 或私有方法。
- 查询/表单业务字段明确类型；字段复杂时单独 `formSchemas`，不要为复用列强加无关字段。
- `actions`/toolbar 或 `canAccess` 控制 UI，不代替后端认证和数据权限。

`useCrudDialog` 已在保存拒绝时保留编辑器；`crud-table-component.test.ts` 验证错误反馈和重试。
现有异步 options、Dictionary、slots、树表与普通 Vue 组合能表达已审计需求。
本轮没有可比的逐页重写基准，因此**不宣称减少某个百分比代码**，也不新增通用 CRUD 工厂。
可证实的集中修复是下节序号列补丁，不要求消费者继续复制打包产物修复。

## 省级补丁核对

`P/pnpm-workspace.yaml` 的 `patchedDependencies` 实际启用
`P/patches/@lumal__core@0.0.4-beta.patch`，不是闲置补丁文件。

| 补丁契约                                | 当前源码                                                   | 独立回归                         |
| --------------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| 无业务 `field` 的 `type: 'index'`       | SchemaTableColumn 判别联合，普通列仍校验真实字段           | `schema-table-normalize.test.ts` |
| 稳定内部 key、序号不读/改业务行         | SchemaTable normalize 与 index 分支                        | `schema-table-component.test.ts` |
| 跨页序号、无分页时从 1 开始、选中行导出 | 按 page/pageSize 计算并按原行位置导出                      | `schema-table-component.test.ts` |
| 序号不触发字典、不派生编辑字段          | `components/crud-table/schema.ts` 过滤 index               | `crud-table-component.test.ts`   |
| CRUD 将分页传给内部 SchemaTable         | 表格关闭第二个分页器但保留当前页计算上下文                 | `crud-table-component.test.ts`   |
| 序号类型与普通列类型不退化              | `SchemaTableColumnBase` + 联合类型、`CrudTableColumn` 泛型 | Core 类型检查及包构建            |

对应本轮修复提交为 `e70adb4`。以上是在源码及仓库测试中证明的原生覆盖。
本轮已在省级隔离候选中移除旧patch绑定，类型检查、生产bundle和相同原测试对照没有新增失败；
但原门禁仍非全绿、真实业务页面浏览器未验收，**不是批准直接删除业务补丁**。
完成剩余业务回归后，才能在业务升级 PR 中删除补丁。
具体流程见[升级指南](./upgrade-guide.md)。

## Layout 与访客 Screen

省级 `P/src/layout/AdminShell.vue` 使用同一授权菜单与 LumalLayout，
`viewKey` 包含路由、业务上下文和刷新代次；地图离场即销毁、管理页按偏好缓存，这是业务选择。
小流域 `S/src/router/index.ts` 在一个 Router 中组合公开路由、后台权限守卫和动态 Screen 子路由；
`S/src/main.ts` 的过期处理允许继续访客浏览 Screen。

当前公开 API 可以组合 `LumalLayout`、`LumalRouterView`、`setupPermissionGuard`、
`createMenuRouteRuntime`/`createRouteRegistry`，不要求两套 App/Router。
公开 Screen 的 `requireLogin: false` 不应继承受保护父路由；Admin 默认受保护；
菜单来源分别传入，身份切换重算授权并重新鉴权当前页。
动态 route registry 必须按所有权 reset；标签/KeepAlive key 必须一致。
相关脱敏回归位于 `packages/core/tests/hybrid-consumer.test.ts`；真实业务路由仍需在隔离副本验证。

## Dashboard 适配专项

只读核对 `P/src/views/dashboard/index.vue:206`、`styles/`、`controls/`、
`map/MapCanvas.vue`、`statistics/` 和 `P/src/layout/AdminShell.vue`：

- 工作区固定 min1280×660，左右382px、底部210px，另有图例高度。
- 浮层绝对定位，1799/1599 宽度断点不能解决 Header/Tabbar 占位后高度不足。
- MapCanvas 生命周期保持单实例并显式销毁；没有发现该文件直接接入内容区 ResizeObserver/updateSize。
  地图库内部是否自行观察尺寸未在本轮声称验证，接入时应确认后避免重复监听。
- TrendChart 使用 LumalChart；StatisticsDialog 已 append-to-body，不能把该浮层再乘画布比例。
- `P/src/views/dashboard/__tests__/theme.test.ts` 明确断言固定面板尺寸及禁止 vw/cqw 字号。
  未来业务改造要更新为策略/边界断言，同时保留字体、配色、地图事件与业务回归。

公共能力用独立 `@lumal/viewport` 提供应用默认、页面覆盖、容器观察；
省级推荐地图使用真实内容尺寸，浮层用实际宽高协调，**不 transform 整个地图**。
固定 min-size、面板折叠优先级、业务 mapPadding、断点和业务字号仍应在消费者修改。
高度不足时允许局部滚动/紧凑/折叠，不能把整个工作区无限撑高。

### 已执行的脱敏夹具

`apps/lumal-viewport-lab` 自行编写通用布局，使用真实 OpenLayers 矢量、ECharts Canvas、
Element Plus 表格/Dialog/Select/Tooltip，不复制任何行业地图或业务服务。
`scripts/check-viewport-consumer.mjs` 通过 Chromium 扩展 `tabs.setZoom` 改真实标签缩放，
不是用 viewport、DPR 或 CSS zoom 冒充；覆盖 Dev/Build 各20组响应式工作区，
另有8组局部contain/width与2组实例稳定检查，均通过。

| 原生窗口100%内容尺寸 | 实际标签缩放 | 实测 innerWidth×innerHeight | 实测工作区  |
| -------------------- | ------------ | --------------------------- | ----------- |
| 1280×720             | 80%          | 1600×900                    | 1600×784.0  |
| 1280×720             | 100%         | 1280×720                    | 1280×604.0  |
| 1280×720             | 125%         | 1024×576                    | 1024×460.0  |
| 1280×720             | 150%         | 853×480                     | 853.3×364.0 |

完整尺寸另包括1366×768、1440×900、1920×1080、2560×1440。
`output/release/viewport-report.json` 实际记录开发20 passed、生产20 passed，并包含 DPR、
工作区/各浮层矩形、地图实例及点击误差、图表尺寸。截图在 `output/playwright/viewport/`。
这些是可再生成的本地产物，不随 npm 发布。验证方式与边界见
[专项验收报告](./screen-viewport-verification.md)，策略示例见
[屏幕适配指南](./screen-viewport-guide.md)。
结果证明公共能力和通用布局可用，**未证明省级原页面已无溢出或已完成升级**。

## 省级隔离基线

2026-10-23在系统临时目录建立 baseline/candidate，保留实际源码、`public/`目录资产、脚本、配置、
lockfile和原Core patch。没有复制 `.git`、原 `node_modules`、构建缓存、部署目录、
Jenkinsfile或任何原 `.env`。必需环境变量使用人工无凭据占位值，不连接真实接口或地图服务。
私有源码、原始日志和资产只留临时目录，不进入 Lumal Git 工作区。

基线仍消费 registry 的 `0.0.4-beta`，lock snapshot包含patch hash；
补丁4个dist文件的29条新增行均存在于实际安装包，确认原Core patch已应用。先尝试 offline frozen 安装，
因本地store缺少tarball失败，再经授权执行正常联网 frozen 安装，699个package安装完成。
使用原项目自己的脚本，没有为通过而删除测试或改写生产业务代码。

| 检查       | 实际命令                                  | 基线结果                                                                 |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| 安装       | `corepack pnpm install --frozen-lockfile` | 通过；pnpm10.33.0，Node24.14.1                                           |
| Lint       | `corepack pnpm run lint`                  | 通过，14.059s                                                            |
| TypeScript | `corepack pnpm run typecheck`             | 通过，11.239s，0个TS错误                                                 |
| 原单元测试 | `corepack pnpm run test:run`              | 退出1；38/41 files、474/480 tests通过；3个失败文件中包含1个suite加载错误 |
| 生产构建   | `corepack pnpm run build`                 | 通过，15.055s；Vite自身13.93s                                            |

失败分类不能隐去：

- `src/__tests__/environment.test.ts` 的5项部署环境字面量断言与主动使用占位env不一致。
  不复制真实地址或凭据使这些断言变绿，也不把这5项计作公共包回归。
- `src/__tests__/lumal-vite.test.ts` 中 RegionSearch 的resolver图标断言预期2个svg、实际1个，
  在旧版 `0.0.4-beta` 已失败；候选须按相同条件比较。
- `src/__tests__/jenkins-deploy.test.ts` 依赖未复制的Jenkinsfile，suite加载失败。
  该文件会提取shell执行模拟部署检查，本轮不声称执行了这些部署测试。

基线生产JS共50文件，3,769,485 bytes raw / 1,202,677 bytes gzip；
CSS共5文件，721,073 / 132,156 bytes。gzip是逐文件压缩后求和，
不包含私有静态资产，不等同首屏入口大小或浏览器实际传输量。

## 省级隔离候选对照

最终候选公共运行时基于提交 `c2dd61695a539859e89be780b6da28d6dc484b41`；
pack时还包含待提交的公开README/description更新，未改变运行时代码。
所有manifest仍写 `0.0.5-beta`，不能用这个版本号代替精确候选身份，也不能用历史registry同名版本复现。
本轮只切换临时candidate，真实业务项目的依赖、lockfile和patch保持不变。
先前 `0bf5ab6` 候选只完成一次安装，因后续边界修复被替代，不纳入本表的正式结果。

准备了完整十包候选，记录如下SHA256；省级实际依赖图只安装表内标“是”的五包。
九个 `@lumal/*` overrides统一指向该候选，未使用工作区源码alias。
逐一核对实际五个Lumal lock resolution的file tarball路径、SHA256及SHA512完整性，
没有回落registry旧包；旧Core patch绑定已移除。

| 包                   | 省级实际安装 | tarball SHA256                                                     |
| -------------------- | ------------ | ------------------------------------------------------------------ |
| `@lumal/core`        | 是           | `fdb05f2553c944529f97852c1f0fc95a618299ac7006742d1f25d598682d81c7` |
| `@lumal/charts`      | 是           | `a37fde5763e5755bbcdbb48a540d29cb325686ba79c2e437f89cff14d2dc97c2` |
| `@lumal/icons`       | 是           | `de99ab2c54220666cd86ad92604171041c842a35604326cf588ff78e6698dda0` |
| `@lumal/icons-vue`   | 是           | `f1806dd63c99b9f1359a6a3c0b5a9d7017153eebeb8f0122fd4ef1e1262c2300` |
| `@lumal/vite`        | 是           | `ab620dc05416303fa336e996d4536388e41471389b90dbcdb6908d7cad814ac9` |
| `@lumal/viewport`    | 否           | `0700d77a320c0bb270d77c4809c2a4bcaf99a322a85a7561d729741007131f09` |
| `@lumal/datav`       | 否           | `9466945501e17aa55de5d2301340c8074bbc8eeecf74df4bc21c03f67052904f` |
| `@lumal/cockpit`     | 否           | `f7d3c816e3bae595c94147c7b01d6ea5094a141d7c10ef890764f2cd5bf41872` |
| `@lumal/vben-compat` | 否           | `05f2cc70241d1e2767fc63cf1b0192bddaa27bf496a0ab4b655de4b676c5b6f2` |
| `create-lumal-admin` | 否           | `165c06524d9aa97fdeff80e7d77165b217a5abc249e638f2c2cf5369a648ca0b` |

未安装的五包不因此获得“省级真实消费者通过”的结论；其独立模板/公共包测试是另一层证据。
候选lockfile的SHA256为
`09f3de4646ff982ed9e76595ef9a1632c570762649c6e0ce6536f975e292f4b8`，
完整lock仍只留临时目录，避免把业务依赖与本机路径提交到公开仓库。

| 检查         | 实际命令/条件                             | 最终候选结果                                    | 对照结论                               |
| ------------ | ----------------------------------------- | ----------------------------------------------- | -------------------------------------- |
| 首次候选安装 | `corepack pnpm install`                   | 通过，6.500s                                    | 先更新lock，不伪称首次frozen可用       |
| 独立锁定复装 | `corepack pnpm install --frozen-lockfile` | 通过，0.762s                                    | 候选lock可复现                         |
| Lint         | `corepack pnpm run lint`                  | 通过，8.512s                                    | 无新增业务源码错误                     |
| TypeScript   | `corepack pnpm run typecheck`             | 通过，9.897s，0个TS错误                         | 现有公开API接入可编译                  |
| 原单元测试   | `corepack pnpm run test:run`              | 退出1，123.607s；38/41 files、474/480 tests通过 | 七个FAIL标题与基线逐字一致，无新增失败 |
| 生产构建     | `corepack pnpm run build`                 | 通过，12.929s；Vite自身11.89s                   | 无patch的真实业务bundle可生成          |

候选首次lint因辅助脚本写出的临时overrides YAML键顺序/引号报10个格式错误，
定向执行 `pnpm exec eslint pnpm-workspace.yaml --fix` 后复跑通过，并再次frozen复装确认。
仅格式化隔离副本配置，没有修删业务测试或业务源码。
原六项失败和部署suite加载错误仍保留，不能将“无新增失败”写成“全部通过”。
计时来自本次进程，存在缓存、并发和机器负载差异，不作为性能提速结论。

| 产物         | 基线 raw bytes | 候选 raw bytes | raw变化 | 基线 gzip bytes | 候选 gzip bytes | gzip变化 |
| ------------ | -------------- | -------------- | ------- | --------------- | --------------- | -------- |
| JS，均50文件 | 3,769,485      | 3,770,672      | +1,187  | 1,202,677       | 1,203,085       | +408     |
| CSS，均5文件 | 721,073        | 722,181        | +1,108  | 132,156         | 132,249         | +93      |

两份manifest均为15项dependencies、18项devDependencies，未因升级强加新的直接框架依赖。
gzip按相同逐文件方式统计，合计增量501 bytes；不含静态资产，不代表首屏和运行时内存。
这次对照没有调整任何Lumal性能预算。

## 完整消费者升级状态

| 检查项                                            | 省级                                            | 小流域                           |
| ------------------------------------------------- | ----------------------------------------------- | -------------------------------- |
| manifest/公开入口/布局与请求源码                  | 已审计                                          | 已审计                           |
| CRUD、字典、权限形态                              | 10页只读审计                                    | 10页只读审计                     |
| 本轮公共请求/CRUD/视口脱敏契约                    | 有仓库回归证据                                  | 有迁移行为对应，不是直接兼容保证 |
| 真实项目 tarball 隔离安装、typecheck、test、build | 基线/最终候选均已执行，无新增失败；原门禁非全绿 | 未执行；整套迁移不属于本轮范围   |
| 真实后端认证、上传、生产权限、部署                | 未执行                                          | 未执行                           |
| 原 Dashboard 固定尺寸测试更新和真实布局验收       | 未修改，待业务升级                              | 不适用                           |

后续隔离副本应保留基线 lockfile、包清单、产物清单与原门禁结果，再仅替换待评估的公开包。
先正常安装生成候选 lockfile，再 frozen-lockfile 复装；tarball 的内部 Lumal 依赖同样定向替换，
不能偷偷从 registry 混入另一版本。不要用 workspace alias 代替独立包验证。
涉及私有 .env、上传资产和 Schema 的现场证据只留本机授权位置，不提交公开报告。
