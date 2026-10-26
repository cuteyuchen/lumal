# 脚手架专项重构验收

日期：2026-10-23。起点为 `a938f1af6f8980adf000e96d3231f0d5499174d4`，
初始工作区干净；开发分支为 `codex/scaffold-admin-refactor`。
九个公共包仍为 `0.0.5-beta`，本轮是未发布源码，不覆盖已经发布的版本。

## 基线审查

| 范围 | 起点与判断 | 本轮处理 |
| --- | --- | --- |
| CLI | readline 字符串问答，缺少键盘选择和摘要确认 | Clack 向导，保留原参数与非交互协议 |
| 模块 | 一级菜单与集中视图映射，扩展边界不清晰 | 简单类型化装配，独立父路由和业务子目录 |
| 系统页面 | 七种资源共用 SystemEntityView/entities | 删除万能实体入口，按业务建立七个页面 |
| 完整 Admin | 已有机构、授权、批量、字典和配置交互 | 参考其契约和职责，不引用或整体复制 Demo |
| Mock API | 已有专用角色、用户、机构、资料和配置接口 | 复用现有路径，标准包装与 Mock 包装显式适配 |
| Core/Vben | 公开路由、表单、表格及 V5/legacy 已有回归 | 沿用公开 API，不重写兼容层或反向依赖应用 |
| 发布 | 已有 fixed-group、十二组合和生产门禁 | 保留预算与门禁，新增专项行为及负向测试 |

已重新读取当前源码与脚本，而非假定参考 SHA 的代码没有变化。
CodeGraph 索引存在，但本机命令不可用，已尝试后使用 `rg` 与源码阅读。
起点 GitHub CI `39534310539`、Build Validation `39534310621` 为 success；
这是起点状态，不是本分支的新托管 CI 结果。

## 阶段结果

| 阶段 | 交付与验收状态 |
| --- | --- |
| A 基线 | 已审查生成器、完整 Admin、Mock API、Core、固定 Vben 5.7.0 契约和发布脚本 |
| B CLI | 已实现向导、参数兼容和取消回滚；PowerShell/ConPTY 与 tarball PTY 通过，Linux 实跑 BLOCKED |
| C 模块 | 已完成 app/modules/shared 分层和独立父子菜单，十二组合生产导航通过 |
| D 系统业务 | 七个独立页面、关联操作、授权树和错误恢复已实现并有真实交互验证 |
| E API/安全 | 模块强类型服务、Local/HTTP、一致权限语义及恶意菜单负向测试已完成 |
| F 基础体验 | 工作台、资料/密码、Header 入口、独立开发示例及业务扩展入口已完成 |
| G 兼容/性能 | V5 与 legacy 回归、静态依赖闭包、预算检查和同锁文件模板比较已执行 |
| H 交付 | 本地代码与 Windows 门禁完成；跨平台终端验收仍保留以下 BLOCKED，不宣称全平台完成 |

## CLI

仅生成器运行时新增 `@clack/prompts@1.8.1`；生成应用不安装它。
真实 PTY 测试使用开发依赖 `@lydell/node-pty@1.2.0-beta.15`。

```powershell
pnpm --filter create-lumal-admin build
node packages/create-lumal-admin/dist/cli.js my-admin
node packages/create-lumal-admin/dist/cli.js my-admin --preset standard
node packages/create-lumal-admin/dist/cli.js my-admin --features none --no-interactive
```

向导依次处理目录、npm 名称、预设、数据源、路由、可选功能、摘要确认。
方向键移动单选和多选，Space 切换功能，Enter 确认；默认 standard/local/hash。
已传参数不重问，`--features none` 与未传选项区分；minimal 不出现不可用功能。
特性名称、默认值、预设限制、依赖和冲突集中在 `src/presets.ts` 注册表。

CI、非 TTY、`TERM=dumb` 和 `--no-interactive` 不等待输入。
Escape、Ctrl+C、拒绝确认均发生在首次写入前，不创建目标目录。
写入阶段的取消信号走原有文件所有权回滚；非空目录、链接、缺少资源和写入失败均受保护。
Windows 题间维持 raw stdin，复用输入流，避免连续 Enter 被 cooked read 吞掉。

终端测试实际发送 ANSI 方向键、Space、Enter、Escape 和 Ctrl+C；
同时针对本地构建与解包安装的 tarball CLI 执行，不以参数解析单测替代键盘行为。
终端日志位于 `output/release/cli-terminal/win32-*.log`。

## 生成结构

```text
src/
  app/
    components/             # Header、偏好面板
    router/                 # 模块汇集、动态路由与守卫
    services/               # 会话、请求及数据源边界
    views/                  # 登录、异常与受约束 iframe
    module.ts
    menu-policy.ts
    stored-menus.ts
  modules/
    dashboard/
    profile/                # standard 与兼容预设
    system/                 # system 可选层
      user/
      role/
      menu/
      organization/
      dictionary/
      config/
      module.ts
      local.ts
    examples/               # examples 可选层
    vben-migration/          # 仅兼容预设
    business/               # 用户扩展入口
  shared/
    components/
    composables/
    api.ts
    tree.ts
```

每个模块导出 `menus/views/permissions`，只装配元数据，页面使用动态 import。
系统子模块有独立 routes、API 和类型；父模块只负责系统管理分组。
新增 `modules/business/orders/module.ts` 即可被发现，不修改无关中心文件。
Local 模式同样自动发现其 `local.ts`，HTTP 要求真实后端实现相同业务端点。
示例见生成项目 `src/modules/business/README.md`，不默认生成订单或项目业务。

minimal 仅保留运行基础和基础工作台，不含 system、examples、profile 或兼容层。
standard 增加标准工作台和个人中心，system/examples 默认启用但可独立关闭。
vben-compatible 在此基础上独立增加迁移模块，不让 Core 依赖 Vben。
未启用层不复制文件，也不生成失效注册和 API 调用。

核心实现位于 `packages/create-lumal-admin/`，无需生成项目依赖仓库私有代码：

| 职责 | 源文件或模板 |
| --- | --- |
| 向导与写入安全 | `src/cli.ts`、`src/presets.ts`、`src/create.ts` |
| 模块装配 | `templates/base/src/app/module.ts`、`app/router/views.ts` |
| 菜单与会话边界 | `templates/base/src/app/menu-policy.ts`、`app/stored-menus.ts`、`app/services/session-runtime.ts` |
| 系统业务 | `templates/features/system/src/modules/system/` 下各子模块的 `routes.ts`、`api.ts`、页面及业务组件 |
| 数据源 | `templates/modes/{local,http}/src/app/services/` |
| 工作台与资料 | `templates/presets/standard/src/modules/{dashboard,profile}/` |
| 迁移示例 | `templates/vben-compatible/src/modules/vben-migration/` |
| 真实协议和生产业务验收 | 根目录 `scripts/scaffold-test-api.mjs`、`verify-scaffold-system.mjs`、`verify-scaffold-navigation.mjs` |

## 系统功能

| 页面 | 已实现的业务 | 对应验证 |
| --- | --- | --- |
| 用户 | 查询、机构树筛选、角色/状态筛选、分页、查看/新增/编辑/删除、角色分配、状态、批量状态/角色、真实密码重置 | system 单测、每组合生产页面交互；内置管理员和批量预校验负向测试 |
| 角色 | 资料 CRUD、编码/状态、真实授权树、按钮权限、回显/半选、独立授权保存、部分成功重试 | 权限树解析与约束单测、授权保存/刷新失败的 HTTP 浏览器验证 |
| 菜单 | 目录/页面/按钮、外链/iframe、父级、白名单、图标、排序、隐藏、树 CRUD、循环校验、刷新导航 | 菜单类型/路径/循环单测及生产页面三个节点类型交互 |
| 机构 | 树列表、搜索、新增子机构、编辑、删除、父级、负责人/状态、引用与循环保护 | 机构/关联用户单测及生产页面新增编辑筛选删除 |
| 字典分类 | 独立 CRUD、进入关联字典项、删除分类处理关联项 | 分类/级联/缓存单测及独立页面交互 |
| 字典项 | 按分类筛选、值/名称/排序/颜色/状态 CRUD、共享缓存失效 | 关联与唯一值单测、独立页面 CRUD |
| 配置 | 对齐后端的五字段表单、只读权限、验证、保存、重读、恢复默认、错误恢复 | 契约/权限单测，真实 HTTP 保存及读取失败后的恢复 |

不复制七套 CRUD：稳定的读取、编辑状态、树和弹窗下沉到 shared，用户继续复用
LumalCrudTable；角色授权、菜单编辑、机构筛选、配置和字典保留各自业务职责。
批量操作仅提供服务明确支持的状态与角色分配，不假造批量删除能力。

## 数据源与安全

模块 API 定义输入、响应解析和类型，不在页面中散布资源字符串。
`BusinessTransport` 是底层请求能力，不是万能业务服务。
通用 list/save/remove 保留给历史迁移页；角色资料接口不能夹带 permissions。
完整协议随应用生成到 `API-CONTRACT.md`。

Local 使用独立模块处理器，真实维护用户、角色、机构、菜单和字典关联；
写操作再次检查注册的权限，保护内置管理员、角色引用和层级关系。
它仅供开发，存储可被用户修改，不是生产鉴权方案。

HTTP 使用真实请求，不回退 Local。standard 与 lumal-mock 是显式选择的适配器；
后者转换既有包装、Token、分页、菜单及配置权限，不改变 Mock 的后端契约。
接口缺失、403、校验或网络错误必须显示，不伪造密码修改或授权成功。

登录和深层链接等待用户、权限、菜单初始化。GET 401 单飞刷新并最多重放一次，
写请求不自动重放；退出、换号或过期清除凭据、权限、菜单、动态路由、标签和请求缓存。
旧会话请求被取消，返回前检查会话代数。
主动权限重读失败则清空旧授权和路由，保留凭据供明确重试；取消并等待其余读取结束后再重试，
避免旧请求的重复提交占位导致恢复失败。

授权写入和会话重读不是事务：前者成功而后者失败时显示“已保存，但刷新失败”，
只重试读取。个人资料采用同样的部分成功恢复，重试不能再次提交资料。
配置页重读成功后清除旧保存错误，保留真实服务端状态。

菜单组件键必须是白名单自有属性且值为函数，拒绝 constructor/__proto__/prototype。
远程 meta 不可关闭认证或透传 ignoreAccess；递归验证类型、重复、循环、层级和权限。
HTTP 菜单替换本地菜单，不悄悄融合。父目录只跳到当前身份可访问的子页，
无可访问子页隐藏；父级和子级权限均需满足。

外链只允许明确的 HTTP(S) URL，拒绝危险协议、协议相对地址、凭据、反斜线和控制字符。
内部路径和重定向使用独立校验。iframe 必须选 `app/iframe`，来源还需构建时
`VITE_IFRAME_ORIGINS` 白名单并使用 sandbox，不从菜单执行任意动态 import。
这些前端检查不替代后端授权。

## 基础体验

标准工作台包含欢迎、当前身份可见的快捷入口、真实会话/数据源状态和业务动态空态；
没有指标接口时不展示伪造统计，不安装图表引擎。
Header 关联独立个人中心，资料和密码均调用真实业务服务，校验、加载、失败和成功可见。
开发示例使用独立模块和数据，不进入系统管理。

生产浏览器覆盖系统/示例/迁移父分组、展开折叠、子页跳转、面包屑、标签、
KeepAlive、侧边/顶部/混合三种布局和 390px 导航。
只授予角色查询权限的用户从 `/system` 进入角色页，不能被重定向到无权的用户页；
guest 的系统及迁移深层链接进入 403，换号后不保留上一账号菜单和操作。

## Vben 兼容

继续以官方 Vben `v5.7.0`、SHA `63a38dce49ba109f61607994e21ba921d8e970e9`
的 Element Plus 契约为基准。公共兼容包未重写，根和 `/legacy` 仍为旧注册协议，
`/v5` 仍返回组件元组，支持范围见 [迁移矩阵](./migration-from-vben.md)。

迁移模块有独立父菜单、Form 和真实业务 Grid，生产测试验证字段/工具栏插槽、
日期和动态字段、查询/分页/刷新、列设置、CRUD 及 HTTP 失败重试。
`toolbar-actions` 保留工具栏调用语义，但只承诺文档明确列出的槽参数；
高级 VXE 编辑、虚拟滚动、完整 VeeValidate、任意 renderer 等不支持项继续明确报错。
minimal/standard 均不安装 VXE 或兼容包。

## 验证环境

Windows 11 10.0.26200 x64，Intel Core Ultra X7 358H，16 核/16 逻辑处理器，
可见内存 33,079,836 KiB。Node.js 24.14.1，pnpm 10.33.0。
工作区 Vitest 4.1.10；独立消费者本轮解析到 Vue 3.5.44、Element Plus 2.14.7、
Vite 8.3.5、Vitest 4.1.12。浏览器 Chromium 149.0.7827.55。
精确解析保留于消费者目录中的 lockfile，不将范围安装假定为永久固定版本。

## 性能结果

复现命令：

```powershell
$env:KEEP_LUMAL_CONSUMER_TEMP = '1'
pnpm test:create-consumer
node scripts/compare-scaffold-builds.mjs a938f1af6f8980adf000e96d3231f0d5499174d4
```

脚本通过 `git archive` 提取起点生成器，不改动原工作区。两侧均新建空目录，统一应用名称、
当前消费者的 package.json、锁文件和公共包 tarball，再冻结安装、类型检查和生产构建。
旧模板源码没有额外改写；两侧 Core 均包含本轮空样式入口修补，因此这是受控模板对照，
不是旧发布包原样安装与新包的端到端比较。每侧仅采一次热缓存样本，计时包含 pnpm/Node
启动成本；不能据此宣称构建或安装提速。

以下均为 Local/Hash，gzip 单位 KiB（1024 bytes），箭头为起点模板到新模板：

| 预设 | 入口静态 JS | 首次登录 JS | 全部 JS | 全部 CSS |
| --- | --- | --- | --- | --- |
| minimal | 161.51 → 163.93 | 174.43 → 176.88 | 202.28 → 205.21 | 41.19 → 41.28 |
| standard | 170.12 → 176.89 | 182.03 → 188.78 | 324.73 → 372.29 | 41.19 → 42.07 |
| vben-compatible | 170.76 → 179.69 | 182.68 → 191.60 | 334.46 → 385.08 | 41.35 → 42.34 |

| 预设 | 锁文件解析快照数 | 安装实例数 | 安装耗时 s | 构建耗时 s |
| --- | --- | --- | --- | --- |
| minimal | 473 → 473 | 420 → 420 | 49.795 → 43.077 | 2.707 → 2.513 |
| standard | 473 → 473 | 420 → 420 | 31.583 → 23.873 | 2.841 → 2.595 |
| vben-compatible | 474 → 474 | 421 → 421 | 35.997 → 36.107 | 2.349 → 2.566 |

依赖统计包含开发依赖和平台相关快照，不等于仅生产包数量或实际磁盘占用。
本轮没有增加生成应用的依赖；Clack 和 PTY 只进入生成器及仓库测试。
Standard 全部 JS 增加 48,703 bytes gzip，入口增加 6,937 bytes：
来自七个独立业务页面、资料/密码、工作台、Local 关联行为和安全校验，不把它包装成体积降低。
minimal 的入口增量为 2,486 bytes，兼容预设为 9,140 bytes。

Standard 页面级懒加载增量如下，统计该页面静态依赖闭包减去应用入口，
包含尚未加载的公共 UI；不能相加当作整包大小：

| 页面 | 增量 JS gzip KiB |
| --- | --- |
| 用户 / 角色 / 菜单 | 131.91 / 130.29 / 132.30 |
| 机构 / 字典分类 / 字典项 / 配置 | 131.17 / 131.48 / 138.14 / 135.98 |
| 工作台 / 个人中心 | 131.07 / 134.96 |
| 登录 / 403 / 404 | 11.89 / 127.02 / 127.01 |

十二组合的入口、登录、403、404、工作台闭包均未静态包含系统或迁移页面；
Standard 检出 7 个独立业务页，兼容预设 9 个。403 仍会装载较大的 Lumal/Element Plus
公共 UI 闭包，这是已有成本，不是提前装载系统页面；保留为 P2 优化项，不能将“懒加载”
描述成低成本或零依赖。精确 chunk 文件和闭包数据见 JSON 的 `lazyRoutes`。

可选特性来自最终消费者的独立生成样本：

| Standard 功能 | 入口 JS gzip KiB | 全部 JS gzip KiB | 相对 none 的全部 JS 增量 KiB |
| --- | --- | --- | --- |
| none | 172.82 | 289.99 | 0 |
| system | 176.63 | 370.48 | 80.49 |
| examples | 173.46 | 336.65 | 46.67 |
| system,examples | 176.89 | 372.29 | 82.30 |

共享依赖使增量不能简单相加。兼容预设的 `--features none` 仍保留迁移模块，
全部 JS 为 342.51 KiB；不是“移除 Vben”，也不强迫 standard/minimal 安装它。
可选模块未启用时的文件缺失由生成器测试覆盖，四个变体均独立安装、检查和构建。

现有预算复查仍通过：原 Admin 首屏 JS 为 311,926 / 335,000 bytes gzip，
CSS 为 42,490 / 50,000 bytes；Vben Demo 为 285,473 / 300,000 bytes JS。
没有提高阈值，预算具体定义沿用 `scripts/check-consumer-budgets.mjs`，
不能与上述生成模板入口口径混用。完整数据为
`output/release/scaffold-comparison.json`、`scaffold-report.json`，
原始构建日志为 `output/release/scaffold-comparison/*-{baseline,current}-build.log`。

## 命令记录

以下均在仓库根目录执行；完整门禁的子命令仍按原脚本串行执行，未关闭类型检查、
删除失败测试、使用 skip 或提高预算。日志路径均相对于仓库根目录。

| 命令 | 实际结果 | 证据 |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | PASS，16 个 workspace | `output/release/refactor-install.log` |
| `pnpm lint` | PASS | `output/release/refactor-final-lint.log` |
| `pnpm test` | PASS，117 文件 / 919 项 | `output/release/refactor-release-check.log` |
| `pnpm typecheck` | PASS | 同上，typecheck 阶段 |
| `pnpm build` | PASS | 同上，build 阶段 |
| `pnpm test:create-consumer` | PASS，最终源码 12 主组合 + 4 可选组合，退出 0 | `output/release/refactor-final-consumer.log`、`output/release/scaffold-report.json` |
| `pnpm compat:build` | PASS | `output/release/refactor-release-check.log` |
| `pnpm release:boundaries` | PASS | `output/release/refactor-final-boundaries.log` |
| `pnpm release:workflows` | PASS | `output/release/refactor-final-workflows.log` |
| `pnpm release:budgets` | PASS，未调整阈值 | `output/release/refactor-final-budgets.log` |
| `pnpm release:check` | PASS，退出 0 | `output/release/refactor-release-check.log` |
| `pnpm test:e2e:release` | PASS，28 / 28；0 skipped / flaky / unexpected | `output/release/refactor-final-release-e2e.log`、`.playwright-results/release-report.json` |
| `pnpm --filter create-lumal-admin test` | PASS，51 项，含 8 项 PTY | `output/release/refactor-final-scaffold-tests.log` |
| `pnpm exec vitest run --config vitest.config.ts scripts/lumal-skill.test.ts` | PASS，27 项 | `output/release/refactor-final-skill-tests.log` |
| `pnpm exec vitest run --config vitest.config.ts scripts/lumal-skill.test.ts scripts/docs-links.test.ts` | PASS，2 文件 / 46 项 | `output/release/refactor-final-document-tests.log` |
| `pnpm docs:build` | PASS | `output/release/refactor-final-docs-build.log` |
| `pnpm changeset:status` | PASS，九包 fixed-group 发布意图；未执行 bump | `output/release/refactor-changeset-status.log` |
| `node scripts/compare-scaffold-builds.mjs` | PASS，三预设双方共六个冻结安装、类型检查与构建样本 | `output/release/refactor-scaffold-comparison.log`、`output/release/scaffold-comparison.json` |
| `node --check scripts/compare-scaffold-builds.mjs` | PASS | 终端退出 0；脚本另已通过全仓库 Lint |
| `node output/release/verify-scaffold-final-http.mjs` | PASS，最终 HTTP 业务恢复专项 | `output/release/refactor-final-http-browser.log` |

工作区测试分布为 scripts 86、Icons 42、Icons Vue 27、Core 348、Charts 12、
DataV 74、Cockpit 59、Vben Compat 35、Vite 5、create-lumal-admin 51、
Mock API 14、Admin 150、Cockpit App 16。合计 919，不混入消费者重复运行次数。

十二组合内生成单测为 Minimal Local 23 / HTTP 33，Standard 及兼容预设 Local 36 /
HTTP 46，每种路由各运行一次，共 440 项。四个可选组合分别为 standard none 26、
system 36、examples 26、vben-compatible none 26，共 114 项。
另外单独运行 tarball PTY 8 项和 CLI 参数/CI 场景 8 项，不将这些重复计入工作区 919 项。
浏览器结果按 12 个完整应用流程记录，不把它误称为只有 12 个业务断言。
最终矩阵包括 12 次生产浏览器通过、0 次失败，以及 12 次懒加载闭包检查通过。
四个可选组合均独立安装、检查和构建，没有将仅做文件检查的组合冒充完整消费者。

完整 `release:check` 先完成，随后修正资料/配置的错误恢复并对最终源码完整复跑消费者、
生成器专项、原 Admin 生产 E2E 和 Lint；文档/Skill 再单独验证。
不将首轮 tarball 结果冒充最终模板版本的证据。

最新 Standard/HTTP 补充夹具还独立通过 typecheck、Lint、46 项单测和生产浏览器业务流程；
真实 HTTP 下断言资料恢复只产生一次写入，配置写入失败后重读保留原值。
证据为 `output/release/refactor-final-http-browser.log` 及同名 JSON 结果。
该夹具虽保留旧目录名 generated-minimal-http-hash，实际已同步为 Standard/HTTP，
仅作为补充验证，不冒充 Minimal 矩阵证据。
生成项目的 HTTP 浏览器使用真实独立 Node HTTP 服务；原 Admin 生产 E2E 使用真实 Nitro Mock API。
模板服务与 Nitro 端点已逐项核对，但没有额外执行“生成项目直连 Nitro”的完整浏览器矩阵，
不将协议源码核对宣称为该额外场景的验收。

初次消费者曾因 HTTP body 类型不兼容失败，修复后才继续验收；
机构选择、权限重试占位和错误文案问题也经真实页面修复，早期日志与失败诊断保留。
最终状态看本轮完成的日志，不将旧失败截图误作新失败，也不删除它们来掩盖过程。

## 验证产物

- `output/release/scaffold-report.json`：最终消费者目录、依赖与体积、分包闭包、浏览器结果及可选组合。
- `output/release/scaffold-report-first-pass.json`：首轮完整门禁消费者快照，避免后续覆盖。
- `output/release/scaffold-comparison.json`、`scaffold-comparison/`：同锁文件前后比较、独立源码目录与原始构建日志。
- `output/playwright/scaffold/`：各组合桌面/移动截图；失败保留 PNG、诊断 JSON 与 trace ZIP。
- `.playwright-results/release-report.json`、`playwright-report/release/`：原 Admin 生产 E2E 结果。
- `output/release/cli-terminal/`：实际 PTY 键盘会话日志。

这些是本地可再生产物，不加入 npm 包，不把历史 upgrade-verification 数据当成本次结果。

## 开发提交

| 提交 | 内容 |
| --- | --- |
| `c47287b` | Core 上游空样式兼容修补及主题入口测试 |
| `0e7ca75` | Clack 向导、特性配置、参数兼容、取消及真实 PTY |
| `4e61eb3` | 模块化模板、七页系统业务、强类型 API、安全、工作台与个人中心 |
| `30139f5` | 真实 HTTP 验收服务、生产导航/业务/恢复测试、tarball 消费者扩展 |
| `1af4a9f` | 同锁文件、双侧空目录安装的三预设可复现比较脚本 |

本报告、文档站入口、迁移矩阵和 pending Changeset 单独形成文档提交；
完整提交顺序可用 `git log a938f1af..HEAD --oneline` 查看。

## 发布与剩余验证

尚未选择下一 Beta 编号，pending Changeset 不等于已执行版本提升。
保留九包 fixed-group，不运行标准 minor bump 代替手工 Beta 流程。
未执行 npm 发布、推送、tag 或生产部署。

P1 / BLOCKED：本机 `wsl --list --quiet` 退出 1，明确提示未安装 WSL，
无 Docker/Linux 执行环境。新向导的 Linux PTY 实跑尚未完成，不能用起点 Ubuntu CI 替代。
Windows 已通过 PowerShell/ConPTY 键盘测试；未将其冒充 Windows Terminal GUI 人工验收。

P0：本轮目标范围无已知未完成源码项；以上平台验收限制仍使完整跨平台完成标准未闭环。

P2：性能为同环境构建样本，不等于网络传输、LCP 或跨平台终端保证；
Vben 兼容仍是可追溯子集，不宣称完整兼容全部 API。
403、404 等页面的公共 UI 增量仍约 127 KiB gzip，后续可继续缩小公共组件入口，
本轮未将这项已有成本描述为已解决。
消费者安装仍有 pnpm 的 Sass bin ENOENT、ESLint 9 deprecated 和 Node shell DEP0190 警告；
本轮实际类型检查、测试与构建均通过，未用无关的大版本升级掩盖这些上游工具链警告。
