# 下一阶段开发与验收报告

## 后续发布补验

本报告下文保留 2026-10-23 至 2026-10-24 的阶段快照，不改写当时的未发布状态或验收数量。
2026-10-25 已推送 `0.0.6-beta` 准备提交并创建 Draft PR #7；
同一候选 SHA 的 Ubuntu、Linux PTY、Windows 三轮视觉、静态站点和全部预算演练已通过。
历史“尚无远端 CI / PR”不再是当前阻塞。正式发布和 registry 核验状态以
[本版执行记录](./npm-release-0.0.6-beta.md) 为准，不以演练成功代替发布成功。
正式 tag `v0.0.6-beta` 指向 `827fa8b864318a4940b2abfec311ac5eb1cbb1e4`；
同次 Release Gate `40171196908` 的四项门禁与十包发布已成功，部署跳过。
十包 registry 版本、beta、tarball 完整性和同 run 的 696 个 dist 文件字节均已核验，
既有九包 latest 保持不变，新增 viewport 首次发布后的 latest 为 `0.0.6-beta`。
发布后六类纯 registry 消费者的正常安装、独立 frozen 复装、完整 check 与格式幂等均通过，
依赖、体积和报告哈希见执行记录；不将模板验证等同于真实业务后端联通。
当前文档、安装示例和仓库 / 本机 Skill 已同步本版；85 项文档 / Skill / 发布安全契约、
两份 Skill validator、15 份分发文件哈希对照及文档生产构建均通过。
本版完整本地 `corepack pnpm release:check` 也已退出 0，含 1,051 项主链测试、
全部生成消费者、视口检查、31 项生产 E2E 和十包 pack dry-run。
省级也已完成本版隔离复验，仍为无新增失败、原业务门禁非全绿，见
[真实消费者兼容性](./real-consumer-compatibility.md#省级本版隔离复验)。
原 Dashboard、真实后端和业务部署仍未执行，不将公共包验收扩展为业务上线结论。

## 原阶段记录

基线报告日期：2026-10-23；续办门禁日志写入于2026-10-23 20:08:59 UTC（北京时间2026-10-24 04:08:59），执行时间以日志为准。工作分支：`codex/lumal-project-types-and-quality`。
实际开发基线为 `29e474ec637fafb93468232b095142864c7b05b1`，不是旧master。
实现提交清单截止 `cf9940e`；本报告提交以Git历史为准。

**本次修改后的完整 `pnpm release:check` 已实际退出0。**
1049项主链单测、12+4 Admin消费者、14组Blank/Screen、50项视口检查、
31/31生产E2E、artifact与十包pack dry run均通过；E2E没有跳过或重试。
Cockpit与DataV Guide随后按顺序重新构建，当前全部应用另经`release:budgets --require-all`验证通过。
本次续办修复了DataV四张画廊的视觉遗留：两次独立三轮验证均21/21，无重试，
第二次使用CI同款命令。前序第4轮1043项主链、三预设模板比较及失败/修复证据继续保留，
不将历史模板比较、真实消费者候选或前序计时冒充本次复验。
此前完整`release:check`三次授权请求因审批服务错误未启动，Git暂存授权又两次超时。
权限恢复后已完成四组本地提交及修改后的完整门禁；终稿文档契约、格式、边界与生产构建亦已通过。
Linux PTY/候选Ubuntu CI仍未验证。下文区分续办通过、历史失败、环境阻塞和真实消费者原有失败；
历史发布报告、工作流静态检查及占位接口不能代替本轮真实执行证据。

## 基线与安全边界

- 开工实际执行了 `git status --short`、`git branch --show-current`、`git log -8 --oneline` 和 `git remote -v`。
  当时工作区干净，保留 `codex/scaffold-admin-refactor` 的完整Admin重构历史后创建本轮分支。
- 实际origin为 `https://github.com/cuteyuchen/luma.git`，没有擅自改成任务书中的另一个仓库名。
  本地master为 `a938f1a`，是重构基线的祖先；没有用旧master覆盖重构。
- Git HTTPS fetch连接不稳定；续办曾成功获取，但末次沙箱内连接重置、沙箱外连接超时。
  本地跟踪引用不能证明远端当前最新状态。未取得本轮Ubuntu CI执行结果，
  不能用历史CI或REST读取结果推断已push或运行CI。
- `.codegraph/`存在，但CodeGraph命令和MCP入口不可用，实际尝试后回退源码与`rg`。
- 本机Windows、Node24.14.1、pnpm10.33.0、Chromium149.0.7827.55可用；
  没有可用WSL/Linux执行器，Docker命令不可用。
- 两个原业务目录始终只读。省级安装、测试和构建在系统TEMP副本执行；
  不在原项目安装依赖，不改原源码、lockfile、patch或部署。
  私有源码、环境配置、资产及完整业务日志没有进入Lumal公开Git工作区。
- 本轮不发布npm、不打正式Tag、不部署生产、不强推、不重写历史。

## A. 本轮功能

表中“通过测试”仅指该行列出的实际证据；本次完整门禁和DataV视觉已通过，
仍不代表Linux CI与真实业务验收全部完成。

| 能力                                 | 状态                               | 实际结果与边界                                                                                                             |
| ------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 原Admin重构、Local/HTTP与旧CLI行为   | 已实现并通过测试                   | 复用既有三预设、系统管理七页、Dashboard/Profile、CRUD与动态授权；最终12组Admin及4组功能组合通过，12组生产浏览器通过        |
| Admin生产Layout过渡回归              | 已实现并通过测试                   | 本次全量生产E2E31/31通过，无跳过或重试，三种最大化动画保留页面；前序两例修复后重复6/6，原断言保留                          |
| Windows交互、参数预填、取消与回滚    | 已实现并通过测试                   | 方向键、Space、Enter、Escape、Ctrl+C及非交互路径有包内/终端回归；最终生成器为5files/95tests，不引用混合计数                |
| Linux PTY与候选Ubuntu CI             | 已实现但存在验证阻塞               | 测试代码和工作流保留，本机没有Linux执行器，未取得本轮Ubuntu实跑结果                                                        |
| 工程规范与AI开发约定                 | 已实现并通过测试                   | 公共工程层、类型分层规范、ESLint/Prettier分工、统一check与格式幂等；不全量格式化公共包历史代码                             |
| Blank与独立Screen                    | 已实现并通过测试                   | 不叠加Admin base；默认仅Vue，无Core/Element Plus/Pinia/Router、登录、管理菜单和系统管理                                    |
| Screen认证、数据和路由按需组合       | 已实现并通过测试                   | none/local-demo/http认证与none/local/http业务数据独立；HTTP失败不降级Demo，生产Local Demo禁用                              |
| Charts/DataV/Cockpit按需生成         | 已实现并通过测试                   | 只生成所选演示；DataV数字/边框不要求ECharts，Cockpit仅runtime、内部external，Designer隔离                                  |
| DataV原gallery附加视觉门禁           | 已实现并通过本机测试               | 修复首帧事件、画廊尺寸反馈与动画时点，人工审核后仅更新四张陈旧画廊golden；两次三轮均21/21，原阈值/遮罩及上游飞线golden不变 |
| 应用/页面/容器三级适配               | 已实现并通过测试                   | 通用Vue包提供默认策略及显式覆盖，不transform DOM根；实际内容容器ResizeObserver、RAF合并、清理与KeepAlive恢复               |
| 响应式、contain、width和容器尺寸单位 | 已实现并通过测试                   | 14项视口单测；独立夹具40组工作区、8组局部画布和2组稳定检查通过，真实浏览器zoom有记录                                       |
| 可选定向px转换                       | 已实现并通过测试                   | Vite14项回归覆盖Dev/Build、SFC/SCSS/CSS、路径及来源边界；默认关闭、依赖白名单，不转换脚本或内联style                       |
| Admin与访客Screen共存                | 已审计，确认已有能力足够，无需修改 | 用一个Router与现有Layout/Permission/Registry组合，新增4项脱敏契约与文档，不增加第四种必选框架                              |
| 请求Adapter与会话隔离                | 已实现并通过测试                   | 在原请求客户端修复迟到401、旧写请求、匿名请求、刷新/Abort竞态及失效通知，73项请求契约；不引入替代客户端                    |
| CRUD序号与旧补丁原生覆盖             | 已实现并通过测试                   | 修复无field序号、跨页序号、选中导出、派生表单/字典过滤；44项定向回归，普通字段类型不放宽                                   |
| 新CRUD巨型抽象                       | 已审计，确认已有能力足够，无需修改 | 两项目共20页审计，现有DataSource/Schema/字典/插槽能表达；没有证明新增工厂的维护收益，不恢复前身表格协议                    |
| 省级真实消费隔离升级                 | 已实现但存在验证阻塞               | c2dd616候选无旧patch时安装、lint、类型和构建通过；原测试与基线完全相同的失败仍在，真实后端/页面/部署未验收                 |
| 小流域整站迁移                       | 因复杂度过高而暂缓                 | 完成API、请求、CRUD、路由与视口迁移矩阵；不是改包名兼容，不擅改业务系统                                                    |
| P2增量模块生成                       | 因真实需求不足而暂缓               | 目录、动态路由和页面流程不统一，先记录最小安全方案，不创建未经收益验证的生成器                                             |
| P2 OpenAPI类型接入                   | 已审计，确认成熟工具链足够         | 审计两后端Swagger配置并提供方案；未取得真实Schema，未声称完成真实类型生成                                                  |

## B. 核心架构

### 包与公开入口

新增唯一公共包为 `@lumal/viewport`，公共包总数由9变10。
该包没有运行时dependencies，仅Vue peer，不依赖Core、Element Plus、ECharts、地图或Cockpit。
DataV/Cockpit依赖该包复用算法，避免三份实现或通用视口反向依赖后台。

| 包/入口                          | 本轮变更                                                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@lumal/viewport`                | `LumalViewport`、`createViewportPlugin`、`resolveViewportPolicy`、`useViewportPolicy`、`computeViewportFontSize`、`computeViewportScale`、`useElementSize`、`useViewportScale`及对应公开类型 |
| `@lumal/datav`、`@lumal/cockpit` | 共享尺寸/缩放实现，保留`computeFullScreenScale`、`computeCanvasScale`与既有组件契约；Cockpit external不叠缩放、不注册内部尺寸监听                                                            |
| `@lumal/vite`                    | 新增`createViewportTransformPlugin`、`createViewportPostcssPlugin`和`ViewportTransformOptions`                                                                                               |
| `create-lumal-admin`             | 新增`createLumalProject`及ProjectTemplate/Screen能力类型；保留旧`createLumalAdminProject`入口                                                                                                |
| `@lumal/core/request`            | 复用既有Token、scope、Parser和Hook，强化会话代次/实际管理的Authorization隔离；旧会话使用`STALE_SESSION`取消错误                                                                              |
| `@lumal/core/components`         | SchemaTableColumn判别联合和CrudTableColumn交叉类型；index不要求业务field，普通列仍类型安全                                                                                                   |

新增视口策略为`disabled/responsive/contain/width/vw`。
作用范围由插件默认、路由包装和局部容器决定，不与模式混成一个枚举。
`minScale/maxScale/minFontSize`为显式策略；下限与完整容纳冲突时允许局部滚动。
Admin保留默认14px、12–20px用户字号与Element Plus映射，不按1920设计稿缩放所有文字。

请求修复不会撤销旧成功回调或阻止外部refresh写Token，应用仍须校验会话代次。
外部显式Authorization不跟随默认Token自动刷新，业务成功码、字段和上下文不写入Core。
Schema列从interface式扩展改为联合/交叉后，自定义`interface extends`可能需改为type交叉；
明确迁移说明见[升级指南](./upgrade-guide.md)。

### CLI与模板层

现有npm包新增`create-lumal` binary，旧`create-lumal-admin` binary不变。
`create-lumal`名称在当日registry查询为E404，但不代表已保留发布权；
未发布新包，不能把`pnpm create lumal`写成已可用的发布命令。

| 参数                                                  | 本轮约定                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| `--template admin\|screen\|blank`                     | 通用入口交互选择；旧入口默认Admin                           |
| `--preset minimal\|standard\|vben-compatible`         | Admin原有预设，默认standard                                 |
| `--api-mode local\|http`                              | Admin原有数据模式，默认local                                |
| `--features system,examples\|none`                    | 保留Admin模块选项                                           |
| `--router-mode none\|hash\|history`                   | Admin默认hash且拒绝none；Screen/Blank默认none               |
| `--auth none\|local-demo\|http`                       | Screen认证，默认none                                        |
| `--data none\|local\|http`                            | Screen业务数据，默认none；HTTP认证即使data=none仍发认证请求 |
| `--visualization none\|charts\|datav\|cockpit`        | 只生成选中能力                                              |
| `--viewport disabled\|responsive\|contain\|width\|vw` | 默认responsive；scale作为contain别名                        |
| `--no-interactive`、帮助与取消                        | 保留参数预填、摘要确认、非TTY路径和拥有文件回滚             |

模板组合为`common + vue + blank/screen`，或`base + common + Admin功能层`。
`base`保留历史目录名但明确仅属于Admin；精简靠不生成文件，不是生成后删除。
默认Blank/Screen只有Vue，Router、Core服务、可视化和Viewport按选项添加。
独立视口包不意味着强制给所有新项目增加框架依赖。

### 依赖、规范与CI

- Viewport仅新增轻量Vue peer；DataV的ECharts peer改为可选。
  Cockpit现有Designer依赖仍属于包能力，但Screen只消费runtime，发布边界验证不得混入Designer/Sortable代码。
- Vite使用标准picomatch/PostCSS/配置加载/value parser处理范围与CSS语法，不扫描普通脚本数字。
  默认不处理node_modules，跨样式来源不能可靠定位时跳过并报警，不扩大白名单。
- 工程层生成`.editorconfig`、`.gitattributes`、忽略配置、ESLint、Prettier、TS/Vite/Vitest配置、
  `AGENTS.md`和分层`docs/DEVELOPMENT.md`。Antfu关闭stylistic/formatters，最后接Prettier兼容配置。
- ESLint负责Vue/TS语义、未使用项、导入顺序、循环依赖和目录边界；
  双域存在时才限制Admin/Screen互禁及Shared反向依赖，Blank不创建这些目录。
- Prettier负责分号、单引号、2空格、120列、LF。忽略依赖、dist、coverage、lock与生成声明；
  仓库format命令只格式化模板，不改公共包历史风格。
- 生成命令统一为dev/lint/lint:fix/format/format:check/typecheck/test/build/check。
  首次安装生成lock，再执行frozen复装，不能伪造锁文件或隐藏首次安装差异。
- 根`release:check`增加模板格式、工作流安全、独立项目矩阵和真实缩放夹具；
  CI/Windows gate增加format:check，Ubuntu release gate统一执行完整链。
  新包加入构建顺序、声明、artifact、包预算、pack和发布artifact列表。
- Vitest保留默认exclude并排除`**/output/**`，防止历史验收副本被发现为当前测试；
  正式生成器95项，不能引用混入三份历史基线副本的216项。
- 发布/部署仍受同次gate产物与显式授权约束，本轮没有触发发布或部署。

使用说明集中在[项目模板](./project-template-guide.md)、[工程规范](./development-standards.md)、
[屏幕适配](./screen-viewport-guide.md)和[专项浏览器报告](./screen-viewport-verification.md)，不复制多套互相漂移的规范。

## C. 真实消费者

下表`P/`为省级frontend，`S/`为小流域frontend。
仅公开文件定位与脱敏行为，不包含企业实现、地址、账号或地图资产。

| 证据                                                                         | 发现与本轮处理                                                                                                                                  |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `P/src/api/request.ts`、`services/session.ts`、`navigation.ts`及两项目请求层 | Token、成功码/字段、msg/message、超时、取消、query/body、Multipart与上下文均能用公开Parser/Hook/Adapter表达；保留应用严格会话代次与业务缓存重置 |
| `P/pnpm-workspace.yaml`及Core0.0.4 patch                                     | 实际启用补丁，不是闲置文件；基线4个dist目标29条新增行均核实。e70adb4原生修复序号契约，候选去绑定后可类型检查与生产构建                          |
| 省级10页、小流域10页CRUD                                                     | 覆盖上下文数据、异步字典、普通编辑、用户关系、权限树、组织/菜单树、字典父子页、文件和跨字段校验；无需第二个巨型CRUD                             |
| `S/src/admin`、`screen`、`shared`、`router`                                  | 保留一个Router、访客大屏与受保护后台；共享会话不等于共享菜单和标签，现有公开API可组合                                                           |
| `P/src/views/dashboard/`、`layout/AdminShell.vue`                            | 固定min1280×660、382px侧栏、210px底栏及仅宽断点是业务约束；公共包不硬编码行业布局，地图应实际容器resize而非整体transform                        |
| 两项目ESLint配置                                                             | 复用Antfu及import-x依赖方向；按真实目录启用边界，不给Blank强加后台架构                                                                          |
| 两Java后端Swagger声明                                                        | 省级Springfox3/OAS3、小流域Springfox2/Swagger2；没有取得可用真实Schema，不宣称已运行类型生成                                                    |

省级在系统TEMP建立baseline/candidate。基线固定`@lumal/* 0.0.4-beta`并应用原patch；
最终消费候选运行时为`c2dd61695a539859e89be780b6da28d6dc484b41`，
pack附带未改变runtime的公开README/description更新，精确身份以十包SHA256为准。
实际只安装五个Lumal包，逐一核对file tarball路径和SHA256/SHA512，九个overrides统一候选；
没有workspace alias或混入registry旧Lumal包。该隔离对照在本次DataV首帧事件修复前完成，
不能直接作为本次DataV改动的真实业务验收；两个业务目录未修改，历史候选记录未被替换为当前工作区。

| 项目                     | 实际结果                                                                                          | 不能推导的结论                           |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 省级baseline             | frozen安装、lint、typecheck、build通过；38/41files、474/480tests通过                              | 原门禁并非全绿                           |
| 省级candidate，无旧patch | normal/frozen、lint、typecheck、build通过；相同38/41files、474/480tests                           | 不能直接批准删除业务patch或部署          |
| 同条件失败对照           | 七个FAIL标题逐字相同：5个占位环境断言、1个旧RegionSearch图标断言、1个缺Jenkinsfile的suite加载错误 | 无新增失败不等于全部通过；部署测试未执行 |
| 小流域                   | 完成API/页面/请求/路由迁移审计和脱敏契约对应                                                      | 不是直接兼容，也未完成整站迁移/生产构建  |

省级原.env未复制，使用人工无凭据占位配置，不连接真实业务/地图服务。
候选首次lint只因辅助脚本生成的TEMP overrides YAML格式失败，定向格式化配置后复跑；
没有为消除失败而删除测试或改业务源码。
原Dashboard固定尺寸断言未修改，真实页面、真实后端、上传、生产权限和部署均未验收。
完整文件清单、精确哈希、原失败分类及升级条件见[真实消费者矩阵](./real-consumer-compatibility.md)。

P2增量生成暂缓：两项目目录和路由所有权不同，尚无逐页迁移的代码量/维护成本证据。
保留的最小方案是显式业务根与名称、只生成typed页面/API/测试、拒绝覆盖并复用回滚，
不自动重写后端菜单或业务AST。收益成立后再实现。
OpenAPI采用业务devDependency中的成熟类型生成工具，Swagger2先本地转换为OpenAPI3；
不自研解析器、不加运行时、不上传Schema。未取得真实Schema是明确阻塞，详见升级指南。

## D. 实际验证

### 本次续办验证

以下为当前工作区的实际结果，不混入前序完整门禁的计数：

| 验证项                  | 实际结果                                                                | 证据                                                                                         |
| ----------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 全仓单元主链            | 14组runner合计1049项通过，退出0                                         | `output/release/continue-release-check.log`中首次typecheck之前                               |
| Lint/格式/工作流/边界   | 完整门禁前置步骤均通过，未扩大allowlist或降低安全检查                   | `continue-release-check.log`                                                                 |
| CI附件保护定向回归      | 2files/39tests通过，已纳入本次主链，不重复相加                          | `continue-ci-evidence-contracts-escalated.log`                                               |
| DataV单元、类型和构建   | 75项单测、包typecheck/build与视觉夹具typecheck通过                      | 完整门禁及`continue-datav-fixture-types.log`                                                 |
| 首帧事件定向复验        | 真实SVG引擎2/2通过                                                      | `continue-runtime-final.log`                                                                 |
| DataV三轮视觉回归       | 21/21，21.0s，无重试                                                    | `continue-datav-repeat.log`                                                                  |
| CI同款视觉命令          | `corepack pnpm test:datav:visual --repeat-each=3`，21/21，21.4s，无重试 | `continue-datav-ci-command-escalated.log`                                                    |
| Admin消费者             | 12组主场景、12组边界及生产浏览器通过，另有4组可选模块                   | 当前`scaffold-report.json`，TEMP标识`9FX3Qt`                                                 |
| Tarball CLI回归         | 12项通过，其中10项PTY、2项非TTY；与主链和8项CLI场景分开统计             | `continue-release-check.log`、本轮刷新十份`win32-*.log`                                      |
| Blank/Screen消费者      | 14个唯一场景check与browser通过，14×5共70组生产视口检查                  | 当前`project-templates-report.json`，TEMP标识`V6Zeb0`                                        |
| 通用视口夹具            | 40+8+2共50项通过，24张截图尺寸匹配；运行时、页面和控制台异常均为空      | 当前`viewport-report.json`、`continue-viewport-types.log`                                    |
| 生产E2E                 | 31/31通过，92.770s；skipped/unexpected/flaky均0，retry均0               | `.playwright-results/release-report.json`、完整门禁日志                                      |
| 发布artifact与十包pack  | 在同一完整链中通过；没有发布npm或修改版本                               | `continue-release-check.log`末段                                                             |
| 当前整链发布检查        | 权限恢复后实际完成，退出0                                               | `output/release/continue-release-check.log`                                                  |
| Cockpit/DataV指南应用   | 串行build:app均退出0，含类型检查；Vite阶段10.35s/868ms                  | `continue-cockpit-build.log`、`continue-datav-guide-build.log`                               |
| 当前严格体积预算        | `pnpm release:budgets --require-all`退出0，四应用均存在且未超原预算     | `continue-budgets.log`                                                                       |
| 终稿文档与安全契约      | 6files/101tests通过，退出0；不与1049项主链相加                          | `continue-docs-acceptance-contracts.log`                                                     |
| 终稿边界/格式/差异      | 公开边界、两份报告Prettier及git diff --check均退出0                     | `continue-final-boundaries.log`、`continue-docs-format-check.log`、`continue-diff-check.log` |
| 文档生产构建            | `pnpm docs:build`退出0，仅有原有大chunk提示                             | `continue-docs-build.log`                                                                    |
| 当前Git暂存/提交        | 运行时、视觉夹具、CI保护及使用文档四组本地提交已完成                    | `8978085`、`0b8fd15`、`5e96325`、`cf9940e`；没有推送                                         |
| Linux PTY/候选Ubuntu CI | 未执行                                                                  | 无本机Linux执行器，尚未推送候选分支或创建本轮PR                                              |

本次1049项分别为scripts104、viewport14、icons42、icons-vue27、Core392、Charts12、
DataV75、Cockpit59、Vben35、Vite14、生成器95、Mock API14、Admin150、Cockpit应用16。
先前`continue-code-tests.log`的1048项为追加CI附件案例前的阶段快照，
39项定向结果、首帧2项及消费者自身测试均不与完整主链重复相加。
Tarball CLI runner的12项也不增加为主链1061项；十份Windows终端日志本身不记录退出码。
沙箱内视觉与定向Vitest分别因`spawn EPERM`未启动；批准的沙箱外重跑通过，
失败装配日志分别保留在`continue-datav-ci-command.log`和`continue-ci-evidence-contracts.log`。
审批服务错误发生在此前整链与Git请求，不能归类为代码检查失败。
权限恢复后重新执行首帧回归2/2、文档/Skill/边界/CI定向契约101项，均通过；
日志为`continue-runtime-final.log`及`continue-docs-final-contracts.log`。

本次完整消费者矩阵、通用视口专项、生产Admin E2E和pack均已由当前整链完成。
前序完整门禁与模板比较继续作为历史证据；后方当前体积表以本次JSON和严格预算为准。
四份历史JSON报告已保留在`output/release/previous-attempt4-evidence/`，
当前`output/release/*-report.json`已由续办门禁刷新，历史比较仍使用归档。
这些JSON不包含HEAD指纹，提交身份需结合实现提交`cf9940e`、门禁执行记录及Git状态核对，
不能仅凭报告文件推断源码版本。

### 前序完整门禁

第4轮完整门禁在Windows/Node24实际退出0，日志为
`output/release/next-final-release-check-attempt4.log`。
它完成全部主链命令，包括31/31生产E2E（1.5m）和最后十包pack dry run。
前序失败日志及后续修复证据保留，不改写为当时通过，也不混作当前主链失败。
第一次完整gate在Admin消费者因合并devDependencies后的jsonc/sort-keys退出，
已用`6413a8b`修复稳定顺序并通过5项定向回归后重跑；
CLI帮助默认路由说明由`fa9e777`修复并进入该轮。首次失败日志保留为
`output/release/next-final-release-check-attempt1.log`，不把失败记录隐藏为通过。
第2轮`output/release/next-final-release-check.log`退出1前已完成前置质量、
1043项主链单测、类型与构建、12+4 Admin、14组新模板、
50项视口检查、Admin/兼容示例构建及artifact/预算检查。
生产E2E29/31通过，失败分别为面包屑进入/离开过渡时重复匹配、
混合导航侧栏过渡未采到中间宽度。
`9276c3d`仅调整验收前置条件：稳定布局先等待进入/离开过渡类清零，
侧栏动画显式使用`reducedMotion: no-preference`并等appear结束后采样，全部原断言保留。
两例各`--repeat-each=3`共6/6通过，日志`next-final-layout-settle-repeat.log`（57.4s），不替代完整E2E。
第3轮`next-final-release-check-attempt3.log`在发布边界检查退出，未进入编译：
本报告使用前身组件名称触发既有规则，已改为中性说明；详细API迁移仍集中于原有指南，
不新增allowlist、不降低门禁，修正后完整发布边界复查通过。
第2轮命令链在E2E退出，后面的pack未由该链执行；随后预算与十包pack独立补跑通过。
第4轮则在同一完整链内执行pack成功，并对最终构建产物另运行
`release:budgets --require-all`退出0，该轮严格预算日志为`next-final-budgets-attempt4.log`。

下表保留前序第4轮结果；DataV历史失败现已由上方续办结果补齐。

| 验证项                          | 实际命令/环境                                                                                                                                                                        | 状态                                  | 证据                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 最终整链门禁                    | `corepack pnpm release:check`，Windows/Node24                                                                                                                                        | 通过，第4轮实际退出0                  | `next-final-release-check-attempt4.log`，完整命令链含最终pack                                                             |
| 冻结安装                        | `corepack pnpm install --frozen-lockfile`                                                                                                                                            | 通过                                  | `next-final-frozen-install.log`                                                                                           |
| Lint/模板格式/工作流/公开边界   | `pnpm lint`、`format:check`、`release:workflows`、`release:boundaries`                                                                                                               | 通过                                  | 最终gate日志前置阶段                                                                                                      |
| 单元主链                        | `pnpm test`                                                                                                                                                                          | 通过，14组runner合计1043tests         | 最终gate日志，不混入后续生成项目单测                                                                                      |
| 生成器                          | `pnpm --filter create-lumal-admin test`，包内build后运行                                                                                                                             | 通过，5files/95tests                  | 最终gate日志；含Windows终端、旧参数、取消/冲突/回滚                                                                       |
| 当前测试发现范围                | `corepack pnpm exec vitest run --config vitest.config.ts scripts packages/create-lumal-admin/tests`                                                                                  | 通过，13files/194tests                | `next-final-test-discovery.log`，3ee7188排除output历史副本，不改变主链1043项                                              |
| 请求/CRUD/Hybrid                | 请求73项、CRUD44项、Hybrid4项定向回归                                                                                                                                                | 通过，另纳入Core392项                 | `request-client.test.ts`、`consumer-request-contract.test.ts`、`next-crud-tests-final.log`、`next-hybrid-tests-final.log` |
| Layout阶段基线                  | 布局、标签缓存、路由释放3files/35tests                                                                                                                                               | 通过                                  | `next-baseline-layout-corrected.log`                                                                                      |
| 类型与公共包构建                | `pnpm typecheck`、`pnpm build`                                                                                                                                                       | 通过                                  | `next-final-build.log`、最终gate日志                                                                                      |
| Admin独立消费者                 | `pnpm test:create-consumer`，12组主矩阵+4组功能                                                                                                                                      | 通过，12组生产浏览器及公开边界通过    | `previous-attempt4-evidence/scaffold-report.json`，第4轮TEMP标识AGii0S，含8项CLI案例                                      |
| Admin基线模板比较               | `node scripts/compare-scaffold-builds.mjs 29e474e`，三预设Local/Hash                                                                                                                 | 通过，逐侧安装/类型/构建              | `next-final-scaffold-comparison.log`、`scaffold-comparison.json`；同候选tarball与归一化manifest/lock                      |
| Blank/Screen独立消费者          | `pnpm test:create-projects`，14组                                                                                                                                                    | 通过，14组check及70组五视口检查       | `previous-attempt4-evidence/project-templates-report.json`，第4轮TEMP标识zLTMZ4                                           |
| 真实缩放夹具                    | `pnpm test:viewport`及夹具typecheck/build/ESLint                                                                                                                                     | 通过，40+8+2项检查                    | `previous-attempt4-evidence/viewport-report.json`；Dev/Build无运行时错误                                                  |
| DataV附加视觉与历史对照         | `pnpm test:datav:visual`；29e474e隔离副本相同六例再运行两次                                                                                                                          | 失败，当前及历史两轮均2/6             | `next-final-datav-visual.log`、`datav-baseline-29e474e-comparison.log`、`datav-baseline-29e474e-repeat.log`               |
| 生产浏览器/Layout最大化         | `pnpm test:e2e:release:built`及Admin消费者浏览器                                                                                                                                     | 通过，第4轮31/31，1.5m                | `next-final-release-check-attempt4.log`；前序29/31及修复重复6/6日志保留                                                   |
| 发布artifact与体积预算          | `pnpm release:artifacts`，内部含图标消费者与`check-consumer-budgets.mjs`                                                                                                             | 通过                                  | 最终gate日志；四应用及服务/轻量入口未上调预算                                                                             |
| 严格体积预算                    | `corepack pnpm release:budgets --require-all`                                                                                                                                        | 最终产物独立执行通过，退出0           | `next-final-budgets-attempt4.log`，要求所有既有应用构建产物均存在                                                         |
| Pack dry run                    | `corepack pnpm pack:dry-run`，十个公共包                                                                                                                                             | 通过，第4轮完整链与先前独立运行均成功 | `next-final-release-check-attempt4.log`、`next-final-pack-dry-run.log`                                                    |
| 文档/Skill/包名安全契约         | `pnpm exec vitest run --config vitest.config.ts scripts/lumal-skill.test.ts scripts/docs-links.test.ts scripts/release-boundaries.test.mjs scripts/check-npm-package-names.test.mjs` | 通过，4files/62tests                  | `next-final-docs-contracts.log`                                                                                           |
| Cockpit/DataV指南应用构建       | `pnpm --filter lumal-cockpit build:app`、`pnpm --filter lumal-datav-guide build:app`                                                                                                 | 通过，Vite阶段分别12.47s/1.26s        | `next-final-cockpit-build.log`、`next-final-datav-guide-build.log`；各自包含vue-tsc，仅有大chunk提示                      |
| 当前交付文档生产构建            | `pnpm docs:build`                                                                                                                                                                    | 通过，终版产物已刷新                  | `next-final-docs-build-complete.log`；前序7.78s日志另存为`next-final-docs-build-attempt4.log`，仅默认大chunk提示          |
| 真实省级隔离对照                | 两TEMP副本原lint/typecheck/test:run/build，候选normal+frozen                                                                                                                         | 已执行，无新增失败，原门禁非全绿      | 真实消费者文档；完整私有日志仅留TEMP                                                                                      |
| Linux PTY/本轮Ubuntu CI         | 本机无WSL/Linux，Git HTTPS失败，未取得候选CI结果                                                                                                                                     | 阻塞/未执行                           | Windows结果不能替代Linux方向键、Space、Escape与Ctrl+C                                                                     |
| 真实后端/部署/业务Dashboard改造 | 未获得可用现场契约与修改授权                                                                                                                                                         | 未执行                                | 原项目只读，不用Mock成功宣称生产接口可用                                                                                  |

单元主链1043项分别为scripts99、viewport14、icons42、icons-vue27、Core392、Charts12、
DataV74、Cockpit59、Vben35、Vite14、生成器95、Mock API14、Admin150、Cockpit应用16。
后续生成项目自己的测试单独统计，避免重复相加。早期54/72/78/88等是阶段快照，不再作为最终生成器计数。

### DataV视觉遗留与修复

前序`9276c3d`与有效历史基线`29e474e`在相同Windows、Node24、已安装工具链和Chromium下，
运行相同六项测试；前序工作区及历史两轮均2/6通过，dark/light ×1920×1080/1366×768四张gallery快照失败。
gallery、spec和六张golden的SHA256均一致，本轮改变的全屏缩放逻辑未被gallery使用。
这项检查不属于`release:check`；即使主链最终成功，也不能写为所有测试全绿。

golden最后更新为`1588983`（2026-07-16），仍显示改名前的包标题；
后续改名`1e125cd`与异步引擎生命周期`eca0052`没有同步golden。
历史源码自身两轮像素差异数仍波动，说明有陈旧golden及运行间状态不确定性；
不能仅由相同失败数量证明四场景完全无回归，也不能声称剩余差异均已确定根因。
该历史对照没有修改快照或`maxDiffPixels: 2500`，未归因于已设duration0的数字动效或未检查的字体。
当时仅提出图表ready、Canvas动画、SMIL时点与尺寸稳定的修复建议，没有实施。
完整逐文件哈希、像素数、有效命令及截图路径见`output/release/datav-baseline-comparison.md`。

本次实际修复：

- `LumalCharts`在首次`setOption`前绑定事件，真实SVG引擎回归验证静态首帧的`rendered/finished`通知。
- 画廊为图表卡片给出明确高度和`auto minmax(0, 1fr)`内容行，消除100%子图表与仅有min-height父级的尺寸反馈。
- 静态Canvas示例显式禁用动画、飞线时长固定；等待字体就绪，将所有SVG固定到同一SMIL时间。
- 就绪通过测试入口读取ECharts公开实例并核对容器尺寸；另检查非空Canvas、连续三帧几何稳定、内容不覆盖标题。
- 四场景在每次测试中重新加载并逐字节比较截图；独立动效、异步引擎加载和上游飞线对照继续执行。
- `continue-datav-fixed-layout.log`保留尺寸修复后的不稳定失败；`continue-datav-fixed-motion.log`中跨加载比较已通过，
  剩余失败仅在旧golden比对。逐图审核后，只更新四张陈旧画廊基准，更新日志为`continue-datav-golden-update.log`。

原`maxDiffPixels: 2500`与四个随机装饰遮罩未扩大。两张上游飞线基准SHA256仍与历史记录一致：
普通飞线`7B0DD1FBACD7DDA14DD108A0EE401355E12E0E679BB041D4B5780D48CB0E199D`；
增强飞线`C24EAED15A61392FABB9B3F45AE561DB0040AFB1F4B683D9F565995B473A4A05`。

| 更新的画廊基准  | 当前SHA256                                                         |
| --------------- | ------------------------------------------------------------------ |
| dark 1920×1080  | `0DE3426EC9113BCBA6EB8F25CD01A4A4007CAE1846662A595FF685B6BA337168` |
| dark 1366×768   | `EF3242F338A047AE3009A115B4A22CC5D084C6972B4B43D1F6F4B5336DD6DAC8` |
| light 1920×1080 | `E2FC67565FF9C619A3073DBC9B2F62E21B58761A91A754D592269799B6FD9930` |
| light 1366×768  | `FAA363E3C449AB881C47C5574C6D57083738242108202E623CC42E263BEFAC9B` |

测试增加异步引擎案例后由6项变7项，三轮为21项。两次独立三轮命令均通过，无重试；
当前截图在`.playwright-results/datav/`，首次三轮归档在`output/playwright/datav-repeat/`。
Build Validation新增Windows视觉job，发布Windows job也执行同款三轮命令；禁止only、重试、跳过或容错，不在CI更新golden。
Linux CI与发布Windows job均始终上传终端日志，缺失附件作为错误。工作流已通过静态和拒绝变异回归，
但尚未取得这些新增job的远端实跑结果；Windows基准不是Linux像素或不同字体环境的验收。

### 通用视口实测

视口阶段在独立通用夹具使用真实OpenLayers矢量、ECharts Canvas和Element Plus，
包含Dev/Build各20组工作区、8组contain/width局部画布、2组400ms实例稳定检查。
实际浏览器zoom由扩展tabs.setZoom校验，不是viewport、DPR或CSS zoom模拟；
记录innerWidth/innerHeight、DPR、工作区与浮层矩形、地图点击误差及resize计数。
五种校准内容尺寸为1280×720、1366×768、1440×900、1920×1080、2560×1440，
各覆盖80/100/125/150%。窄窗口与模板五视口另由模板矩阵覆盖。
KeepAlive返回保持地图实例/中心/zoom，系统页14px和无transform隔离，Teleport弹层有真实交互断言。
本次50项均通过、24张PNG尺寸匹配，Dev/Build的运行时/页面/控制台错误均为空；
最大地图点击误差为`1.2710574864626038e-13`CSS px。
400ms稳定窗口内，Build地图resize为26→26、图表27→27，Dev分别23→23与24→24，
每次均仅一个地图和图表实例。本次夹具Vite构建446ms、2354modules，
不复用第4轮15.40s或更早457ms计时，也不据此宣称性能提升。
这不是省级原页面、物理显示器DPI或多屏切换验收。

## E. 性能与体积

### 已完成的Admin矩阵

本轮`scaffold-report.json`已包含全部12组主矩阵、12组通过的生产浏览器和4组可选模块，
对应TEMP标识`9FX3Qt`，不是归档第4轮报告。
下表单位为bytes；“入口”仅入口依赖图，“首路由”包含初次登录路由，“总量”为全部JS/CSS逐文件gzip之和，
不等于首次网络传输。各项目开发依赖均为13个；Minimal/Standard运行时7个，Vben为8个。

| Admin场景              | 入口JS gzip | 首路由JS gzip | 总JS gzip | 总CSS gzip |
| ---------------------- | ----------- | ------------- | --------- | ---------- |
| minimal/local/hash     | 167,852     | 181,106       | 210,103   | 42,372     |
| minimal/local/history  | 167,852     | 181,107       | 210,105   | 42,372     |
| minimal/http/hash      | 170,796     | 184,050       | 213,047   | 42,372     |
| minimal/http/history   | 170,802     | 184,057       | 213,054   | 42,372     |
| standard/local/hash    | 181,115     | 193,288       | 381,400   | 43,174     |
| standard/local/history | 181,108     | 193,280       | 381,391   | 43,174     |
| standard/http/hash     | 183,858     | 196,029       | 378,589   | 43,174     |
| standard/http/history  | 183,862     | 196,034       | 378,606   | 43,174     |
| vben/local/hash        | 183,962     | 196,144       | 394,391   | 43,456     |
| vben/local/history     | 183,961     | 196,145       | 394,413   | 43,456     |
| vben/http/hash         | 184,542     | 196,708       | 388,365   | 43,456     |
| vben/http/history      | 184,541     | 196,706       | 388,363   | 43,456     |

4组模块组合均为Local/Hash；仅所选业务文件生成，不用全量模块证明精简项目可用。

| 可选模块场景         | 入口JS gzip | 首路由JS gzip | 总JS gzip | 总CSS gzip |
| -------------------- | ----------- | ------------- | --------- | ---------- |
| standard/none        | 176,967     | 189,092       | 296,923   | 42,802     |
| standard/system      | 180,868     | 193,034       | 379,548   | 43,174     |
| standard/examples    | 177,608     | 189,772       | 344,848   | 42,802     |
| vben-compatible/none | 178,980     | 191,145       | 350,857   | 43,084     |

### 29e474e模板基线对照

前序`scaffold-comparison.json`以实际开发基线`29e474e`比较，三预设Local/Hash各在两侧全新目录生成同名应用，
本次未重跑该历史比较；对应报告亦保留在`previous-attempt4-evidence/`。
两侧共用该次候选tarball，基线package.json及lockfile对齐当时的消费者。
这是归一化后的**模板比较，不是旧npm发布包原样升级性能**；
原始生成依赖数另行记录，不能把新增开发工具解释成运行时代码增量。
归一化后resolved依赖分别为509/509/510，installed instances为430/430/431，两侧均不变。

| 指标（前→后）       | Minimal         | Standard            | Vben Compatible     |
| ------------------- | --------------- | ------------------- | ------------------- |
| 原生成runtime依赖数 | 7→7             | 7→7                 | 8→8                 |
| 原生成dev依赖数     | 9→13            | 9→13                | 9→13                |
| JS raw bytes        | 582,682→582,680 | 1,101,658→1,101,656 | 1,133,478→1,133,476 |
| CSS raw bytes       | 312,075→312,075 | 313,697→313,697     | 314,241→314,241     |
| 总JS gzip bytes     | 210,108→210,103 | 381,414→381,400     | 394,414→394,391     |
| 总CSS gzip bytes    | 42,372→42,372   | 43,175→43,174       | 43,457→43,456       |
| 入口JS gzip bytes   | 167,855→167,852 | 181,112→181,115     | 183,977→183,962     |
| 首路由JS gzip bytes | 181,110→181,106 | 193,285→193,288     | 196,160→196,144     |
| 安装秒数            | 13.653→13.587   | 17.804→14.220       | 13.429→14.169       |
| 构建秒数            | 2.457→2.372     | 2.536→3.056         | 2.626→2.744         |

每侧安装和构建各采一次热缓存样本，不做速度倍数或稳定性能结论；
几个bytes的gzip差异不视为性能优化。没有上调既有预算。

### Blank与Screen最终矩阵

本轮`project-templates-report.json`已是完整14组，TEMP标识`V6Zeb0`；全部安装、lock冻结复装、check、
格式幂等和五种视口生产浏览器通过，不再引用旧3组筛选快照。
下表均为bytes，直接开发依赖均12个，运行时依赖只计package.json声明，不含dev或传递依赖。

| 新模板场景       | 运行时依赖数 | JS raw  | CSS raw | 入口JS gzip | 总JS/CSS gzip    |
| ---------------- | ------------ | ------- | ------- | ----------- | ---------------- |
| blank            | 1            | 61,651  | 192     | 24,028      | 24,028 / 175     |
| screen-static    | 1            | 63,513  | 1,131   | 24,855      | 24,855 / 543     |
| screen-hash      | 2            | 89,199  | 1,131   | 34,071      | 34,071 / 543     |
| screen-history   | 2            | 89,089  | 1,131   | 34,038      | 34,038 / 543     |
| screen-local     | 1            | 64,645  | 1,131   | 25,276      | 25,276 / 543     |
| screen-http      | 2            | 71,442  | 1,131   | 27,909      | 27,909 / 543     |
| screen-demo-auth | 2            | 70,735  | 1,555   | 27,646      | 27,646 / 643     |
| screen-auth-only | 2            | 77,313  | 1,555   | 30,125      | 30,125 / 643     |
| screen-auth-http | 3            | 103,706 | 1,555   | 39,539      | 39,539 / 643     |
| screen-charts    | 4            | 583,008 | 3,442   | 200,247     | 200,247 / 1,097  |
| screen-datav     | 3            | 101,909 | 23,926  | 35,249      | 35,249 / 4,709   |
| screen-cockpit   | 4            | 270,390 | 431,031 | 81,444      | 100,714 / 57,618 |
| screen-width     | 2            | 69,691  | 1,327   | 27,004      | 27,004 / 603     |
| screen-units     | 2            | 69,688  | 1,327   | 27,006      | 27,006 / 605     |

Blank此前没有对应模板，不虚构改造前大小。
Charts/DataV/Cockpit增量只与同轮静态Screen比较，不与包含三引擎的验收夹具混比。
其中Charts总JS/CSS增量为175,392/554bytes，DataV为10,394/4,166bytes，
Cockpit为75,859/57,075bytes；DataV/Cockpit场景含显式contain视口，后者还包含Element Plus必要样式。
这些是完整生成场景增量，不是单一包的体积；Cockpit入口81,444bytes不等于总JS100,714bytes。
Blank与静态Screen的运行时都只有Vue，没有隐式Core、Router、Pinia或Element Plus。

### 现有发布预算

本次完整门禁artifact通过后，串行重建Cockpit/DataV Guide，再独立执行
`release:budgets --require-all`读取全部当前构建产物并通过，未修改原有预算。

| 应用              | 首屏JS gzip/预算  | 首屏CSS gzip/预算 |
| ----------------- | ----------------- | ----------------- |
| lumal-admin       | 312,398 / 335,000 | 42,591 / 50,000   |
| lumal-cockpit     | 703,778 / 800,000 | 71,192 / 80,000   |
| lumal-datav-guide | 417,327 / 850,000 | 46,286 / 55,000   |
| vben-compat-demo  | 285,636 / 300,000 | 40,627 / 45,000   |

轻量消费者gzip为Vue23,303bytes、minimal26,090bytes（增量2,787）、
request2,741bytes、DataV charts初始26,395bytes。不同夹具和模板不能混用作同条件升级比较，
本次与历史报告的少量gzip差异亦不构成性能收益证据。

### 已完成的真实消费者对照

以下是相同省级源码和占位环境的实际产物，候选c2dd616公共运行时证据不受后续生成器修复影响，
但不包含本次DataV首帧事件修复；本次没有再次执行真实消费者隔离升级。
gzip逐文件压缩后求和，不包含私有静态资产，不等于首屏传输。

| 项目                             | 0.0.4基线 | c2dd616候选 | 增量   |
| -------------------------------- | --------- | ----------- | ------ |
| 直接dependencies/devDependencies | 15 / 18   | 15 / 18     | 0 / 0  |
| JS文件数                         | 50        | 50          | 0      |
| JS raw bytes                     | 3,769,485 | 3,770,672   | +1,187 |
| JS gzip bytes                    | 1,202,677 | 1,203,085   | +408   |
| CSS文件数                        | 5         | 5           | 0      |
| CSS raw bytes                    | 721,073   | 722,181     | +1,108 |
| CSS gzip bytes                   | 132,156   | 132,249     | +93    |

总gzip增加501bytes，不能据单次安装/构建计时宣称性能倍数提升。
视口包本轮构建约6.77kB ES / 2.51kB gzip，仅Vue peer。
视口实验室显式包含Element Plus、OpenLayers、ECharts，约375.66kB JS gzip /49.63kB CSS gzip，
是集成验收工具，不是基础模板或视口包预算。
400ms静止窗口地图/图表resize计数均不增长，只证明本次观察没有持续循环，
不代替CPU、内存、长时间泄漏或真实业务性能基准。

## F. 提交与剩余事项

分支为`codex/lumal-project-types-and-quality`，基线历史保留，无强推或重写。
以下为实际`git log --reverse 29e474e..HEAD`，截止cf9940e；最终报告提交另以Git历史为准。

| Commit    | 变更摘要                             |
| --------- | ------------------------------------ |
| `095dd74` | 工程质量工具、模板格式与开发规范     |
| `09f19aa` | Blank与独立Screen项目层              |
| `e69f62b` | 可选认证与业务数据请求               |
| `cab24b7` | 统一三级容器适配与视口包             |
| `531c1ee` | 定向启用的Vite视口CSS转换            |
| `f1bcab5` | 可视化与容器适配模板按需组合         |
| `751a0a5` | 会话切换后迟到认证失败隔离           |
| `e70adb4` | 原生跨页序号与选中行导出             |
| `3bacd9a` | 单Router后台与访客Screen契约         |
| `38e6d82` | 按会话隔离过期通知                   |
| `5ec6a75` | 模板质量与视口消费者CI门禁           |
| `e4749f8` | 预处理样式来源边界修复               |
| `f1293de` | 不可重放写请求的迟到401隔离          |
| `0bf5ab6` | 真实浏览器缩放与局部浮层交互         |
| `235cc01` | 三种布局内容最大化生产回归           |
| `30ba160` | 新入口与消费包发布边界               |
| `c2dd616` | 凭据切换、刷新与Abort竞态补全        |
| `4809f68` | 真实消费者隔离升级、迁移与P2审查文档 |
| `6413a8b` | 合并后devDependencies稳定排序        |
| `fa9e777` | CLI路由模式与默认值帮助说明          |
| `3ee7188` | 排除历史验收产物的重复测试发现       |
| `df79be9` | 模板规范、公共入口与发布说明         |
| `1a53243` | 记录依赖数量并明确模板比较基线       |
| `9276c3d` | 保留断言并等待生产布局稳定后验收     |
| `fdab429` | 完成前序下一阶段与真实视口验收报告   |
| `8978085` | 保证静态图表首帧事件通知             |
| `0b8fd15` | 固定视觉时点并验证跨加载一致性       |
| `5e96325` | 三轮视觉门禁与跨平台终端附件保护     |
| `cf9940e` | 首帧监听、容器布局与候选发布门禁说明 |

PR：本轮尚未提供已创建的PR地址；不能用本地分支或静态工作流代替远端审核。
前序第4轮完整门禁、严格预算及文档生产构建已通过，历史交付提交以Git记录为准。
`fdab429`已提交前序两份验收报告；权限恢复后的四组本地提交已完成，
本次完整门禁、补充应用构建、严格预算及终稿文档检查/构建均已通过。
两份验收终稿随本轮本地提交交付，精确提交以Git历史为准。
不发布、不打Tag、不部署，主链通过不等于允许跳过下列残余验收。

明确未完成事项：

- Linux PTY、本轮Ubuntu CI与远端分支推送/审核证据未取得。
  仓库约定不自动推送；取得明确推送/Draft PR授权后才能触发候选CI，不能将工作流静态检查写成Linux实跑。
- 真实后端、上传、生产权限、业务Dashboard改造/浏览器验收和部署未执行。
- 省级原门禁的环境断言、既有图标失败与未执行部署suite仍需业务升级流程处理；
  不能直接删除原patch或宣布整站升级成功。
- 小流域完整迁移、真实OpenAPI Schema生成与未经收益验证的增量生成器不在已交付功能之列。
