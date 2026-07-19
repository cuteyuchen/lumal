# lumal-mock-api

为 [lumal-admin](../lumal-admin/README.md) 提供本地联调用的 Mock 后端服务，基于 [Nitro](https://nitro.build/) 实现。覆盖登录鉴权、动态菜单下发、系统管理（用户/角色/菜单/字典/组织）等接口，数据全部在内存中模拟，无需数据库。

## 技术栈

- Nitro（node-server preset）
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
| `pnpm build` | Nitro 生产构建，产物输出到 `.output/` |
| `pnpm preview` / `pnpm start` | 运行构建产物（`node .output/server/index.mjs`） |
| `pnpm test` | 运行接口单元测试 |
| `pnpm typecheck` | 类型检查 |
