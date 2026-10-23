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
系统模块包含有明确关联的开发种子数据；示例数据与系统数据分离。

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
国际化与 VXE 高级编辑均不默认安装。

```text
src/app/                     路由、认证、请求、布局接线与异常页
src/modules/dashboard/       工作台
src/modules/profile/         个人中心（标准预设）
src/modules/system/          系统父模块（可选）
  user/ role/ menu/ organization/ dictionary/ config/
src/modules/examples/        开发示例（可选）
src/modules/vben-migration/  迁移示例（仅兼容预设）
src/modules/business/        自有业务模块
src/shared/                  共享组件、类型与组合式函数
```

每个模块通过 `module.ts` 导出 menus/views/permissions，注册表只加载小型元数据，
页面使用动态 import。在 business 中新增一个子目录及 module.ts 即可注册，不需要修改中心文件；
完整接入示例见该目录 README。业务类型和强类型 API 放在模块内，不写入全局实体配置。
系统、开发示例和迁移示例各有真实父路由，权限变化后目录重定向重新计算。
HTTP 菜单使用已生成页面的 component key，并由后端提供完整菜单；不会静默混入本地菜单。
