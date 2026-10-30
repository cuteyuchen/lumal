# lumal-viewport-lab

统一宽度 vw 的独立 Vue 验收夹具，不是新的公共包，也没有单独部署的生产站点。
基于当前 `@lumal/* 0.1.1-beta`，用于复现普通 CSS/SCSS、模板 style、数字工具、
容器测量、Element Plus、ECharts 和 OpenLayers 的协作边界。

## 本地运行

在仓库根执行：

```bash
pnpm --filter @lumal/vite build
pnpm --filter @lumal/viewport build
pnpm --filter lumal-viewport-lab dev
```

Vite 在启动时输出实际本地地址。`vite.config.ts` 一次配置设计宽度 1920；
业务写 px，由构建转换输出普通 vw，不使用页面缩放包装器、模式选择或手写尺寸变量。
实际元素测量用于地图/图表 resize，不作为第二个适配基准。

## 验证边界

先准备上述依赖产物，`pnpm test:viewport` 再构建夹具并运行浏览器宽度、滚动条、原生 zoom 检查。
它包含实机验证，不是普通文档更新的默认测试。
只核对转换语义、来源与 Dev/Build 产物时使用 `pnpm test:vite-consumer`，不启动浏览器。
后者会串行重建并打包 Vite/Viewport，在仓库外创建真实消费者；不要用此前留下的 dist 代替候选版本验证。

规则与已发布版本证据分别见 [统一 vw 指南](../../docs/screen-viewport-guide.md)
和 [0.1.1-beta 执行记录](../../docs/npm-release-0.1.1-beta.md)。
