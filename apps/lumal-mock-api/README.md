# lumal-mock-api

为 [lumal-admin](../lumal-admin/README.md) 提供本地联调用的 Mock 后端服务，基于 [Nitro](https://nitro.build/) 实现。覆盖登录鉴权、动态菜单下发、系统管理（用户/角色/菜单/字典/组织）等接口，数据全部在内存中模拟，无需数据库。

## 技术栈

- Nitro（默认 Vercel preset；本地独立服务使用 node-server）
- h3（HTTP 处理）
- TypeScript
- 依赖 `@lumal/core` 的类型与工具

## 本地开发

```bash
# 在仓库根目录：随全部 app 一起启动
pnpm dev

# 仅启动 admin + mock-api 联调
pnpm admin:dev

# 或在本目录单独启动
pnpm dev
```

- 开发服务器固定端口：**5320**（`nitro dev --host 127.0.0.1 --port 5320`）。
- 接口前缀：所有接口挂载在 `/api/**` 下，已开启 CORS。
- admin 通过 Vite 代理将 `/api` 转发到本服务，可用 `LUMAL_MOCK_API_TARGET` 覆盖目标地址。

## 路由说明

采用单一 catch-all 路由 `routes/api/[...path].ts` 统一分发，业务逻辑按领域拆分在 `domain/` 下：

```
api/
└── [...path].ts   # 统一入口，按 method + path 分发
domain/
├── auth.ts        # 登录、账号、改密
├── menu-seed.ts   # 动态菜单种子数据
├── permission.ts  # 权限点
└── system.ts      # 用户/角色/菜单/字典/组织的增删改查
utils/             # 通用工具
```

## 测试账号

登录相关账号定义在 `domain/auth.ts`（`mockAccounts` / `adminAccountOptions`），如需查看或调整可直接编辑该文件。

## 常用脚本

| 脚本 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器（端口 5320） |
| `pnpm build` | Nitro Vercel 生产构建，生成 `.vercel/output/` |
| `pnpm build:test` | 使用 node-server preset 构建本地服务，产物为 `.output/` |
| `pnpm preview` / `pnpm start` | 运行 `build:test` 生成的 Node 服务（`node .output/server/index.mjs`） |
| `pnpm test` | 运行接口单元测试 |
| `pnpm typecheck` | 类型检查 |

## 与生产 Admin 联调

生产 Admin 在构建时使用 `VITE_API_BASE_URL=https://lumal-mock-api.vercel.app/api`。
静态部署不包含 Vite 开发代理，不能直接把默认 `/api` 的 CI 产物覆盖到生产。
菜单、权限和应用组件白名单需使用相容的提交；包发布不会自动更新 Mock 服务。

公开服务仅用于演示，会话使用隔离的内存数据。上线核验只检查健康状态、CORS、菜单和权限，
临时登录后退出，不对其他用户会话执行 CRUD、重置或全套浏览器测试。
本版实际部署见 [0.1.1-beta 执行记录](../../docs/npm-release-0.1.1-beta.md#非-cockpit-站点与宿主-skill-更新)。
