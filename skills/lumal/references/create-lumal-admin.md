# create-lumal-admin

## 什么时候用

创建新的独立轻量后台基座时使用。已有 Vue 应用应增量接入公开包，不在原目录运行脚手架来覆盖项目。

## 命令与版本选择

环境基线：Node.js 22.12+、pnpm 10.33.0。以下是本 Skill 对应版本的示例，不代表最新发布：

```bash
pnpm create lumal-admin@0.0.5-beta my-admin
pnpm create lumal-admin@0.0.5-beta my-admin-http --preset standard --api-mode http --router-mode history --no-interactive
pnpm create lumal-admin@0.0.5-beta my-admin-v5 --preset vben-compatible
```

npm 等价命令：

```bash
npm create lumal-admin@0.0.5-beta my-admin -- --api-mode http
```

TTY 提问目录、名称、预设、数据源、路由和可选模块；非 TTY/CI 自动禁用交互。
默认 `standard/local/hash`。生成完成后进入新目录安装依赖并启动：

```bash
cd my-admin
pnpm install
pnpm dev
```

- 需要“最新版本”时先查询 registry 的版本和 dist-tag，再选择精确版本或明确标签。Beta 不保证标在 `latest`。
- 全局安装较新 CLI 不保证 `npm create lumal-admin` 使用该版本；命令应显式指定目标版本，不优先建议清空所有 npm 缓存。
- 先确认目标目录不存在或为空。不要删除非空目录来强行让创建成功。

## 生成范围

- Vue + TypeScript + Vite + Element Plus。
- `@lumal/core/minimal` 启动、公开包导入和必要 SCSS/CSS。
- 三预设均有动态路由、权限、认证、403/404、布局、标签缓存、主题偏好和应用服务。
- minimal 不含管理模块与 Schema 示例；standard 默认包含 system/examples，可用 `--features` 选择单个或 `none`。
- system 提供用户、角色授权、菜单、机构、字典类型/项和配置 CRUD，业务代码不进入 Core。
- vben-compatible 在 standard 上增加 `/v5` 和真实 Form/Grid/Dialog CRUD/权限迁移页面，读 [迁移参考](vben-compat.md)。
- HTTP 真实请求登录/刷新/用户/权限/菜单/退出，无配置明确失败，不回退 Local。
- Local 账号是开发演示，生产默认禁用；HTTP 无演示凭据。API 契约、环境配置、Lint 和测试均随项目生成。
- 不默认安装 Charts、DataV、Cockpit、VXE、Zod、富文本或 i18n。

模板生成后业务接口、权限模型和存储策略属于应用；不要把 Demo 的 Mock 凭据、菜单或公司状态码写进公共包。

## 编程 API 与维护

根入口导出 `createLumalAdminProject`，传入 `targetDir/name/preset/apiMode/routerMode/features`；
后三类选项有默认值，具体以声明为准。CLI 是 `create-lumal-admin`。

修改模板时核对：

- 模板使用公开入口，不能导入仓库源码或 `workspace:` 依赖。
- 生成时读取随 tarball 发布的 package.json，基础三包和可选兼容包精确同版。
- 真实资源在 `templates/base/modes/features/vben-compatible` 组合，不向巨型字符串回退。
- `pnpm test:create-consumer` 验证真实 CLI、12 种独立组合、真实 HTTP 与生产 Chromium。
- 改动标签、退出、Token 刷新等接线时，同时核对已有消费者和模板测试。

仓库核对位置：`packages/create-lumal-admin/src/{cli,create,presets,templates}.ts`、
`packages/create-lumal-admin/templates` 和 `scripts/check-create-lumal-admin-consumer.mjs`。
