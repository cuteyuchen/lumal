# create-luma-admin

`create-luma-admin` 是 Luma 的最小后台项目脚手架，用于生成通过公开包入口消费 `@luma/core` 和 `@luma/icons` 的 Vue 应用。

## 使用

```bash
pnpm create luma-admin my-admin
```

生成后执行：

```bash
cd my-admin
pnpm install
pnpm dev
```

## 生成内容

- Vue 3 + TypeScript + Vite。
- Element Plus 作为 UI 基础。
- SCSS 样式入口。
- `createLumaAdmin` 应用启动代码。
- `LumaLayout` 后台布局壳。
- `LumaCrudTable` 最小示例页面。
