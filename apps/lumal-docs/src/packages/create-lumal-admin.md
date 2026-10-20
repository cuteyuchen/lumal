# create-lumal-admin

轻量后台基座脚手架，生成通过公开包入口消费 Lumal 的 Vue 3 应用。

| 项 | 值 |
| --- | --- |
| 包名 | `create-lumal-admin` |
| 本地路径 | `packages/create-lumal-admin` |
| 在线文档 | https://lumal-docs-yu-chens-projects-3f7e3071.vercel.app/packages/create-lumal-admin |
| 正式地址（上线后） | `https://www.npmjs.com/package/create-lumal-admin` |
| CLI | `create-lumal-admin` |

## 使用

版本：`0.0.3-beta`，环境要求 Node.js `>=22.12.0`、pnpm `10.33.0`。以下命令显式指定版本，不依赖 npm 的 `latest` 标签。

```bash
pnpm create lumal-admin@0.0.3-beta my-admin
pnpm create lumal-admin@0.0.3-beta my-admin-http --api-mode http
```

| 选项 | 说明 |
| --- | --- |
| 默认 / `--api-mode local` | 浏览器内请求示例 |
| `--api-mode http` | 额外生成 `VITE_API_BASE_URL`、请求客户端、登录刷新示例与 `API-CONTRACT.md` |

```bash
cd my-admin
pnpm install
pnpm dev
```

## 生成内容

- Vue 3 + TypeScript + Vite + Element Plus
- `@lumal/core/minimal` 启动 + 主题与样式，显式安装 UI、路由和权限
- `LumalLayout` + `LumalRouterView`（路由驱动标签、固定首页、会话持久化、按标签刷新与 `cacheKeys` 剔除）
- 登录、会话、权限菜单、路由守卫
- 工作台、受保护页、403 / 404
- 主题与布局偏好、全局设置抽屉
- `createRequestClient` 示例与明确 vendor 分包

**不会**生成完整用户 / 角色 / 菜单 / 字典 CRUD 业务（见 `apps/lumal-admin` 示例）。

## monorepo 内调试脚手架

```bash
pnpm --filter create-lumal-admin build
node packages/create-lumal-admin/dist/cli.js my-admin
```

## 边界

- 生成项目只依赖公开包入口，不 alias 到 monorepo 源码
- 业务协议写在应用层 `API-CONTRACT.md` / adapter，不进入 `@lumal/core`
- Core 与图标包使用和脚手架相同的精确版本 `0.0.3-beta`，构建时注入
- 用户切换重建布局壳，登录前清理旧会话与标签快照；轻入口不意味着模板没有 Element Plus

维护验收：先在仓库根目录 `pnpm build`，再运行 `pnpm test:create-consumer`，检查实际 tarball 的 minimal/request 无 UI 消费及 local、HTTP 两模式的独立安装与构建。变更见 [更新日志](/reference/changelog)。
