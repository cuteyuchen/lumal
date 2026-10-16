# Lumal Mock API

`apps/lumal-mock-api` 是官方 Admin 的演示接口服务，使用 Nitro/H3 提供真实 HTTP、JWT、权限校验和会话级内存沙箱。

## 本地运行

```bash
pnpm admin:dev
```

Admin 默认通过 `/api` 代理到 `http://127.0.0.1:5320`。Mock 数据不会写入数据库，退出、会话过期、服务重启或调用 `/api/session/reset` 后会恢复种子数据。

## 部署

分别构建前端和 Mock API：

```bash
pnpm admin:build
pnpm --filter lumal-mock-api build
```

Mock API 运行入口为 `apps/lumal-mock-api/.output/server/index.mjs`。推荐由 Nginx 将同域 `/api` 反向代理到 Nitro；跨域部署时通过 `VITE_API_BASE_URL` 指定完整 HTTPS 地址，并用 `MOCK_CORS_ORIGINS` 限制允许来源。

可配置项包括 `MOCK_JWT_SECRET`、`MOCK_ACCESS_TTL_SECONDS`、`MOCK_REFRESH_TTL_SECONDS`、`MOCK_SANDBOX_TTL_MS`、`MOCK_MAX_SANDBOXES`、`MOCK_RATE_LIMIT` 和 `MOCK_LOGIN_RATE_LIMIT`。

该服务只用于演示和接口联调，不承诺数据持久化，禁止存入真实账号、文件或敏感信息。

内置测试账号、演示密码、默认密钥和内存沙箱都不是生产认证方案。真实部署必须替换为业务后端及其密码存储、密钥管理、持久化和权限审计机制，不应直接扩展此 Mock 服务承载生产用户。
