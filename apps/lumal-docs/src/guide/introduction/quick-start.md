# 快速开始

## 前置准备

环境要求：

- [Node.js](https://nodejs.org/) `>= 22.12.0`
- [pnpm](https://pnpm.io/) `10.33.0`（与仓库 `packageManager` 一致）
- [Git](https://git-scm.com/) 任意版本

```bash
node -v
pnpm -v
git -v
```

::: tip
Windows 开发环境请直接使用项目声明的 pnpm 版本；避免可能切换错误版本的 Corepack 包装命令。
:::

## 获取源码

```bash
git clone https://github.com/example/lumal.git
cd lumal
```

::: warning
存放代码的目录及父级目录避免中文、空格等非常规路径，减少工具链异常。
:::

## 安装依赖

```bash
pnpm install
```

## 运行示例

### Admin + Mock

```bash
pnpm admin:dev
```

并行启动 `lumal-mock-api` 与 `lumal-admin`。开发期通过 `@lumal/vite` 的 **source alias** 直接解析 `packages/*/src`，无需先构建各包。

### 全部 apps（并行）

```bash
pnpm apps:dev
```

### 文档站

```bash
pnpm docs:dev
# 等价：pnpm --filter lumal-docs dev
```

浏览器打开 `http://127.0.0.1:5173`。

### 其他常用命令

```bash
pnpm --filter lumal-cockpit dev
pnpm --filter lumal-datav-guide dev
```

## 创建业务项目

当前公共包版本为 `0.0.3-beta`，以下命令显式指定版本：

```bash
pnpm create lumal-admin@0.0.3-beta my-admin
# HTTP API 模式
pnpm create lumal-admin@0.0.3-beta my-admin-http --api-mode http

cd my-admin
pnpm install
pnpm dev
```

详见 [脚手架项目](./scaffold) 与 [create-lumal-admin](/packages/create-lumal-admin)。

## 应用侧最小接入

```ts
import { createLumalAdmin } from '@lumal/core/minimal'
import App from './App.vue'

await createLumalAdmin({
  rootComponent: App,
}).mount('#app')
```

该入口不安装默认 UI 注册表；使用布局、表单等 UI 时，显式安装对应 peer、组件和样式。脚手架已包含带 Element Plus 的后台基座接线。完整选项见 [@lumal/core](/packages/core) 与 [Core API](/reference/core-api)，升级说明见 [更新日志](/reference/changelog)。

## 下一步

- [基础概念](../essentials/concept)
- [本地开发](../essentials/development)
- [安装与包地址](../essentials/installation)
