# 更新日志

## 未发布 (2026-10-28)

- 修复进入 `examples/viewport` 时整页 vw 意外失效：示例改用 flow-only 路由边界，
  Header、侧栏、工具栏、模拟宿主及浮层继续适配；内部画布独立绑定单位与设计字号，
  contain/width 下仍避免双重缩放，并覆盖深链、往返导航及模式切换回归。
- Admin `vw 流式` 补齐整页适配：Header、侧栏、字号/行高、主题、最小尺寸、细边框和
  body 浮层共用浏览器宽度单位，CSS/JS 断点同步，Dashboard 数值列宽显式计算；
  保留响应式默认、独立 DataV/Cockpit 画布整页回退与标签缓存，不 transform 整页。
- `@lumal/vite` 新增默认关闭的 `variableFallbacks` 与 `mediaQueries`，
  分别处理已核对的变量 fallback/尺寸约束和根模式下的媒体/容器宽高断点；
  支持编译后的范围查询，不放宽原子化、来源或第三方依赖保护。
- Core 增加可选主题 `cssLength`、Layout/Tabs `responsive`，图标数字尺寸支持协作单位，
  默认 px/响应式行为和字符串图标尺寸不变，不改 Viewport 公共 API。
- 补充独立 Vue tarball 场景及 Admin Dev/Build 的真实80%～200%页面缩放检查，
  验证布局、菜单定位/点击、抽屉、表格和侧栏，不使用 CSS zoom/DPR 模拟。

- 补齐共享 Dropdown 主题样式，恢复 Admin Header 适配菜单的整行点击、悬停与焦点反馈；
  显示当前模式，并以真实 Element Plus / Teleport 组件测试覆盖鼠标与键盘切换。
- Admin Header 工作区菜单补充 `vw 流式`，接入共享设计宽度及自有页面的协作转换；
  保留原画布模式、标签缓存和第三方/自管理视口隔离，不再只有独立示例可体验 vw。
- 修正运行时 `vw` 的浏览器宽度语义：宽高共用 `window.innerWidth / designWidth`，
  保持流式布局，不按容器宽高分别换算、不 transform 整页；实际容器测量继续保留。
- `@lumal/vite` 新增可选 `output: 'runtime'`，与局部单位协作，在 vw 外恢复设计 px，
  切换 responsive/contain/width/disabled 不叠加缩放；默认直接 vw 输出保持兼容。
- `--viewport vw` 生成的 Screen 真正启用构建与 Vue 行内样式转换，共享设计尺寸；
  其他模式不增加构建依赖。Admin 视口示例补充 vw 及单层缩放演示。

- `@lumal/vite` 新增属性名单、选择器排除、声明忽略与独立 Vue 行内样式转换开关；保护原子化任意值类名及其 CSS 规则。
- 修复保留字号却缩小行高的问题，默认保护最小尺寸与已有适配表达式；保留文件、依赖、SCSS source map 和 Dev/Build 一致性边界。
- Screen 视口模板共享项目级设计尺寸，仅 vw 模式开启构建转换，不新增运行时公共函数。

上述内容属于待发布源码，不包含在已发布的 `0.0.6-beta` 中。包版本保持不变，
下一次正式版本准备时汇总 Changeset 并统一更新版本；本次不发布 npm、不部署生产。

## 0.0.6-beta (2026-10-25)

本版十个公共包已于 2026-10-25 发布，新增 `@lumal/viewport`。
正式标签的版本一致性、Ubuntu、Windows 和文档构建门禁，以及 registry 与同次发布产物核验均已通过，
具体来源和证据见 [本版执行记录](./npm-release-0.0.6-beta.md)。
十包 `beta` 指向本版，既有九包的 `latest` 保持 `0.0.1-beta`；
新增 `@lumal/viewport` 首次发布后的 `latest` 为 `0.0.6-beta`，本轮未部署生产。

### 工程与项目类型

- 通用 `create-lumal` binary 由 `create-lumal-admin@0.0.6-beta` 提供，
  保留旧命令；支持 Admin、独立 Screen 和仅依赖 Vue 的 Blank。
- Screen 登录、请求、路由、可视化和视口策略按需组合；HTTP 失败不回退演示，
  Local Demo 认证在生产禁用，不默认生成后台菜单或系统管理。
- 所有模板统一 ESLint/Prettier/TypeScript、LF、测试与 `check`、分层 `AGENTS.md`
  和开发规范；首次安装后再 frozen 复装验证，不虚构初始锁文件。

### 视口与公共能力

- 新增轻量 `@lumal/viewport`，仅 Vue peer，支持应用默认、页面和容器三级适配。
  响应式、完整等比、按宽度和容器尺寸单位独立于作用范围，不默认变换 DOM 根或地图。
- DataV/Cockpit 共享算法与尺寸生命周期，保留已有缩放函数和 Cockpit `external`。
  Vite 增加默认关闭、来源范围受控的 CSS 视口转换，Dev/Build 行为一致。
- Core 隔离会话切换、迟到 401、刷新/取消和写请求竞态；
  修复无 field 序号、跨页序号、选中导出及派生表单/字典过滤。
- DataV 修复静态首帧图表事件；视觉夹具固定尺寸与动画时点，
  保留原阈值并增加异步引擎、非空 Canvas 和跨加载一致性验证。

### Admin 与兼容

- CLI 使用 Clack 的方向键单选、Space 多选、默认值、参数预填和创建前摘要确认；
  CI、管道及不支持交互的终端自动使用非交互模式，取消与失败保留文件所有权回滚。
- 生成项目拆为 `app`、`modules`、`shared`；系统管理、开发示例和 Vben 迁移分别注册父子菜单，
  删除通过 `SystemEntityView` 切换七种资源的设计。
- 增加用户、角色授权、菜单树、机构树、字典分类/项、系统配置的独立页面和强类型服务，
  Local 实现关联、权限、引用和内置管理员保护，HTTP 保留真实请求与错误。
- 加固菜单组件自有属性白名单、递归权限、外链和 iframe 来源；权限重读失败清理旧授权，
  授权、资料写入后刷新失败明确显示部分成功并提供只读重试。
- standard 增加轻量工作台和个人中心，兼容预设保留 Vben 5.7.0 支持子集及历史入口，
  不增加 VXE、图表或大屏默认依赖。
- Core 主题移除上游删除的空样式入口，修复 Element Plus 2.14.7 下独立安装构建。
- 补齐真实 PTY、tarball、可选模块、生产导航及系统业务测试，并提供同锁文件基线比较脚本。

源码阶段的专项证据见 [脚手架重构验收](./scaffold-refactor-2026-10-23.md)、
[下一阶段报告](./lumal-next-phase-audit.md) 和 [视口隔离报告](./screen-viewport-verification.md)。
这些历史结果不替代本版正式标签的实际门禁；真实消费者原有失败、业务后台和部署边界继续保留。

## 0.0.5-beta (2026-10-21)

2026-10-20 完成九包版本、内部依赖及 lockfile 准备；2026-10-21 已提交并推送
`v0.0.5-beta`，正式门禁与九包发布命令全部成功。
10:36（北京时间）最终九包版本、beta、tarball、公开入口及发布日志校验和全部核验通过。
此前 Cockpit 的处理延迟与 8/9 失败记录保留，没有重发或修改标签。
九包 latest 仍为 `0.0.1-beta`，生产部署作业跳过，详见
[发布执行记录](./npm-release-0.0.5-beta.md)。

- 脚手架从巨型字符串拆为可组合文件模板，支持三预设、数据源/路由选择、
  可选业务层、非 TTY 默认、安全冲突检测和写入回滚。
- HTTP 应用服务接通真实认证、刷新、用户、权限、动态菜单、退出和 CRUD；
  会话代数和取消信号阻断旧请求回填，未配置后端不回退演示。
- standard 提供基础系统管理、原生 Schema/CRUD、标签缓存和偏好。
- 新增 Vben 5.7.0 `/v5` Form/Grid/权限子集与纯数据 `/v5/router`，
  保留根入口及 `/legacy`，不安装 VXE/Vben 全量运行时。
- 补齐真实 tarball 十二组合生产消费者、真实 HTTP 测试、Chromium 交互与统一体积测量；
  修复原生必填拦截、缓存模块身份和刷新生命周期问题。

兼容差异见 [迁移矩阵](./migration-from-vben.md)，源码基准见
[升级审计](./upgrade-audit.md)，最终数量、性能和未支持范围见
[升级验收](./upgrade-verification.md)。
本轮正式门禁实际为 115 个文件、908 项工作区测试、82 项生成项目测试及
28 项生产 Chromium E2E；另有三种真实 npm 消费者共 15 项测试、构建通过。

## 0.0.4-beta (2026-10-20)

九个公共包已于 2026-10-20 发布至 npm，版本统一为 `0.0.4-beta`，内部依赖和锁文件同步；`beta` 标签指向本版，`latest` 未改动。`v0.0.4-beta` 的完整门禁、805 项单测及 28 项生产 E2E 通过，发布后九包的 registry 版本、dist-tag、tarball 校验和与公开入口均核验通过。本轮未执行生产部署，凭据修复过程及实际结果见 [发布执行记录](./npm-release-0.0.4-beta.md)。

### Core 与示例修复

- 请求前 `onRequest` 可以改写真实 fetch URL；缓存、身份作用域、重复提交、错误回调和认证刷新重放统一使用最终请求上下文。
- `LumalRouterView` 以真实页面容器承接 Transition，支持多根路由页面，保留 KeepAlive、标签关闭/刷新、容量淘汰和 `meta.keepAlive=false` 语义；关闭动画不再启用 out-in。
- 修复内容最大化时的零宽度、退出登录竞态、系统表格插槽及多根页面导航；补充普通路由、403/404、缓存生命周期和会话回归。

### 图标

- 新增 `@lumal/icons/morph` 通用 SVG 转换与原生 DOM 形变控制器，Morphicons 2.0.0 为可选 peer，静态入口不加载动画引擎。
- `LumalIcon` 增加按需形变与弹簧预设，支持 SSR 静态渲染、减少动画偏好和失败回退；选择器增加分组插槽与标签换行，修复弹窗布局。
- Admin 增加离线图标示例、菜单图标选择和按需 Element Plus SVG 资源，保留资源许可；主题图标等待整页主题过渡完成后切换。
- 修复独立 SVG Data URI 的命名空间和内置设置图标；Vite alias 补齐 morph 的源码及产物入口。

### 发布链路

- 发布与部署统一由 Release Gate 的显式 needs 阻断；旧工作流仅保留 workflow_call，发布凭据作业之前执行版本、registry 和环境配置预检。
- 完整发布 E2E 改用 Admin dist 与 Mock Node 产物，保留失败截图、trace 和报告；开发态 E2E 入口继续保留。
- 五个站点统一使用 Vercel，文档旧 Cloudflare Pages 项目已下线；公开文档地址为 `https://lumal.cuteyuchen.top`，四个演示入口统一使用 `cuteyuchen.top` 下的专用子域名，Cloudflare 仅负责 DNS 解析。
- 增加图标 ESM/CJS、Vue SSR、原生 DOM 形变消费者和轻量入口边界检查，不提高现有体积预算。
- 发布边界扫描排除根目录诊断快照，保留源码检查，并补充四项真实 CLI 回归测试。

### 脚手架与同步包

- 脚手架生成的 Core 和图标依赖精确同步为 `0.0.4-beta`，保留 minimal/request、local 和 HTTP 三种独立 tarball 消费验收。
- Charts、DataV 无新的运行时 API 改动；Cockpit 与 Vben 兼容层同步 Core/图标依赖，保持九包同版。

```bash
pnpm create lumal-admin@0.0.4-beta my-admin
pnpm create lumal-admin@0.0.4-beta my-admin-http --api-mode http
```

历史修复与平台操作证据见 [修复报告](./repair-report-2026-10-19.md)。正式 tag 的门禁、生产 E2E 与 npm 发布结果见 [发布执行记录](./npm-release-0.0.4-beta.md)；校验成功不等于 npm 发布或线上部署成功。

## 0.0.3-beta (2026-10-16)

本版统一更新九个公共包：`@lumal/core`、`@lumal/icons`、`@lumal/icons-vue`、`@lumal/charts`、`@lumal/datav`、`@lumal/cockpit`、`@lumal/vben-compat`、`@lumal/vite` 和 `create-lumal-admin`。

本版通过 `v0.0.3-beta` 标签触发 npm 发布，使用 `beta` dist-tag；安装时显式指定版本，不依赖 `latest`。实际发布状态以 npm registry 和仓库发布工作流为准，各包的详细变更随包内 `CHANGELOG.md` 一起分发。

### 升级与兼容

- 图表组合升级为 ECharts 6 / vue-echarts 8，开发和示例锁定解析到 `6.1.0` / `8.3.2`。Charts peer 为 `echarts ^6.0.0`、`vue-echarts ^8.0.0`，DataV peer 为 `echarts ^6.0.0`，不再支持旧主版本组合。
- ECharts 6 的默认主题、图例和标签布局遵循新版本；需要保留旧外观的项目应在应用侧调整配置。
- 新增 `@lumal/core/minimal`，不静态加载默认 UI 注册表，字典默认关闭，只接受显式组件映射。根入口保留便利型默认 UI 接线，根入口的 `preset: 'minimal'` 不等同于依赖隔离。
- 请求缓存默认关闭；启用后默认仅缓存 GET，非 GET 必须显式指定 key。新增身份/租户作用域和 `clearCache()`，退出或切换上下文时应清理缓存。
- `LumalRouterView` 新增 `cacheKeys`，标签关闭和刷新可以剔除对应缓存；默认缓存上限为 20，并遵守 `meta.keepAlive=false`。自定义布局应同步标签 key 与视图 key，接入方式见 [Core API](./core-api.md)。

### 修复与轻量化

- 修复字典旧请求回填、标签快照恢复/退出清理、Esc 退出最大化和新窗口 history/base 地址。
- 图表事件正确传给 VChart；动画遵守显式 prop、option、reduced-motion 默认值的优先级，移除重复 resize，接通图表/表格宽度。
- DataV 通用图表按模式动态加载引擎，无引擎组件继续提供独立子入口；合并动画暂停接线，删除未使用的私有自动播放 helper。
- 修复直接传入图标定义、静态 SVG 插件代理、图标弹窗焦点与 Teleport；SVG 仍只接受可信资源，有限格式校验不等于安全净化。
- 驾驶舱动态注册可响应更新，消息总线隔离异步订阅错误；兼容表格防止旧查询和已销毁作用域回填。
- 补齐组件 resolver，新增最小消费者和首屏静态闭包体积预算，参考长文改为 `docs/*.md` 单源。

### 脚手架

- 生成项目精确依赖同版 `0.0.3-beta` 的 Core 与图标包，要求 Node.js `>=22.12.0`、pnpm `10.33.0`。
- 启动改用 `@lumal/core/minimal`，显式安装 Element Plus、Router 和权限；生成的是带 UI 的后台基座，不是无 UI 应用。
- 模板同步标签版本、`cacheKeys`、关闭清理和用户会话隔离，登录成功写入新会话前清理旧状态。
- `local` 和 `http` 两模式均纳入 tarball 独立生成、精确版本、安装与生产构建检查。HTTP 模式提供接入示例，业务项目仍需实现实际后端和认证适配。

```bash
pnpm create lumal-admin@0.0.3-beta my-admin
pnpm create lumal-admin@0.0.3-beta my-admin-http --api-mode http
```

本版验证记录见 [轻量框架审计](./architecture-audit-2026-10-16.md)，发布步骤见 [发布检查清单](./release-checklist.md)。本地验收未执行浏览器、E2E 或实机视觉测试；CI 发布门禁结果以对应工作流为准。

## 0.0.2-beta (2026-08-01)

上一版公共包统一版本。具体历史变更保留在各包的 `CHANGELOG.md`。
