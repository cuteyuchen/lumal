# Lumal 轻量框架审计

审计与整改日期：2026-10-16。基线版本：`0.0.2-beta`，整改收录于 `0.0.3-beta`。

发布准备补充：版本、文档和脚手架同步内容见 [更新日志](./changelog.md)。本文保留整改及版本准备阶段的历史验收范围，不作为实际发包成功的证明；发布结果以 npm registry 和仓库发布工作流为准。

## 0.0.3-beta 发布准备复验

本节记录版本准备后的重新执行结果，和下方整改阶段验收分开。九个公共包与内部依赖已统一为 `0.0.3-beta`，六个私有应用保留自身 `0.0.0`；执行本节验收时尚未提交、推送、打标签或执行 npm 发布。

脚手架使用 `core/minimal` 显式接入 UI、路由和权限，模板同步按标签刷新的版本、`cacheKeys`、关闭清理和会话隔离。构建时从脚手架 package.json 注入三个 Lumal 依赖的精确版本；源码占位符保留。

| 检查 | 本轮结果 |
| --- | --- |
| `pnpm test` | 619 项、91 个测试文件通过，含更新后的脚手架断言 |
| `pnpm typecheck` / `pnpm lint` | 均通过 |
| `pnpm build` | 九包及 Mock API 构建通过；脚手架依赖已注入 `0.0.3-beta` |
| Admin / Cockpit / DataV Guide / Compat build | 均重新通过；包含应用 vue-tsc |
| `pnpm docs:build` | 文档站通过，包含新更新日志、版本导航与安装指南 |
| `pnpm test:create-consumer` | 实际 tarball 的 minimal/request、local、HTTP 三条路径均通过；两模式生成版本均为精确 `0.0.3-beta` |
| minimal/request 严格消费 | 禁用 peer 自动补齐、不安装 Element Plus，`skipLibCheck: false` 类型检查与生产构建通过 |
| `pnpm release:boundaries` | 九包版本、内部依赖、日志分发、文档版本与 reference 单源检查通过 |
| `pnpm release:artifacts` / `pnpm release:budgets --require-all` | 通过；覆盖四个本轮重建应用 |
| `pnpm pack:dry-run` | 九包均通过，每包均包含 CHANGELOG |
| `pnpm install --frozen-lockfile --ignore-scripts` | 锁文件同步后通过 |
| `pnpm changeset:status` | patch / minor / major 均无待提升包；两份变更记录已汇总到九包日志，空记录只声明本次手工版本准备 |
| 浏览器 / E2E / 实机视觉 | 按要求未执行，未运行含 E2E 的完整 `release:check` |

本轮预算数据：minimal 相对 Vue 增量仍为 2530 bytes gzip，request 为 2346 bytes；Admin、Cockpit、DataV Guide、Compat 首屏 JS 分别为 306076、701335、413960、268682 bytes gzip，均在预算内。

本机验证仍为 Node `24.14.1`、pnpm `10.33.0`，工作区 Vite `8.1.4`。独立消费者按生成模板声明重新解析外部依赖，使用 Vite `8.3.4`，不把它的体积与工作区固定工具链预算直接比较。Cockpit / Guide 保留大引擎块警告；Windows Sass bin、Node shell 参数弃用及无 UI 消费缺少 Iconify peer 的提示未阻止安装、类型检查和构建。本轮没有为消除环境提示扩大依赖升级范围，也不替代 Node 22 CI 和浏览器发布验收。

## 结论

**本次列出的 14 项问题均已修复，并通过代码测试、类型、构建和消费者体积验收。作为按需装配的轻量 Vue 后台工具集，已达到本轮轻量化与正确性验收标准。**

轻量定位有明确前提：使用 `@lumal/core/minimal` 或独立服务、组件子入口；根入口保留便利型默认 UI 注册表，不能把根入口的 `preset: 'minimal'` 等同于依赖隔离。新的轻入口只比 Vue 基线增加 2.530 KB gzip，不安装 Element Plus 也能独立通过严格类型检查与构建。

没有增加第二套状态管理、请求库或构建编排平台。缓存失效、视图生命周期、异步隔离、可选引擎、消费端门禁及文档单源均已落地；无调用的私有自动播放 helper 已删除。保持兼容层、Mock API 和 Devtools helper 的现有边界，不扩充为新的平台。

以下“整改完成矩阵”“整改后体积”和“整改后验收”描述当前工作区；原问题条目、原行号与旧测量保留为**整改前证据**，不表示缺陷仍然存在。本轮未做浏览器或实机验证，因此不据此宣称已完成全部稳定发布验收。

## 范围与方法

覆盖 9 个公共包、6 个私有应用，以及构建、发布、脚手架、CI 和文档入口：

| 范围 | 核查重点 |
| --- | --- |
| `core` | 启动注册、鉴权与刷新、请求缓存、字典、路由注册、菜单、标签、视图缓存、主题、Schema、CRUD、工具函数 |
| `icons` / `icons-vue` | 注册订阅、直接传入图标、SVG 信任边界、静态注入插件、选择器与弹窗 |
| `charts` / `datav` | 引擎依赖、升级兼容、事件、更新、尺寸监听、动画与清理、组件子入口 |
| `cockpit` | 注册表、模块 Host、消息订阅、自动刷新、配置校验、设计器草稿、运行时与设计器分包 |
| `vben-compat` | 表单和表格适配、响应式配置、异步查询 |
| `vite` / `create-lumal-admin` | resolver、alias、插件接线、生成模板、发布包独立消费 |
| 应用与工程 | Admin 会话和系统流程、Cockpit 引擎隔离、DataV 文档应用、Mock 服务、文档、CI、产物门禁 |

采用入口与依赖追踪、高风险实现精读、全仓静态扫描、现有测试、真实引擎 SVG 集成测试、无浏览器的最小构建及定向复现。几何模板、重复示例与样式主要按结构、依赖和既有测试核对。这不是逐行无遗漏证明，也不覆盖真实浏览器布局、GPU、Canvas/WebGL 性能及渲染外观。

仓库有 `.codegraph`，但本机 CLI 和 MCP 均不可用，本次回退到文件与符号检索。没有运行浏览器、Playwright 或实机视觉测试。

## 升级结果

| 位置 | 升级后 |
| --- | --- |
| Charts 开发依赖、Admin、Cockpit | `echarts ^6.1.0`、`vue-echarts ^8.3.2` |
| DataV 开发依赖及指南应用 | `echarts ^6.1.0` |
| Charts peer | `echarts ^6.0.0`、`vue-echarts ^8.0.0` |
| DataV peer | `echarts ^6.0.0` |
| 锁文件实际解析 | ECharts `6.1.0`、vue-echarts `8.3.2`、ZRender `6.1.0` |

安装说明、迁移提示和 Changeset 已同步。只支持新的主版本组合，不继续宣称兼容 ECharts 5 / vue-echarts 7。

ECharts 6 的默认主题、图例及标签布局变化交给应用按需适配，本包没有偷偷强制恢复旧主题。vue-echarts 8 的智能更新行为通过真实系列删除测试验证。

新增 4 项真实运行测试：

- `packages/charts/tests/runtime.test.ts`：SVG 渲染与销毁、删除旧系列、显式 `notMerge` 更新。
- `packages/datav/tests/echarts-runtime.test.ts`：DataV 的 ECharts 扩展入口真实渲染、更新与销毁。

参考资料：ECharts Handbook 的 `v6-upgrade-guide`，以及 `ecomfe/vue-echarts` 的 `v8.3.2` README 和 peer 声明。测试使用 SVG 和确定性文本测量，不用模拟引擎来替代升级验收。

## 整改完成矩阵

| 编号 | 当前实现 | 回归或验收证据 |
| --- | --- | --- |
| 1 | 新增 `core/minimal`，不引用默认 UI 注册表，组件只能显式映射，字典默认关闭；根入口保持兼容 | 启动测试、tarball 无 Element Plus 消费、`skipLibCheck: false` 类型检查、最小入口体积门禁 |
| 2 | 默认仅缓存 GET；非 GET 需显式 key；Token 与请求钩子先于缓存，身份/租户隔离，`clearCache()` 使旧在途结果失效，Token 不进入存储 key | request-client 测试覆盖切换身份、不同客户端共享存储、请求体、作用域、取消与在途清理 |
| 3 | `cacheKeys` 联通标签准入和剔除；按标签版本刷新；默认最多 20 项；遵守 `meta.keepAlive=false`；移除旧的 loaded key 集合 | 真实 Vue Router / KeepAlive 代码测试覆盖关闭、刷新、容量与生命周期 |
| 4 | 字典 set/remove/clear 均使旧请求失效，按 Promise 身份约束回填、错误和 finally | 延迟 Promise 回归覆盖删除重载、清空、手动覆盖和旧请求结束 |
| 5 | VChart 接收图表事件；动画优先级为 prop > option > reduced-motion 默认；仅保留 vue-echarts 的 autoresize | 真实引擎 SVG 与组件代码测试；关闭 autoResize 时不再添加额外 window 监听 |
| 6 | 静态 SVG 插件跳过自身代理模块的解析 | 虚拟 manifest + 真实 Vite build 集成测试 |
| 7 | 按 source 区分直接传入的 component/Iconify/local-svg 定义 | 三种直接 IconDefinition 与注册模式组件测试 |
| 8 | 驾驶舱注册表改为浅响应式 Map，注册增删可使 Host 计算更新，组件定义不深代理 | registry/computed 回归测试 |
| 9 | 消息处理器的同步异常与 Promise rejection 均隔离，增加 `onError` 观察入口 | 异步失败不阻断其他订阅的代码测试 |
| 10 | 兼容表格查询增加请求代数和作用域销毁保护，旧结果不改 rows/error/loading | 逆序完成、逆序失败与 scope dispose 回归测试 |
| 11 | Esc 统一更新最大化状态；新窗口采用 Router 的 href | Layout 组件、hash history/base 地址测试 |
| 12 | 区分 auth storage 与真实 sessionStorage；先恢复快照再写入，恢复限量，卸载不写回；退出清理字典和请求缓存，换用户重建壳层 | Layout 快照生命周期、Admin session/App 测试；会话清理回调独立成模块以消除初始化循环 |
| 13 | DataV 通用图表按当前模式动态加载引擎，加载带代数和卸载保护 | 两套引擎组件测试、真实 ECharts SVG、静态首屏闭包与禁止引擎检查 |
| 14 | 接通 chartWidth/tableWidth 样式；导航反馈接真实 Router；补齐 Teleport、焦点约束/恢复及 useTemplateRef；补齐 resolver 清单，文档限定可信 SVG | SCSS 编译和 DOM 契约、导航等待/完成/取消/错误、真实 Teleport 代码测试、公开组件清单对照 |

同时完成了三项收敛：共享现有 Core 内存 Storage 工具；脚手架直接生成最终依赖和 tsconfig；合并 SVG 动画暂停接线，并让 KeepAlive 失活暂停 ActiveRing 轮换。长文仅维护 `docs/*.md`，文档站 reference 通过 include 消费，发布边界检查阻止副本重新出现。

## 体积实测

环境为 Windows、Node `24.14.1`、pnpm `10.33.0`、工作区 Vite `8.1.4`。以下 KB 均为 1000 bytes；gzip 使用 Node `gzipSync`。数据是静态资源大小，不是网络加载时间或性能跑分。整改后数据来自重新构建的产物，旧数据单独保留。

### 整改后最小消费者

运行 `pnpm release:budgets` 可复测。脚本独立构建发布产物消费者，统计入口的静态闭包，并检查模块来源；动态 import 的引擎不计入初始闭包，但实际使用相应模式时仍需下载。

| 消费方式 | 初始 JS gzip KB | 门禁 |
| --- | ---: | --- |
| 仅 Vue `createApp` | 23.303 | 比较基准 |
| `@lumal/core/minimal` | 25.833 | 相对 Vue 增量 2.530 KB，预算 <= 10 KB；不静态包含 UI/图表引擎 |
| `@lumal/core/request` | 2.346 | <= 5 KB；不静态包含 UI/图表引擎 |
| DataV `charts` 的 config 消费者 | 26.398 | 初始 <= 55 KB；不静态包含两套引擎 |

另外通过 tarball 安装到独立临时项目，关闭 peer 自动补齐且不安装 Element Plus，以 `skipLibCheck: false` 验证 minimal/request 的公共类型和生产构建。完整 UI 入口仍需要对应的可选 peer；独立安装通过不代表 UI 组件可以在缺少 UI 依赖时使用。

### 整改后应用产物

全部从最新 `dist/index.html`、modulepreload 与静态模块边统计；不计入动态 import 闭包。CSS 按 HTML 引用统计，不能替代浏览器按路由加载实测。

| 应用 | 首屏静态 JS gzip KB | 首屏 CSS gzip KB | assets 全部 JS gzip KB | JS / CSS 预算 KB |
| --- | ---: | ---: | ---: | --- |
| Admin | 306.076 | 41.927 | 546.911 | 335 / 50 |
| Cockpit | 701.335 | 70.851 | 2013.203 | 800 / 80 |
| DataV Guide | 413.966 | 45.620 | 863.661 | 850 / 55 |
| Vben Compat Demo | 268.682 | 39.798 | 268.682 | 300 / 45 |

`pnpm release:budgets --require-all` 要求四个应用都有构建产物，CI 的站点构建任务已接入。Admin 最大 JS 块仍为 385877 bytes；图表未进入其首屏。Guide 不再静态加载 ECharts，首屏 JS 从旧基线的约 814 KB 降至约 414 KB；全部 JS 合计并未因此消失，因为引擎仍可按需加载。

Cockpit 的 Cesium 异步块仍约 4.09 MB，Guide 的 ECharts 异步块约 1.13 MB，两者仍有 Vite 大块警告。这些是应用演示的可选引擎成本，不是 minimal 入口成本；未通过提高 chunk 告警阈值来隐藏它们。

### 最小消费者：整改前证据

通过 Vite 虚拟入口消费已构建的发布产物，`configFile: false`、`target: es2022`、生产压缩、`write: false`。除 request 子入口外，均包含 Vue 和一个实际挂载入口；不导入样式，不包含业务代码。

| 消费方式 | JS 原始 KB | JS gzip KB | 结果 |
| --- | ---: | ---: | --- |
| 仅 Vue `createApp` | 60.17 | 23.40 | 比较基准 |
| `createLumalAdmin` + `preset: minimal` | 801.74 | 253.83 | 包含 Element Plus、Sortable |
| 上项再加 `components: false` | 801.75 | 253.83 | 并未变轻 |
| 仅 `core/request` | 4.67 | 2.10 | 不含 Element Plus、Sortable |
| 仅 DataV `border-box` 子入口 | 88.91 | 30.51 | 不含两套图表引擎 |
| 仅 DataV `digital-flop` 子入口 | 68.54 | 26.61 | 不含两套图表引擎 |
| DataV `charts`，只使用 `config` 模式 | 1317.48 | 426.64 | 仍同时包含 ECharts 与 DataV 引擎 |
| `LumalChart` 包装器，尚未注册图表类型 | 372.36 | 128.06 | 包含 ECharts 核心，不含 DataV 引擎 |

不要把 `core/dist/index.js` 的约 4 KB 当成 Core 的完整成本，它还静态引用了其他产物。相反，DataV 的独立子入口确实能避开引擎，应保留这一设计。

### 应用产物：整改前证据

从实际 `dist/index.html` 的模块入口、modulepreload 出发，使用 TypeScript AST 递归统计静态 import/export 闭包，另计 HTML 引用的样式；动态 import 不计入首屏闭包。

| 应用 | 首屏静态 JS gzip KB | 首屏 CSS gzip KB | assets 下全部 JS gzip KB |
| --- | ---: | ---: | ---: |
| Admin | 304.92 | 41.93 | 545.95 |
| Cockpit | 731.05 | 70.85 | 2009.84 |
| DataV Guide | 814.13 | 45.62 | 859.85 |
| Vben Compat Demo | 267.73 | 39.80 | 267.73 |

这是静态资源闭包，不是特定登录后页面的请求瀑布。Cockpit 的 Cesium Workers 等复制目录不在上述 assets JS 合计中，也不能算作初始页面必然加载的资源。

整改前 Admin 最大 JS 块为 385877 bytes，图表没有进入其首屏静态闭包。Cockpit 的 Cesium 异步块约 4.09 MB、ECharts vendor 约 1.12 MB；DataV Guide 的最大块约 1.42 MB。应用示例成本不能直接等同公共框架成本。

## 整改前问题清单

以下 14 项均已完成整改，当前结果见上方矩阵。保留的路径行号、复现描述和建议对应整改前代码，用于追溯问题来源；不应当把它们当成当前缺陷或本次依赖升级造成的回归。

`P1` 表示应优先处理的发布或轻量定位阻碍，`P2` 表示明确的条件性缺陷或可靠性问题，`P3` 为清理与维护建议。“已复现”指本次执行了代码或构建复现；“静态确认”不代表已经运行用户端交互。

### 1. P1 最小启动入口没有真正隔离 UI

位置：`packages/core/src/app/createLumalAdmin.ts:9`、`:18`、`:64`，`packages/core/src/app/default-components.ts:1`。

`minimal` 仍默认注册全部组件；即便显式 `components: false`，启动模块仍静态引用整份组件注册表。产物保留 Element Plus 与 Sortable，实测最小 JS gzip 从 23.40 KB 变为 253.83 KB。**已构建复现。**

建议保留便利型默认入口，另外提供不导入默认注册表的轻启动入口；全局组件由消费者显式传入或导入。仅修改布尔开关默认值不能解决静态依赖问题。相应补上“不安装 UI peer 的纯服务消费”和“最小入口不含 UI”的构建测试。

`core` 和 `cockpit` 的 Element Plus 虽声明为 optional peer，但实际使用 UI/运行时入口仍需要它；不能把 optional 解释为所有入口均可不安装。

### 2. P1 开启缓存后，不同身份和请求体会错误命中

位置：`packages/core/src/request/client.ts:181`，`packages/core/src/request/types.ts:51`。

默认 key 只有 `method:url`，而且在获取 Token、执行请求钩子之前就返回缓存。A 用户缓存 `/profile` 后切换为 B，仍读到 A 的结果；同地址 POST 的不同 body 也命中同一结果，和类型注释“默认仅 GET”不一致。**两种情况均已复现。缓存默认关闭，默认请求流程不受此问题影响。**

建议默认只允许 GET 缓存；支持显式的会话/租户作用域和失效机制，退出、切换账号时清理。非 GET 缓存要求明确的 key 或拒绝启用，避免尝试自动序列化所有类型的请求体。不要直接用明文 Token 做可持久化 key。

### 3. P2 标签关闭、刷新与 KeepAlive 生命周期未贯通

位置：`packages/core/src/layout/LumalRouterView.vue:30`、`:101`，`apps/lumal-admin/src/App.vue:49`、`:169`，`packages/core/src/theme/preferences.ts:45`。

视图只接收 `cache` / `cacheMax`，没有当前有效标签 key 清单或剔除接口，也不读取 `route.meta.keepAlive`。默认偏好开启缓存且 max 为 0，即不设上限。刷新通过增加 viewKey 建立新缓存项，关闭标签不会主动剔除旧实例。**静态确认；未做浏览器内存测试。**

建议把标签身份、路由视图 key、缓存准入/剔除和刷新策略形成一个明确契约，并设置合理的有限缓存默认值。组件失活不等于销毁，业务轮询还需要配合 `onActivated` / `onDeactivated` 暂停。另一个 `loadedViewKeys` Set 也应随缓存项失效清理。

### 4. P2 字典清理不能使在途请求失效

位置：`packages/core/src/dictionary/store.ts:45`、`:66`、`:72`；调用方 `apps/lumal-admin/src/services/dictionary.ts:24`。

`clearDictionary()` 后，旧请求仍可把数据重新写回；`removeDictionary()` 后立即 reload 会复用原 pending 请求而非重新拉取。clear 后开始新请求时，旧请求 finally 还可能删除新请求的跟踪。**前两种情况已用延迟 Promise 复现，后一种由实现静态确认。**

建议按字典 key 维护请求代数，并在 finally 校验当前 Promise 身份。删除、清空、手动 set 都应明确是否使旧请求失效。Admin 会话重置也应清理字典上下文。

### 5. P2 基础图表的事件、动画和尺寸开关契约不一致

位置：`packages/charts/src/LumalChart.vue:31`、`:60`、`:74`，`packages/charts/src/useChartResize.ts:72`；使用方 `apps/lumal-admin/src/views/examples/ChartView.vue:55`。

**三项均已通过真实引擎/DOM 代码复现：**

- `@click` 落在外层 div，收到的是 `MouseEvent`，不是 ECharts params；实际 ECharts click 没有转发，示例中的数据点反馈无法正确工作。
- `options.animation: false` 在不传独立 `animation` prop 时被覆盖成 true。
- `autoResize: false` 仍安装 window resize 监听；开启时又和 vue-echarts 自带 autoresize 重复。

建议明确转发哪些 attrs 和事件到 VChart；动画优先级应区分显式 prop、option 与 reduced-motion 默认；组件内部只保留一套自适应实现。公开 `useChartResize` 可以继续服务消费者的其他图表实例，不必因此删除 API。

### 6. P2 静态 SVG 注入插件会代理回自身

位置：`packages/icons/src/vite/static-local-svg-icons.ts:43`、`:64`。

插件将 `@lumal/icons` 替换成虚拟模块，而生成模块又从同一标识 import/export，继续被相同 resolveId 捕获。真实 Vite 构建报 `registerIcons` / `registerStaticLocalSvgIcons` 缺少导出。现有测试检查了字符串协议，没有覆盖最终构建。**已构建复现。**

建议跳过代理模块自身的解析，或预先解析并引用真实包入口；补一个虚拟 manifest + 真实打包的集成测试。

### 7. P2 直接传入 IconDefinition 无法正常渲染

位置：`packages/icons-vue/src/components/LumalIcon.vue:33`、`:51`、`:104`。

SVG 解析的中间分支返回空字符串，`??` 不会继续到对象 `svgText` 分支；对象又可能被当成 Vue component，优先级挡住 SVG/Iconify 分支。直接传入合法 local-svg 定义，渲染结果为空。**已在 JSDOM 中复现；name 注册模式正常。**

建议先按图标定义的 source 归一化，再分别渲染 Vue component、Iconify 和 SVG；补齐三种 source 的直接 props 测试。

### 8. P2 驾驶舱动态注册不会更新已求值的视图

位置：`packages/cockpit/src/registry/createCockpitRegistry.ts:6`，`packages/cockpit/src/runtime/LumalCockpitWidgetHost.vue:23`。

普通 Map 没有响应式版本，Host 的 computed 求值为缺失后，稍后 register 不会使其失效；unregister 同理。**用 computed 和真实 registry 已复现。**

建议复用 icons 的“纯内核订阅 + Vue 适配”模式，或明确采用只读、挂载前一次性注册的契约。不要同时暴露动态修改 API 又让视图无法观察变化。

### 9. P2 消息总线只隔离同步异常

位置：`packages/cockpit/src/messaging/createCockpitMessageBus.ts:44`，使用方 `apps/lumal-cockpit/src/composables/useDemoRefresh.ts:15`。

类型返回 void 不会阻止 TypeScript 接受 async handler；当前应用也实际传入 async。publish 的 try/catch 不处理返回 Promise，其 rejection 会成为未处理异常。**通过 Node `unhandledRejection` 已复现。**

建议保持 fire-and-forget API，仅为返回的 Promise 增加 rejection 隔离并提供错误观察入口，不必扩建成异步任务平台。

### 10. P2 兼容表格存在异步查询竞态

位置：`packages/vben-compat/src/grid/useVbenVxeGrid.ts:79`。

两次 reload 后，先返回的新查询结果仍会被后返回的旧查询覆盖，旧请求也能提前关闭 loading。**用逆序完成的 Promise 已复现。**

Core 的 `usePagination`、`useCrudData` 已有请求代数保护，兼容层按同样方式补齐即可，不需要发明新的请求状态抽象。

### 11. P2 最大化恢复与新窗口 URL 有明确边界错误

位置：`packages/core/src/layout/LumalLayout.vue:619`、`:638`，`packages/core/src/layout/LumalTabs.vue:521`。

Esc 只更新 Tabs 内部状态并 emit，没有重置 Layout 的 `isContentMaximized`；Tabs 的 `setMaximized` 本身不 emit，因此壳层仍保持最大化。新窗口默认取 `router.resolve(path).fullPath`，丢失 hash history / base 的 href 语义，Admin 本身使用 hash history。**沿调用链静态确认。**

建议 Esc 复用统一的最大化变更函数；默认地址使用路由解析的 href。两者均可通过组件/内存或 hash router 代码测试覆盖，无需浏览器。

### 12. P2 会话退出时标签快照使用了错误的存储对象

位置：`apps/lumal-admin/src/services/session.ts:41`、`:81`，`packages/core/src/layout/LumalLayout.vue:364`、`:496`。

应用把返回 localStorage 的对象命名为 `sessionStorage`，退出时实际删除 localStorage 中的标签 key；Layout 保存的是浏览器 sessionStorage。并且 Layout 卸载还会写入快照，因此只修变量遮蔽也不足以保证最终清理。**静态确认，未做跨账号浏览器流程测试。**

建议区分 token/user storage 与 tab storage，在壳层重置和卸载顺序中保证清理，或让快照 key 带用户作用域。此项并不意味着可以绕过服务端权限。

### 13. P2 DataV 通用图表同时静态加载两套引擎

位置：`packages/datav/src/components/LumalCharts.vue:11`、`:12`。

`config` 和 `option` 只在运行时分支选择，但两个引擎均为静态导入；即便只用 DataV config，消费者 JS gzip 仍约 426.64 KB。**已构建测量。**

建议保留 DataV 原生兼容路径，把 ECharts 扩展作为独立入口或明确的异步适配，或统一交由 `@lumal/charts` 承接。需要兼顾 ActiveRingChart 当前的 ECharts 使用，不能直接删除 import 了事。继续保留不依赖引擎的组件子入口。

### 14. P3 失效选项、可信输入和无障碍需要收口

- `packages/charts/src/panel-style.ts:34`：chartWidth/tableWidth 只设置变量，全仓没有 CSS 消费，不能把变量存在的单测当成功能验收；应接通布局，或废弃这两个 props。
- `packages/core/src/layout/LumalRouterView.vue:64`：进度和 loading 固定显示 520ms，不反映路由加载完成/失败；应接真实导航状态，或删去伪加载态。
- `packages/icons-vue/src/components/LumalIcon.vue:106`：SVG 使用 v-html，注册和渲染并不自动执行校验；文档应限定为可信静态资源。`validateMonochromeSvg` 是有限格式检查，不是完整安全净化器。若将来接受用户上传或远程 SVG，再按该信任边界评估净化方案。
- `packages/icons-vue/src/components/LumalIconPickerDialog.vue:24` 和 `packages/datav/src/components/LumalFullScreenContainer.vue:25` 仍以 ref 充当模板引用，不符合本仓 useTemplateRef 约定。
- IconPickerDialog 的自制 modal 缺少焦点约束、焦点恢复和 Teleport；Core GlobalSearch 也未约束弹窗内焦点。Core 可复用现有 Element Plus Dialog；独立 icons-vue 不应仅为此强加 Element Plus。
- `packages/vite/src/component-resolver.ts` 未覆盖若干已经公开的组件，如 Breadcrumb、GlobalSearch、AccessControl 和 ThemeSettingsPanel；优先用导出清单测试防止继续漂移。

## 值得保留的设计

- Core 不默认依赖 ECharts、地图、国际化或 VXE；业务接口与系统管理页面留在应用侧。
- DataV 和 Charts 不反向依赖 Core，DataV 组件子入口实测有效；Cockpit 不内置具体地图引擎。
- Schema Form/Table 有泛型和类型用例，字典值索引避免逐单元格重复查找。
- 菜单路由运行时有冲突校验、单飞、请求代数、失败回滚和 dispose 语义；不应为了减少行数删掉这些保护。
- Request 已提供错误分类、AbortSignal、单飞刷新和有限重放；无需再引入 Axios 来替换已经可控的 fetch 方案。
- CRUD 数据层已有异步代数保护、选中态与对话框逻辑分离；应补齐其他模块的不一致，而非全盘重写。
- Cockpit 的运行时/设计器入口、错误边界、实例订阅清理，以及地图实例的卸载清理值得保留。
- 发布边界、类型测试、tarball 独立消费、Windows CI、Changesets 已具备实际工程价值。

## 功能增减与处理

### 已新增或补齐

| 能力 | 落地方式 | 为什么值得做 |
| --- | --- | --- |
| 真正轻量的启动入口 | 不静态引用全局组件表，允许显式注册 | 直接兑现 minimal，而不是再加一个开关 |
| 缓存失效契约 | 请求作用域、字典请求代数、退出清理 | 修正确性，不是扩展缓存平台 |
| 标签与视图缓存联动 | 准入、删除、刷新、有限容量 | 防止长期使用持续保留旧实例 |
| 消费者体积门禁 | 最小入口、静态首屏闭包、gzip 基线 | 检查用户真正下载的内容 |
| 少量真实依赖契约测试 | 插件实际 build、引擎 SVG、必要真实控件 | 补齐 mock 与源码字符串测试的盲区 |

最小启动增量 <= 10 KB gzip、request <= 5 KB gzip 已作为可执行内部预算落地，并通过本轮验收；原有单块检查继续保留。这些是当前测试场景的回归预算，不是任意业务应用的体积承诺。

### 已减少或合并

- 默认全局组件注册已退出独立 minimal 路径，保留便利型入口，不取消已有消费者体验。
- DataV 改为按模式异步加载引擎；图表重复 resize 和伪路由 loading 已移除。
- Vben compat 保持迁移子集，不发展成另一套 Vben/VXE 框架；无需补全所有历史 API。
- Mock API 保持演示用途，不扩大成正式后台；其默认密钥、公开测试账号、明文演示密码和内存沙箱不能被当作生产认证方案。
- 文档改为 `docs` 单源，站点 reference 通过 include 复用；已合并 `datav-examples.md` 的差异，并保留根目录较新的 cockpit 规格。
- 路线图基线已更新到 `0.0.2-beta`，架构文档明确 serve 用源码 alias、production 用包产物；DataV 统一表述为“15 个导出组件，含边框/装饰等合计 38 种形态”。

复杂度审查的处理：

`delete:` 已删除无调用、无公开出口的 `packages/datav/src/composables/usePausableAutoplay.ts`，未删除公开 API。

`shrink:` BorderBox、Decoration 复用现有 SVG 暂停 composable，保留组件特有行为，同一 tick 的 DOM 同步合并执行。

`shrink:` 脚手架在 scaffold 中直接生成完整 package/tsconfig，create.ts 只保留兼容 re-export；未引入模板管理平台。

`shrink:` 内存 Storage 兜底收敛到现有 Core utils，Auth 与各应用复用；未新建公共包。

`yagni:` Devtools 一行接线 helper 和公开 API 保持不变，不扩展为插件管理系统。

没有新增运行时依赖。旧 helper 删除 78 行；其余改动同时包含必要回归测试，不把文档去重或测试增加包装成运行时性能收益。

### 暂不新增

不要默认加入地图/三维引擎、微前端平台、完整低代码设计器、流程引擎、多租户业务 SDK、完整国际化平台或第二套基础控件。确有业务需求时由应用实现或作为独立可选包，不进入 Core 默认路径。

## 后续维护边界

1. **正确性与轻量入口已完成。** 缓存隔离、字典竞态、图表契约、图标 props/插件、最小入口均有回归保护。
2. **长期运行契约已完成。** 标签缓存、最大化、URL、会话快照、兼容层竞态、消息异步错误和动态注册均已处理。
3. **本轮收敛已完成。** 引擎按需加载、消费者预算、失效 props、文档、模板和私有无调用代码均已处理。
4. **后续按真实业务决定新增。** 不以“组件齐全程度”作为轻框架的主要指标。

大文件拆分和重复构建次数属于后续维护建议，不是未修复缺陷。本轮仅抽出共享应用创建与会话清理依赖等有实际边界价值的部分，未为追求行数拆散稳定模块。CRUD、Tabs、Layout、SchemaTable、router、scaffold 和 Mock system 后续应在相关功能变动时按既有职责整理；不机械拆成每个文件一两个函数，也不引入新的构建编排依赖。

## 整改后验收

| 检查 | 结果 |
| --- | --- |
| 全仓代码测试 | 619 项、91 个测试文件通过；整改前升级基线为 588 项、87 个文件 |
| 全仓 typecheck | 通过；Admin 与 Compat 另由应用 build 执行 vue-tsc |
| 全包 build | 通过 |
| Admin / Cockpit / DataV Guide / Compat build | 均通过，Cockpit 和 Guide 保留大块警告 |
| 文档站 build | 通过 |
| 全仓 ESLint | 通过 |
| release:boundaries / release:artifacts / release:budgets --require-all | 通过，覆盖文档单源、新 minimal 产物与四个应用的最新静态闭包 |
| minimal/request tarball 独立安装、类型、构建 | 不安装 Element Plus、禁用 peer 自动补齐、`skipLibCheck: false`，通过 |
| 脚手架 tarball 独立生成、安装、构建 | 通过，覆盖默认 local 模式；本轮未增加 HTTP 模式独立消费验收 |
| 九个公共包 pack --dry-run | 通过，未发布包 |
| frozen-lockfile | 通过，校验安装使用 `--ignore-scripts` |
| Changeset 状态 | 可解析；升级与整改各有记录，fixed 策略会使九个公共包一起 minor |
| git diff --check | 通过，仅有现有 Windows CRLF 转换提示 |
| 浏览器 / E2E / 实机视觉 | 按本次要求未执行 |

安装过程中出现既有 Windows Sass bin 警告，最终构建成功；独立消费者禁用 peer 自动补齐时也会提示未安装可选 UI 链上的 Iconify peer，但严格类型与最小构建均通过。没有为消除警告扩大升级范围。当前环境验证为 Node 24，不替代 CI 的 Node 22 发布验收。上述命令按需分别执行，未运行包含 E2E 的完整 `release:check`。

整改后的永久回归测试验证正确行为，不保留“期待错误行为”的缺陷复现断言。真实引擎测试采用 SVG 和确定性文本测量；SCSS、JSDOM、Router、Teleport 与独立构建验证均不替代真实浏览器的视觉、GPU 或长期内存测量。
