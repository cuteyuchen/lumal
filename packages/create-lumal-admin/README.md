# create-lumal-admin

`create-lumal-admin` 保留轻量后台入口，同时提供通用 `create-lumal` 二进制，可生成 Admin、Screen 或 Blank。
本文面向候选 `0.1.0-beta`，尚未发布；发布核验前使用本包候选 tarball。
通用 binary 由本包分发，没有新增独立 `create-lumal` npm 包，不能把 `pnpm create lumal` 当成已发布命令。

## 项目类型与可选能力

```bash
pnpm --package=create-lumal-admin@0.1.0-beta dlx create-lumal my-blank --template blank --no-interactive
pnpm --package=create-lumal-admin@0.1.0-beta dlx create-lumal my-screen --template screen --design-width 1440 --no-interactive
pnpm --package=create-lumal-admin@0.1.0-beta dlx create-lumal my-api-screen --template screen --auth http --data http --router-mode history --no-interactive
pnpm --package=create-lumal-admin@0.1.0-beta dlx create-lumal my-datav --template screen --visualization datav --no-interactive
```

Blank 只安装 Vue 运行时。Screen 默认没有 Router、认证、API、Admin 或可视化依赖，
`--auth none|local-demo|http`、`--data none|local|http`、`--router-mode none|hash|history`
分别控制认证、业务数据和路由；HTTP 认证本身需要网络，不受业务数据模式影响。
`--visualization none|charts|datav|cockpit` 只加入所选可视化，Cockpit 使用 runtime，
不加载 Designer；DataV 数字/边框不安装 ECharts。

`--viewport` / `--no-viewport` 控制唯一 px→vw 规则，Admin/Screen 默认开启、Blank 默认关闭。
`--design-width` 默认1920，在生成的 `viewport.config.ts` 配置一次。
高度、字号、有单位行高、最小尺寸都按宽度换算，高度不足滚动，不作整画布 transform。
详见仓库 `docs/screen-viewport-guide.md`。
所有项目生成相同语义的 lint、format:check、typecheck、test、build 和 check。

开启时精确同版安装 `@lumal/vite` 开发依赖，在 Dev/Build 中
转换 `src/**` 的 CSS、SCSS 和可静态分析的 Vue `style/:style`，并接入 Lumal 自有 CSS。
同一配置自动注入框架运行时，静态 Screen 不安装 Viewport。
默认保留细边框，原子化类名/生成规则、明确忽略项和未知第三方来源；不扫描业务脚本。
已有项目升级依赖不会自动更改配置，新增接线需使用本次构建的候选 tarball 验证。

## 使用

环境要求：Node.js `>=22.12.0`、pnpm `10.33.0`。以下命令面向 `0.1.0-beta`，
显式指定版本，不依赖 npm 的 `latest`。源码开发时以真实 tarball 验证独立消费者，
不使用旧版 CLI 代替新版模板能力。
在线文档：https://lumal.cuteyuchen.top/packages/create-lumal-admin。

```bash
pnpm create lumal-admin@0.1.0-beta my-admin
pnpm create lumal-admin@0.1.0-beta my-admin-http --api-mode http
```

本版模块化向导不会覆盖历史发布版本；开发未发布源码时，不能用旧 CLI 代替精确 tarball 验收。

在 TTY 中依次选择目录、npm 名称、预设、数据源、路由和业务模块。单选使用上下方向键和
Enter，多选使用 Space，最后展示摘要并确认，确认前不写文件。Ctrl+C / Escape 取消不残留文件。默认
`standard / local / hash`。CI、非 TTY 或 `--no-interactive` 均使用确定性默认值，不等待输入。

```bash
pnpm create lumal-admin@0.1.0-beta my-admin --preset standard --api-mode http --router-mode history --no-interactive
pnpm create lumal-admin@0.1.0-beta my-admin-v5 --preset vben-compatible
pnpm create lumal-admin@0.1.0-beta my-minimal --preset minimal
```

| 参数 | 取值 |
| --- | --- |
| `--preset` | `minimal`、`standard`、`vben-compatible` |
| `--api-mode` | `local`、`http` |
| `--router-mode` | `hash`、`history` |
| `--features` | `system,examples`、单个模块或 `none`；minimal 不接受业务模块 |
| `--name` | 合法 npm 包名，可与目录不同 |
| `--help` / `--version` | 帮助 / tarball 自身版本 |

生成后执行：

```bash
cd my-admin
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm preview
```

## Admin 生成内容

- Vue 3 + TypeScript + Vite。
- Element Plus 作为 UI 基础。
- `@lumal/core/theme-chalk/index.scss`、`@lumal/core/style.css` 和 SCSS 样式入口。
- `@lumal/core/minimal` 启动、Router 与权限；Element Plus 组件局部导入，不注册全量 UI 插件。
- `LumalLayout` 后台布局壳和 `LumalRouterView` 路由出口，采用路由驱动标签模式：固定首页页签、`routeTabResolver` 动态追加、会话级持久化、按标签版本刷新、`cacheKeys` 联动关闭与缓存剔除。
- 登录页、会话状态、权限菜单和路由守卫。
- 工作台、403 与独立 404 页面。
- 主题切换、布局与标签偏好持久化、全局设置抽屉。
- 统一应用服务、真实 HTTP 认证与显式后端 adapter。
- Element Plus、Vue 和 Lumal 公共能力的明确 vendor 分包配置。
- `src/app` 基础设施、`modules` 独立业务、`shared` 共享能力；每个 module.ts 注册菜单、懒加载器与真实权限。
- 系统管理父路由及七个独立页面；用户批量/角色分配、独立授权树、菜单和机构树、字典关联、配置表单。
- standard 工作台和个人中心；examples 与 vben-migration 各有独立目录和父菜单。

脚手架生成的项目只通过 `@lumal/core`、`@lumal/icons`、`@lumal/icons-vue` 等公开包入口消费能力，不依赖 monorepo 内部源码路径。

| 能力 | minimal | standard | vben-compatible |
| --- | --- | --- | --- |
| 启动、布局、认证、权限、主题、请求、403/404 | 有 | 有 | 有 |
| 动态菜单、标签与页面缓存、系统偏好 | 有 | 有 | 有 |
| 用户、角色授权、菜单、机构、字典类型/项、配置 | 无 | system 可选层，默认有 | 同 standard |
| 原生 Schema Form / CRUD 示例 | 无 | examples 可选层，默认有 | 同 standard |
| Vben 5.7.0 Form / Grid / 权限迁移页面 | 无 | 无 | 有 |
| 图表、DataV、Cockpit、VXE、富文本、i18n | 不默认安装 | 不默认安装 | 不默认安装 |

三个基础 Lumal 包及可选兼容包均精确同步为脚手架自身版本。兼容预设只增加
`@lumal/vben-compat`，不安装 Vben/VXE/Zod 运行时。根及 `/legacy` 的旧契约不变；
Vben 5 页面显式导入 `/v5`，边界见生成项目 `MIGRATION.md`。

## 数据源与安全

Local 是开发演示，账号 `admin/guest`，密码 `lumal123`，Token 每次随机生成。
生产默认禁止本地演示认证；只允许演示站点显式设置 `VITE_ENABLE_LOCAL_DEMO=true`。
HTTP 模式不包含演示账号或固定 Token，未配置 `VITE_API_BASE_URL` 立即失败，不回退 Local。

HTTP 的登录、刷新、当前用户、角色权限、菜单、退出和 CRUD 均真实请求后端。
接口及 `lumal-mock` 接入说明位于生成项目 `API-CONTRACT.md`。权限状态、动态路由、
请求缓存、标签和页面缓存随会话清理；旧请求不能覆盖新登录身份。
公司包装和字段转换只写入应用 `http-adapter.ts`，不进入 Core。

不覆盖非空目录，不提供隐式 force；拒绝文件和符号链接目标。写入失败仅清理本次拥有
的文件与仍为空的目录，不递归删除目标。项目测试、类型、环境示例和部署说明一并生成；
History 部署需要服务器回退 `index.html`，不应把 API 请求回退到 HTML。

## 维护与验收

`src/cli.ts` 负责参数和交互，`create.ts` 负责安全写入，`templates.ts` 组合
`templates/base`、`modes`、`features`、`presets/standard` 和 `vben-compatible` 真实资源。
资源随 npm tarball 发布，不依赖工作区源码。

仓库运行 `pnpm build` 后执行 `pnpm test:create-consumer`：真实 tarball CLI、
无 UI 的 minimal/request 消费者、3 预设 × 2 数据源 × 2 路由独立安装/类型/测试/
Lint/生产构建及 Chromium 交互；另测可选模块体积。结果位于
`output/release/scaffold-report.json`，截图位于 `output/playwright/scaffold`。
