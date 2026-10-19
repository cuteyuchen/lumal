# create-lumal-admin

## 什么时候用

创建新的独立轻量后台基座时使用。已有 Vue 应用应增量接入公开包，不在原目录运行脚手架来覆盖项目。

## 命令与版本选择

环境基线：Node.js 22.12+、pnpm 10.33.0。以下是本 Skill 对应版本的示例，不代表最新发布：

```bash
pnpm create lumal-admin@0.0.3-beta my-admin
pnpm create lumal-admin@0.0.3-beta my-admin-http --api-mode http
```

npm 等价命令：

```bash
npm create lumal-admin@0.0.3-beta my-admin -- --api-mode http
```

未指定 `--api-mode` 时为 `local`；只接受 `local/http`。生成完成后进入新目录安装依赖并启动：

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
- Router、权限、登录会话、403/404、布局、标签缓存、主题偏好和请求示例。
- `http` 模式增加环境变量、标准请求/刷新示例和 `API-CONTRACT.md`，不是完整后端服务。
- 不包含完整用户/角色/菜单/字典管理业务，也不默认引入 Charts、DataV、Cockpit 或 Vben 兼容层。

模板生成后业务接口、权限模型和存储策略属于应用；不要把 Demo 的 Mock 凭据、菜单或公司状态码写进公共包。

## 编程 API 与维护

根入口导出 `createLumalAdminProject`，传入 `targetDir/name/apiMode`；具体选项以安装版本声明为准。CLI 是 `create-lumal-admin`，不要使用历史拼写 `create-luma-admin`。

修改模板时核对：

- 模板使用公开入口，不能导入仓库源码或 `workspace:` 依赖。
- 三个 Lumal 运行时依赖由构建注入与脚手架相同的精确版本；不要只手改模板里的旧版本占位值。
- `local/http` 两条生成路径都应通过独立安装和构建。仓库提供 `pnpm test:create-consumer` 从实际 tarball 验证。
- 改动标签、退出、Token 刷新等接线时，同时核对已有消费者和模板测试。

仓库核对位置：`packages/create-lumal-admin/src/{index,cli,scaffold}.ts`、`scripts/sync-create-lumal-admin-version.mjs`、`scripts/check-create-lumal-admin-consumer.mjs`。
