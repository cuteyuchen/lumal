# vben-compat-demo

基于已发布的 `@lumal/* 0.1.1-beta` 的兼容层示例应用（包名 `lumal-vben-compat-demo`），演示如何在 Vben 风格的 API 之上使用 Lumal 组件库，帮助从 Vben Admin 迁移的项目接入。

## 技术栈

- Vue 3 + `<script setup>` + TypeScript
- Vite
- Element Plus
- Lumal 组件库：`@lumal/core`、`@lumal/vben-compat`、`@lumal/icons`、`@lumal/icons-vue`

## 本地开发

开发（`vite serve`）模式下通过 `@lumal/vite` 的 `createLumalAliases` 将 UI 包别名指向各 package 的 **源码**，改动组件库即时热更新；生产构建使用各包的 `dist` 产物。全新 clone 先在根目录执行 `pnpm --filter @lumal/vite build`，生成 Vite 配置所需的公开入口。

```bash
# 在仓库根目录：一键并行启动全部 app
pnpm dev

# 或在本目录单独启动
pnpm dev
```

- 开发服务器固定端口：**5185**（`strictPort: true`）。
- 访问地址：http://127.0.0.1:5185

## 目录结构

```
src/
├── App.vue        # 示例主界面
├── styles.scss
└── main.ts        # 应用入口，注册兼容层与样式
```

## 常用脚本

| 脚本 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器（端口 5185） |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览构建产物 |

## 构建说明

根目录提供 `pnpm compat:build`，会先构建全部 `@lumal/*` 包再构建本示例。

## 统一 vw

`vite.config.ts` 显式开启 `createViewportTransformPlugin`，设计宽度使用默认 1920。
业务继续写 px，应用样式、Lumal 自有样式及明确授权的 Element Plus 样式在消费者构建时生成普通 vw，
同一配置自动用于 Core 的动态设计尺寸；Dev 与 Build 使用同一转换规则。
没有页面包装器、路由模式或整页 transform，不能在运行时撤回已经编译的 vw。
动态业务表达式和第三方实际定位不扫描；细边框、原子类与明确忽略项保持约定。

接入规则见 [统一 vw 指南](../../docs/screen-viewport-guide.md)，
部署与公网资源核验见 [0.1.1-beta 执行记录](../../docs/npm-release-0.1.1-beta.md#非-cockpit-站点与宿主-skill-更新)。
