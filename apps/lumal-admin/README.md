# lumal-admin

Lumal 中后台管理台示例应用，基于 `@lumal/core` 及其配套包搭建，演示登录鉴权、动态菜单、权限指令、SchemaForm/CrudTable、主题定制以及独立驾驶舱外链与 DataV 指南站等完整能力。

## 技术栈

- Vue 3 + `<script setup>` + TypeScript
- Vite（开发/构建）
- Vue Router 4
- Element Plus
- ECharts + vue-echarts（通过 `@lumal/charts`）
- Lumal 组件库：`@lumal/core`、`@lumal/charts`、`@lumal/icons`、`@lumal/icons-vue`

## 本地开发

本应用在开发（`vite serve`）模式下，通过 `@lumal/vite` 的 `createLumalAliases` 将 `@lumal/*` 依赖别名指向各 package 的 **源码**（`packages/*/src`），因此改动组件库源码会即时热更新，**无需先构建 dist**。生产构建（`vite build`）时才使用各包发布的 `dist` 产物。

```bash
# 在仓库根目录：一键并行启动全部 app（推荐）
pnpm dev

# 仅启动 admin + mock-api（联调后端接口）
pnpm admin:dev

# 或在本目录单独启动（需另行启动 mock-api 才能请求接口）
pnpm dev
```

- 开发服务器固定端口：**5170**（`strictPort: true`，端口被占用会直接报错而非顺延）。
- 访问地址：http://127.0.0.1:5170
- `/api` 请求通过 Vite 代理转发到 Mock API（默认 `http://127.0.0.1:5320`，见 [lumal-mock-api](../lumal-mock-api/README.md)），可用环境变量 `LUMAL_MOCK_API_TARGET` 覆盖。
- Header 中的驾驶舱入口会打开独立的 [lumal-cockpit](../lumal-cockpit/README.md) 应用；使用 `pnpm admin:dev` 时需另行启动该应用。

## 环境变量

配置文件位于本目录 `.env.development` / `.env.production.example`。

| 变量 | 说明 | 开发默认值 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 接口基础路径 | `/api` |
| `VITE_COCKPIT_URL` | 独立驾驶舱应用地址，用于 Header 外链 | `http://localhost:5180/` |
| `VITE_DATAV_GUIDE_URL` | DataV 组件指南站地址，用于页面内嵌外链 | `http://localhost:5175/` |

生产部署时复制 `.env.production.example` 为 `.env.production` 并填写真实域名。

## 目录结构

```
src/
├── api/          # 接口请求封装
├── assets/       # 静态资源
├── components/   # 应用级通用组件（头部操作、设置抽屉等）
├── composables/  # 组合式函数
├── router/       # 路由与动态菜单装配
├── services/     # 业务服务层
├── views/        # 页面视图
│   ├── about/      # 关于与构建版本
│   ├── dashboard/  # 仪表盘
│   ├── examples/   # 组件用法示例（SchemaForm、主题设置等）
│   ├── login/      # 登录
│   ├── profile/    # 个人中心
│   ├── project/    # 项目相关
│   ├── system/     # 系统管理（用户/角色/菜单/字典/组织）
│   ├── shared/     # 视图间共享
│   └── error/      # 错误页
├── echarts.ts    # ECharts 按需注册
├── App.vue
└── main.ts
```

## 常用脚本

| 脚本 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器（端口 5170） |
| `pnpm build` | 类型检查 + 生产构建（使用各 @lumal 包的 dist） |
| `pnpm preview` | 预览构建产物 |
| `pnpm test` | 构建 mock-api 后运行单元测试 |

## 构建与联调说明

- 生产构建依赖各 `@lumal/*` 包的 `dist`，构建前请先在根目录执行 `pnpm build` 生成所有包产物，或使用根目录的 `pnpm admin:build`（会先构建全部包再构建 admin）。
- 后端接口由 [lumal-mock-api](../lumal-mock-api/README.md) 提供，登录账号见该文档。

## 关于页面与版本确认

登录后从菜单进入「关于」（`/#/about`），可查看框架版本、最近构建时间（UTC+8）、源码提交标识、开源许可，以及生产 / 开发依赖的精确安装版本。

- 框架版本取自本次构建实际安装的 `@lumal/core/package.json`，不使用 demo 自身的 `0.0.0` 或依赖声明中的版本范围。
- 元信息在 Vite 启动 / 构建时生成，随前端产物一起部署；构建时间不是浏览器访问时间，不会随刷新变化。
- 提交标识带 `-dirty` 表示构建时存在未提交的已跟踪文件变更；没有 Git 信息的源码压缩包显示「未记录」。
- 更新依赖后重新启动开发服务，或重新构建并部署，然后核对版本与构建时间即可确认当前打开的产物。
