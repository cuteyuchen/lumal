# create-lumal-admin

## 什么时候用

创建 Admin、独立 Screen 或 Blank 项目时使用。已有 Vue 应用应增量接入公开包，不在原目录运行脚手架来覆盖项目。

## 开发分支的新项目类型

新增能力未发布，不由下面历史npm命令取得。现有包内增加 `create-lumal` bin 和
`createLumalProject` API，旧 `create-lumal-admin` bin/API/defaults不变。
本地构建后可执行：

```bash
node packages/create-lumal-admin/dist/project-cli.js blank-app --template blank --no-interactive
node packages/create-lumal-admin/dist/project-cli.js static-screen --template screen --no-interactive
node packages/create-lumal-admin/dist/project-cli.js internal-screen --template screen --auth http --data http --router-mode history --no-interactive
```

Blank默认仅Vue，不能为了质量工具安装Core/Element Plus/Pinia/Router。
Screen默认也只有Vue，无API、无认证、无管理布局。
`--auth none|local-demo|http`、`--data none|local|http`、
`--router-mode none|hash|history`分别组合；HTTP认证即使data=none也会联网。
Local Demo仅开发可用，HTTP失败不能回退演示。

`--visualization none|charts|datav|cockpit`只选所需引擎，Cockpit仅runtime/external，
DataV数字/边框不安装ECharts。`--viewport disabled|responsive|contain|width|vw`
与项目类型独立，非默认适配使用 [视口](viewport.md)；Admin不接受Screen专属参数。
非Admin不能叠Admin base，不能靠先生成再删除无用文件实现轻量。

新项目均生成独立ESLint/Prettier/EditorConfig、AI规范和统一check。
首次install生成lockfile，再frozen复装；完成前运行 `pnpm check`。
`pnpm test:create-projects`覆盖14组独立消费者；旧Admin矩阵继续保留。
通用bin不等于已发布 `create-lumal` npm包；名称查询未占用也不代表取得发布权。

## 命令与版本选择

环境基线：Node.js 22.12+、pnpm 10.33.0。下列命令对应 `0.0.5-beta` 的公开 API，
不代表 npm 最新版本；接入前核对 registry 与实际安装的声明。
开发未发布源码时使用真实 tarball 验证，不用旧 CLI 的 `beta/latest` 标签代替新版能力。

```bash
pnpm create lumal-admin@0.0.5-beta my-admin
pnpm create lumal-admin@0.0.5-beta my-admin-http --preset standard --api-mode http --router-mode history --no-interactive
pnpm create lumal-admin@0.0.5-beta my-admin-v5 --preset vben-compatible
```

npm 等价命令：

```bash
npm create lumal-admin@0.0.5-beta my-admin -- --api-mode http
```

工作区新版使用 Clack 方向键单选、Space 多选、Enter 确认，摘要确认前不写文件；
Escape / Ctrl+C 取消。此升级尚未发布，应使用本地 tarball，不将 `0.0.5-beta` npm 包视为已含新向导。
TTY 提问目录、名称、预设、数据源、路由和可选模块；非 TTY/CI 自动禁用交互。
默认 `standard/local/hash`，省略目录时为 `lumal-admin`。显式指定的参数不会再次提问。
自动化命令可加 `--no-interactive`，用 `--name` 指定与目录不同的 npm 包名；
`--help`、`--version` 不生成文件。生成完成后进入新目录安装依赖并启动：

```bash
cd my-admin
pnpm install
pnpm dev
```

- 需要“最新版本”时先查询 registry 的版本和 dist-tag，再选择精确版本或明确标签。Beta 不保证标在 `latest`。
- 全局安装较新 CLI 不保证 `npm create lumal-admin` 使用该版本；命令应显式指定目标版本，不优先建议清空所有 npm 缓存。
- 先确认目标目录不存在或为空。不要删除非空目录来强行让创建成功。
- 不支持 `--force`；文件、符号链接和含链接的祖先路径会被拒绝。写入失败只清理本次拥有的文件及空目录，不递归删除用户目录。

## 生成范围

- Vue + TypeScript + Vite + Element Plus。
- `@lumal/core/minimal` 启动、公开包导入和必要 SCSS/CSS。
- 三预设均有动态路由、权限、认证、403/404、布局、标签缓存、主题偏好和应用服务；minimal 的标签与缓存默认关闭，可在偏好中启用。
- minimal 不含管理模块与 Schema 示例；standard 默认包含 system/examples，可用 `--features` 选择单个或 `none`。
- system 拥有真实父路由和用户、角色授权、菜单、机构、字典类型/项及配置独立页面，业务代码不进入 Core。
- standard 还包含轻量工作台与个人中心，密码变更必须由真实服务确认。
- vben-compatible 在 standard 上增加 `/v5` 和真实 Form/Grid/Dialog CRUD/权限迁移页面，读 [迁移参考](vben-compat.md)。
- HTTP 真实请求登录/刷新/用户/权限/菜单/退出，无配置明确失败，不回退 Local。
- Local 账号是开发演示，生产默认禁用；HTTP 无演示凭据。API 契约、环境配置、Lint 和测试均随项目生成。
- 不默认安装 Charts、DataV、Cockpit、VXE、Zod、富文本或 i18n。

模板生成后业务接口、权限模型和存储策略属于应用；不要把 Demo 的 Mock 凭据、菜单或公司状态码写进公共包。

## 接入真实后端

- 按生成项目 `API-CONTRACT.md` 配置 `VITE_API_BASE_URL`；`VITE_API_ADAPTER` 默认为 `standard`，只有显式接入 Lumal Mock API 时才选择 `lumal-mock`。
- `src/app/services/contracts.ts` 是应用服务接口；Local/HTTP 的 `data-source.ts` 实现同一接口，`http-adapter.ts` 负责业务包装、Token、用户、权限、菜单和分页字段转换。
- `src/modules/system/<子模块>/api.ts` 提供强类型业务 API；Local 与 HTTP 共享专用端点。角色资料与授权是两个操作，不宣称事务原子性；授权成功后刷新失败明确提示并只重试刷新。
- 登录后必须等待用户、角色权限和菜单初始化，再注册动态路由并重新匹配首次深层链接；已有 Token 也不能跳过初始化。
- 退出、重新登录或刷新失败统一清理会话、权限、菜单、动态路由、缓存与标签。请求携带会话 AbortSignal，并在写入新 Token 或用户状态前验证会话仍有效。
- GET 401 单飞刷新并最多重放一次，写请求默认不重放；刷新接口使用独立公共客户端，避免递归刷新。`createApplicationSession` 是生成应用的实现，不是 Core 的公开 API。
- `.env.production.example` 说明生产配置；`VITE_*` 会进入客户端产物，不能放密钥。History 部署应回退非文件页面到 `index.html`，不能将 API 回退到 HTML。

## 模块注册

运行基础位于 `src/app`，共享能力位于 `src/shared`；模块位于 `src/modules`。
新增 `modules/business/<业务>/module.ts`，导出 `AppModule` 的 `menus/views/permissions`，
扫描器自动装配元数据。页面白名单使用动态 import；不要任意拼接后端组件路径。
system/examples/vben-migration 各有父路由和独立目录，未选择的可选模块不生成。
菜单路径必须为所属父路由下的绝对路径，目录重定向按当前可访问子项计算。

## 编程 API 与维护

根入口导出 `createLumalAdminProject`。`targetDir/name` 必填；
`preset/apiMode/routerMode/features` 均可省略，默认标准预设包含 `system/examples`，minimal 默认无模块。
`--features none` 对应编程 API 的 `features: []`，不是字符串；minimal 不能启用业务模块。CLI 是 `create-lumal-admin`。

修改模板时核对：

- 模板使用公开入口，不能导入仓库源码或 `workspace:` 依赖。
- 生成时读取随 tarball 发布的 package.json，基础三包和可选兼容包精确同版。
- 真实资源在 `templates/base/presets/modes/features/vben-compatible` 组合，不向巨型字符串回退。
- `pnpm test:create-consumer` 验证真实 CLI、12 种独立组合、真实 HTTP 与生产 Chromium。
- 改动标签、退出、Token 刷新等接线时，同时核对已有消费者和模板测试。

仓库核对位置：`packages/create-lumal-admin/src/{cli,create,presets,templates}.ts`、
`packages/create-lumal-admin/templates` 和 `scripts/check-create-lumal-admin-consumer.mjs`。
