# 三模板与 Vben 5 升级验收

本文保留升级阶段的本地验收与版本准备事实；2026-10-21 的后续托管门禁、
标签和 npm 发布执行另见 [0.0.5-beta 发布记录](./npm-release-0.0.5-beta.md)。

本轮基于 Lumal `4112ecc`，环境为 Windows、Node.js 24.14.1、pnpm 10.33.0。
系统为 Windows 11 10.0.26200 x64，CPU 为 Intel Core Ultra X7 358H
（16 核/16 逻辑处理器），系统报告物理内存 33,873,752,064 bytes。
参考 Vben 官方 `v5.7.0`，SHA `63a38dce49ba109f61607994e21ba921d8e970e9`。
能力起点与源码位置见 [升级审计](./upgrade-audit.md)，逐项兼容边界见
[迁移说明](./migration-from-vben.md)。

## 验证方法

`pnpm test:create-consumer` 打包真实 npm 资源，在仓库外安装 CLI 和公开包 tarball，
而不是用 workspace alias。每个预设覆盖 Local/HTTP 与 Hash/History，共 12 个组合。
每个项目独立执行安装、类型检查、测试、Lint、生产构建和 Chromium 交互；
HTTP 测试通过真实 Node HTTP 服务发送网络请求，不替换 fetch。
生产 Local 演示仅在本轮验收时显式启用，模板默认生产环境仍禁止演示登录。
本次仓库使用 Vitest 4.1.10，独立项目解析到 Vite 8.3.4 / Vitest 4.1.12；
各独立项目的实际 lockfile 随本轮临时目录保留，不假定未来范围安装会解析到相同版本。

浏览器覆盖深层链接登录与刷新恢复、用户权限菜单、主题、设置、标签缓存、
原生 Schema 校验和联动、用户新增编辑删除、V5 日期选择/动态字段/查询分页/
列设置/CRUD/失败重试，以及 guest 的 403 和 390px 无页面级横向溢出。
旧入口回归与组件卸载、在途请求隔离由包测试补充，不用类型成功代替交互验证。

详细消费者数据写入 `output/release/scaffold-report.json`；
生产截图写入 `output/playwright/scaffold`。这些是本地可再生产物，不随 npm 发布。

## 三模板矩阵

| 能力/依赖 | minimal | standard | vben-compatible |
| --- | --- | --- | --- |
| Vue、TypeScript、Vite、Element Plus | 有 | 有 | 有 |
| Core/minimal、图标、Router、请求与认证 | 有 | 有 | 有 |
| Local/HTTP、Hash/History、动态菜单与权限 | 有 | 有 | 有 |
| 403/404、主题、偏好 | 有 | 有 | 有 |
| 标签栏、缓存与刷新 | 内置，默认关闭 | 默认启用 | 默认启用 |
| 用户、角色授权、菜单、机构、字典、配置 | 无 | system 可选，默认有 | 同 standard |
| Schema Form、CRUD 示例 | 无 | examples 可选，默认有 | 同 standard |
| V5 Form/Grid、Dialog CRUD、权限迁移页 | 无 | 无 | 有 |
| 额外运行时 | 无 | 无新增框架包 | @lumal/vben-compat |
| VXE、图表、DataV、驾驶舱、富文本、i18n | 不默认安装 | 不默认安装 | 不默认安装 |

standard 的管理模块是生成应用层的基础业务 CRUD，不是 Core 内置业务平台，
也不承诺 Demo 所有批量操作与组织树工作流。复杂行业规则、上传协议、
自定义控件与后端授权仍属于业务应用。三个模板均包含测试、Lint、类型检查、
环境示例、公开路径导入和生产部署说明。

## 单元测试规模

升级代码验收时完整工作区的根命令 `pnpm test` 实际通过 881 项，分布如下。
这些是仓库测试，不把后面的消费者重复组合或浏览器流程混入此数量。
其中包含工作区并行存在的用户域名/文档回归修改；这些无关改动保留但不纳入升级提交。

| 测试组 | 通过项数 |
| --- | ---: |
| scripts | 59 |
| Icons / Icons Vue | 42 / 27 |
| Core | 347 |
| Charts / DataV / Cockpit | 12 / 74 / 59 |
| Vben Compat | 35 |
| Vite | 5 |
| create-lumal-admin | 41 |
| Mock API | 14 |
| Admin / Cockpit App | 150 / 16 |
| 合计 | 881 |

生成器覆盖 12 个文件组合、可选层、非法名称、非空目录、文件/junction、
并发用户文件、写入失败恢复与 CLI 参数；新增的 5 个边界回归先得到
5 failed / 35 passed，再修复至 40 passed；迁移用户页另增加不依赖可选
system 层的资源权限回归，先得到 1 failed / 40 passed，修复后 41 passed。
固定标签另通过生产 HTTP 多角色场景验证；minimal 先验证默认关闭，
再通过真实设置开关启用标签。
CI 浏览器前置条件回归先得到 1 failed / 23 passed，再补齐安装与顺序约束；
删除 Chromium 安装或将其移至消费者之后都会失败，脚本组最终 59 项通过。

## 性能口径

`scripts/measure-admin-build.mjs` 同时读取锁文件、实际安装实例和 Vite manifest。
JS/CSS 分别累计 raw bytes 与逐文件 gzip；初始路由统计入口、静态依赖和登录布局。
Vben 通过动态 import 加载的 bootstrap 单独纳入启动闭包，路由增量不重复计算该闭包。
这不是浏览器传输时间、LCP 或长期缓存命中率测试。

Vben 完整参考工作区安装和 `pnpm build:ele` 成功，11 个任务全部通过，
完整墙钟 130.684 秒；额外应用 manifest 构建 Vite 日志为 7.64 秒。
Vben 使用其 `packageManager` 指定的 pnpm 10.33.4；Lumal 使用 10.33.0，
两者均使用本机 Node.js 24.14.1。首次 Vben Turbo 构建为 0 个缓存命中，
其中 web-ele 的 Vite 构建为 28.76 秒；后续 manifest 构建不能冒充首次冷构建。
参考锁文件含 1,998 个 snapshots，实际安装实例 1,728；
应用总 JS 3,013,990 bytes、CSS 369,137 bytes，gzip 分别为 996,955 / 62,895 bytes。
入口 gzip 86,118 bytes，含 bootstrap 的启动闭包 354,948 bytes，
含认证布局与登录页的初始路由 400,775 bytes。
基础表单额外 JS gzip 22,054 bytes，工作台路由额外 231,038 bytes。

参考项目包含更多路由、图表、国际化和管理基础设施；完整工作区依赖数与
独立模板安装数不是相同功能口径。不能由这些结果推导“同功能快多少倍”。
Vben 未在本轮执行原仓库全套测试或生产部署；只审查固定源码并构建选定应用。

### 模板实测样本

以下数值取自本轮 `scaffold-report-release-ready.json` 的 Hash 组合，
完整 12 组合另保存在 `output/release/scaffold-report.json`。
时间为秒，体积为 bytes；依赖数列分别是 lockfile snapshots / 实际安装实例。
这两个数均包含开发工具，不是框架运行时直接依赖数。

| 预设 | 数据源 | 依赖数 | 安装 | 构建 |
| --- | --- | ---: | ---: | ---: |
| minimal | Local | 473 / 414 | 15.669 | 1.855 |
| minimal | HTTP | 473 / 414 | 14.910 | 1.925 |
| standard | Local | 473 / 414 | 16.174 | 1.952 |
| standard | HTTP | 473 / 414 | 14.545 | 2.301 |
| vben-compatible | Local | 474 / 415 | 17.982 | 1.875 |
| vben-compatible | HTTP | 474 / 415 | 14.383 | 1.906 |

| 预设 / 数据源 | JS raw | CSS raw | JS gzip | CSS gzip | 初始路由 JS gzip |
| --- | ---: | ---: | ---: | ---: | ---: |
| minimal / Local | 575,382 | 310,887 | 207,134 | 42,174 | 178,615 |
| minimal / HTTP | 583,597 | 310,887 | 209,941 | 42,174 | 181,423 |
| standard / Local | 977,674 | 310,887 | 332,523 | 42,174 | 186,395 |
| standard / HTTP | 985,886 | 310,887 | 335,341 | 42,174 | 189,275 |
| vben-compatible / Local | 1,002,630 | 311,430 | 342,485 | 42,339 | 187,063 |
| vben-compatible / HTTP | 1,010,842 | 311,430 | 345,387 | 42,339 | 189,954 |
| Vben 5.7.0 web-ele | 3,013,990 | 369,137 | 996,955 | 62,895 | 400,775 |

Vben 首次应用 Vite 构建为 28.76 秒，11 任务完整构建为 130.684 秒；
不能与上表只含应用 Vite 构建的进程时间直接求速度倍数。
History 也分别完成安装、测试、生产构建和浏览器验证，全部结果保存在完整 JSON 中。

### 懒加载与可选增量

以下为 Local/Hash 首次访问路由在启动闭包之外的额外 JS gzip，
包含该页面第一次需要的共享块，不代表该页面自身 SFC 的大小。

| 预设 / 页面 | 额外 JS gzip bytes |
| --- | ---: |
| minimal / 工作台 | 2,327 |
| minimal / 设置抽屉 | 4,963 |
| standard / Schema Form | 130,385 |
| standard / CRUD 示例 | 130,473 |
| standard / 系统管理 | 132,038 |
| vben-compatible / 迁移表单 | 136,997 |
| vben-compatible / 迁移用户 | 138,001 |
| Vben / demos/form/basic | 22,054 |

Vben 已在 bootstrap 支付较多公共运行时成本，表单路由增量因此不能脱离启动闭包比较。
当前 standard 的部分错误路由也与业务 UI 共用块，首次访问 403 的额外 JS gzip
为 130,251 bytes；这是当前分包限制，不将该共享成本隐藏为页面的几 KB。
minimal 没有装载这些 Schema/CRUD 页面，403 路由增量为 1,235 bytes。

以 standard Local/Hash 的 `--features none` 为基线：
JS gzip 为 207,132 bytes、初始路由 JS gzip 为 178,614 bytes。
四个可选组合均实际安装并执行类型、测试、Lint 和构建，
其中兼容预设的 none 只关闭 system/examples，仍保留迁移页面。

| 组合 | 构建秒数 | JS gzip 增量 | 初始路由 JS gzip 增量 |
| --- | ---: | ---: | ---: |
| standard / none | 1.886 | 0 | 0 |
| standard / system | 1.941 | 123,291 | 7,462 |
| standard / examples | 1.920 | 122,146 | 7,091 |
| standard / 默认两模块 | 1.952 | 125,391 | 7,781 |
| vben-compatible / none | 1.968 | 125,878 | 7,391 |

默认兼容模板相对默认 standard 另增加 1 个安装实例、
9,962 bytes JS gzip 和 165 bytes CSS gzip，初始路由增加 668 bytes。
增量包含生成项目名称与配置的少量差异；模块共享依赖，不能把各单模块增量相加。
所有模板都没有安装图表、DataV、Cockpit 或 VXE，也没有放宽原有构建预算。

### 复现命令

Lumal 在根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test:create-consumer
```

Windows 本轮通过 `PLAYWRIGHT_CHROMIUM_CHANNEL=chromium` 选择已安装的
Chromium 149.0.7827.55。消费者脚本先打包公开 npm 资源，再把未发布的 Lumal
依赖替换成这些 tarball；其余依赖正常独立安装，不使用源码 alias 或 workspace。
默认清理临时项目；本轮设置 `KEEP_LUMAL_CONSUMER_TEMP=1` 保留检查现场。
安装采用 `--prefer-offline`，时间含 pnpm 启动、链接和已有 store 缓存命中，
不是全新网络下载的基准。构建时间含 `pnpm exec vite build` 的进程开销，
不含类型检查；类型检查已作为独立门禁执行。每项只有一次样本，不宣称统计显著性。

在另一个目录检出 Vben 上述 tag/SHA，保持源码不变并执行：

```bash
pnpm install --frozen-lockfile
pnpm build:ele
pnpm --filter @vben/web-ele exec vite build --mode production --manifest
```

最后在 Lumal 仓库运行相同统计器，参数替换为实际参考目录：

```bash
node scripts/measure-admin-build.mjs ../lumal-vben-reference-5.7.0/apps/web-ele ../lumal-vben-reference-5.7.0/pnpm-lock.yaml
```

Vben 原始构建日志位于本机参考目录的同级 `lumal-vben-build.log`，
统一统计结果为 `output/release/vben-build-metrics.json`。
`resolvedDependencies` 是锁文件 snapshots 数，不是直接依赖数；
`installedDependencyInstances` 是 `.pnpm` 中的安装实例数，不是去重后的包名数。
路由增量包含该路由首次所需的共享块，不应将多个页面的增量直接累加。

## 最终质量门禁

下表中的 Lint、单测、类型、构建、消费者、兼容示例、边界和打包命令，
均由最终一轮 `pnpm release:check` 串行实际执行；不是根据脚本声明推测通过。
完整 E2E 入口、安装、文档、版本和 Changesets 另行执行。

| 实际命令 | 最终结果 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 通过，16 个 workspace projects，未改锁文件 |
| `pnpm lint` | 通过 |
| `pnpm test` | 通过，881 项；各组数量见上表 |
| `pnpm typecheck` | 通过，公开包、Mock 与命令声明的应用类型检查 |
| `pnpm build` | 通过，九个公开包及 Mock API |
| `pnpm test:create-consumer` | 通过，12 主组合、4 可选组合，共 82 项生成项目测试；8 项真实 CLI 参数校验、1 个无 UI peer 消费者、12 个生产 Chromium 流程 |
| `pnpm compat:build` | 通过，Legacy 与 V5 真实组件示例 |
| `pnpm release:boundaries` | 通过 |
| `pnpm test:e2e:release` | 通过，重新构建生产 Admin/Mock 后 28 项全部通过 |
| `pnpm release:check` | 完整串行门禁退出 0，生产 E2E 28 项通过，九包打包资源及现有预算通过 |
| `pnpm release:workflows` | 静态约束通过，包含 Chromium 前置顺序 |
| `pnpm release:verify --check-registry` | 通过，九包及内部依赖/lockfile 一致，目标版本全部未发布 |
| `pnpm changeset:status` | 通过，无待再次提升的版本 |
| `pnpm docs:build` | 通过，VitePress 客户端、服务端和页面渲染完成 |

TTY 交互另实际完成一次目录、包名、预设、数据源、路由及模块选择，
证据为 `output/release/tty-smoke.log`。最终主门禁日志为
`output/release/release-check-0.0.5-final-approved.log`，完整 E2E 日志为
`output/release/e2e-release-0.0.5-final-approved.log`，文档日志为
`output/release/docs-build-0.0.5-final-approved.log`。
registry 逐包版本/tag 只读快照为 `output/release/registry-0.0.5-final-approved.json`。
最终未解决的测试或构建失败为 0；先红后绿的回归日志单独保留，不混入最终通过数量。

Windows 独立安装日志存在 pnpm 为 Vite 嵌套可选 Sass CLI 创建 shim 的
ENOENT 警告，以及 ESLint 9 的上游弃用提示。本轮实际 SCSS 编译由显式安装的
sass-embedded 完成，所有生成项目的 Lint、类型与生产构建成功；
没有通过关闭检查或忽略异常取得通过，也不将日志描述为“零警告”。

## 重要修改

| 位置 | 改造与行为 |
| --- | --- |
| `packages/create-lumal-admin/src/{cli,create,presets,templates}.ts` | 参数/交互、选项、安全写入与回滚、资源组合分离；scaffold.ts 只保留旧导出 |
| `packages/create-lumal-admin/templates/{base,modes,features,vben-compatible}` | 公共层、数据源层、可选业务层、迁移页分层，完整资源随 npm 包发布 |
| `templates/base/src/services` 与 `modes/http/src/services` | 应用服务契约、用户权限菜单初始化、401 刷新重放、会话隔离和显式字段 adapter |
| `packages/vben-compat/src/v5` | Form/Grid 组件返回结构、受限泛型、校验/查询/事件/插槽、权限与纯数据路由入口 |
| `packages/core/src/components/schema-form` | show 与 if 的渲染差异、提交禁用、取消浏览器原生 required 对 Schema 校验的拦截 |
| `packages/core/src/request/client.ts` | 清缓存时断开旧刷新 Promise，旧请求不能复用或覆盖新会话刷新 |
| `apps/vben-compat-demo` 与模板 migration 组件 | 保留 legacy 实例，新增真实 Form、Grid、Dialog CRUD 与权限场景 |
| `scripts/{check-create-lumal-admin-consumer,scaffold-verification,measure-admin-build}.mjs` | 实际 tarball、无 UI peer 消费者、12 组合、HTTP 服务、生产 Chromium 和统一性能统计 |
| `.github/workflows/build-validation.yml` 与工作流校验/测试 | PR 消费者准备 Chromium；删除安装步骤或将其移到消费者之后都会被静态门禁拒绝 |
| `docs/upgrade-audit.md`、`docs/migration-from-vben.md`、仓库 `skills/lumal` | 源码矩阵、逐项契约、迁移等级、公开路径和使用限制同步 |

九包采用现有 fixed-group 策略，已运行 `pnpm release:version 0.0.5-beta`，
同步内部精确依赖、14 个 workspace manifests、lockfile、九份 CHANGELOG
及 Changesets 汇总记录。2026-10-20 只读核对 registry：九包均不存在
`0.0.5-beta`，beta 仍为 `0.0.4-beta`，latest 为 `0.0.1-beta`。
这里是本地版本准备，不表示 registry 已可安装新版。
没有执行 npm 发布、dist-tag 修改、Git tag 创建/推送、远端推送或生产部署。
本轮同时出现的域名和文档入口用户修改保留在工作区，不纳入升级提交。

## 支持边界

- standard 提供基础业务 CRUD 与角色授权，不包含演示应用所有批量组织工作流。
  文件上传、下载、字典缓存和重复提交等沿用 Core 已有能力，不新增私有协议。
- `/v5` 只承诺迁移矩阵列出的子集。完整 VXE、虚拟编辑、renderer、
  任意控件注册、完整 Tailwind/VeeValidate、Vben Modal/Store/preferences 运行时不在兼容范围。
- 显式泛型、复杂布局、Zod transform、弹窗业务及高级表格需要按文档调整；
  不将“类型检查通过”描述为整页可直接替换导入。
- HTTP 验证基于真实本机 Node 服务和现有 Mock adapter，不等同于接入某个公司的
  生产后端；其业务权限、审计、CORS、Token 存储及上传协议仍需应用部署方确认。
- 浏览器覆盖 Chromium；未执行 Firefox/WebKit、跨操作系统或 Vben 原仓库全套 E2E。
  History fallback 在本机生产静态服务验证，未修改或验证线上 Nginx/CDN 配置。
- 工作流做了本地静态与回归校验，没有触发 GitHub Actions 托管任务，
  更未触发带发布凭据或生产部署的作业。
- 没有运行冷网络安装、多次统计基准、LCP 或真实用户监控；本报告只给可复现的
  安装实例、构建样本、静态字节和已执行的功能验收。

## Skill 与文档同步补验

2026-10-21，基于升级提交 `14c7d2a` 补齐仓库 Skill、脚手架指南、Core 请求说明和文档索引，
并同步本机已安装的 Lumal Skill。14 个分发文件的 SHA256 与仓库一致，宿主元数据未改动，
未删除安装目录额外文件。这里记录专项补验，不重新声明执行过上一节全部发布门禁。

- `pnpm test:scripts`：8 个文件、86 项通过，含新增 27 项 Skill 分发检查。
  检查 YAML 发现元信息、可独立分发的相对链接、示例引用的公开 exports；
  不将其描述为完整的示例类型或组件行为验证，也不回填先前 881 项全仓测试记录。
- `pnpm lint`：完整工作区检查通过。
- Skill Creator `quick_validate.py`：仓库版本与安装副本均通过，使用 UTF-8 读取中文。
- `pnpm docs:build`：VitePress 客户端、服务端和页面渲染通过。
- 本次只改文档、Skill 与专项测试，没有重新启动浏览器、执行 npm 发布或调整版本。
