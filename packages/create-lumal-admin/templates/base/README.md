# Lumal Admin

## 开发

Node.js 22.12+，pnpm 10.33.0。

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm preview
```

预设、数据源、路由模式和可选模块见 `src/app.config.ts`。
业务组件均显式导入，不依赖组件自动导入或 Monorepo 私有 alias。
`@` 指向 `src`，TS 与 Vite 使用相同映射。SCSS 编译使用 sass-embedded。

## 接口与认证

HTTP 接入前配置 `.env.development`，完整接口见 [API 契约](./API-CONTRACT.md)。
Local 模式是明确的开发演示，账号 `admin/guest`，密码 `lumal123`；
生产默认禁用，不应将演示模式当作生产认证。
标准业务模块使用应用服务和原生 CRUD，初始数据为空，可自行新增。

## 部署

以 `.env.production.example` 为参考创建生产配置，不提交密钥。
Vite 环境变量在构建时注入，预览前修改变量必须重新构建。
推荐同域 `/api` 反向代理和 HTTPS。History 路由需要服务器将非文件路径回退到
`index.html`，Hash 不需要；子目录部署需配置 Vite `base`。
不要将生产 API 请求回退到 HTML。上传文件限制和后端权限属于服务端职责。
localStorage Token 示例不是生产安全策略的唯一选择。

## 模块

minimal 没有管理页面与兼容层；standard 的 system/examples 是可选模板层。
系统页面的 CRUD 和 Schema 不进入 Core 的业务实现。图表、驾驶舱、富文本、
国际化与 VXE 高级编辑均不默认安装。新增页面时在 `src/modules` 声明白名单懒加载器，
并让后端菜单使用相应 component key。服务端菜单改变后需重新加载会话。
