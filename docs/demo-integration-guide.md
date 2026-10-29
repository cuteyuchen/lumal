# Demo 与业务接入

当前API基线为候选 `0.1.0-beta.0`，尚未发布npm或部署。使用精确源码tarball验收，
不要用历史registry包或线上站点替代本分支。
上一版 Designer 名称修复与正式发布证据见 [0.0.7-beta 发布记录](./npm-release-0.0.7-beta.md)。
Demo 页面和文档部署是独立步骤，历史授权站点更新见
[合并与站点实际验收](./npm-release-0.0.7-beta.md#合并与站点实际验收)。
包版本不能替代线上提交和部署证据。

## 选型

| 目标 | 选择 |
| --- | --- |
| 最小Vue应用 | Blank，默认不启用适配，不引入UI/运行时 |
| 静态屏幕 | Screen，普通px由Vite转vw，不要求Viewport |
| 内部数据屏幕 | Screen + HTTP auth/data，认证失败不降级演示 |
| 常规后台 | Admin，Core与Element Plus明确来源一起适配 |
| 多布局/左右Widget编排 | Cockpit Runtime；Designer、地图按需 |
| 边框、数字、榜单 | DataV子入口，非图表不要求ECharts |

```sh
# 仅正式发布后可从registry执行；候选阶段使用本地tarball中的CLI。
pnpm --package=create-lumal-admin@0.1.0-beta.0 dlx create-lumal internal-screen --template screen --auth http --data http --router-mode history --design-width 1920
cd internal-screen
pnpm install
pnpm check
pnpm dev
```

按生成的API-CONTRACT配置真实接口。第一次install生成锁文件，之后CI使用frozen-lockfile。
所有项目保留lint、格式、typecheck、test、build及check，详见[项目模板](project-template-guide.md)。

## 普通 Vue 与 Admin

在Vite中一次配置 `createViewportTransformPlugin({ enabled:true, include:['src/**'], viewportWidth:1920 })`，
保留Vue插件；使用并验证Element Plus时加入精确 `dependencies:['element-plus']`。
业务写普通px，无页面包装器、模式菜单、根单位协议或整画布transform。
高度也按宽度，高度不足正常滚动或显式裁切。

Admin示例源码：

<<< ../../../lumal-admin/src/views/examples/viewport/ViewportCanvas.vue

路由仍由应用授权，后端菜单不传任意布局策略。静态/模板样式由AST处理，Core动态token与数字prop内部适配。
全局与局部是编译范围，不是路由模式；已编译vw不能运行时撤回。
选择器、声明、模板忽略、原子类和第三方边界详见[统一指南](screen-viewport-guide.md)。

## DataV 与 Cockpit

DataV容器只承载内容，embedded用于嵌入，默认overflowauto，内容高度按同一D换算。
Cockpit所有面板/列宽数字写设计px，百分比行高不变；没有整画布缩放或外部缩放模式。
二者嵌套也不重复缩放。Designer仍保留多布局、注册、Tab、拖拽、取消、保存和配置恢复。

Admin最小运行时示例及模块：

<<< ../../../lumal-admin/src/views/examples/CockpitView.vue

<<< ../../../lumal-admin/src/views/examples/cockpit/MetricWidget.vue

只读Runtime不加载Designer。编辑时动态导入 `@lumal/cockpit/designer`，
处理 `save({config,layout})` 和cancel；保存失败保留草稿，消费方负责权限、HTTP和损坏存档显式恢复。

独立Demo对documentElement请求全屏，使body Teleport和兄弟Designer同属全屏树；
其他应用可挂载浮层到全屏宿主，或先退出全屏。全屏API不等于CSS缩放。

## Cesium 构建与部署边界

地图是应用依赖，不是Cockpit公共包必需项。未经授权不部署生产。

```sh
pnpm install --frozen-lockfile
pnpm cockpit:build
pnpm --filter lumal-cockpit preview --port 4180 --strictPort
```

包内build等价根完整构建链，build:app要求依赖dist已生成。
`vite-plugin-static-copy`复制Cesium Workers/Assets/Widgets/ThirdParty，
CESIUM_BASE_URL对应部署前缀，当前Demo为`./cesiumStatic/`，不得只上传JS/CSS。
Worker返回JS、资源返回原格式，不能用SPA fallback的HTML冒充200成功。
子路径部署同时调整Vite base和资源路径。Demo使用本地公开数据与椭球地形，不要求Ion Token。
初始化/渲染/WebGL错误可见且可重试，旧实例与监听释放。

开发可用工作区source alias，生产build/preview必须用公开dist。
按静态import闭包检查首屏预算，不因chunk命名就假定按需加载成功。

## 动态数值与状态

地图实际尺寸直接updateSize/resize，ECharts真实容器直接resize，不重建实例或重新请求业务。
外部动态设计字体/边距用 `useViewportWidth().pixels()`；CSS长度用viewportLength。
业务数据、经纬度、实际测量、拖拽和Popper屏幕坐标不换算。
无法静态分析的JS样式不自动扫描，不能宣称所有第三方动态样式都被覆盖。
原生zoom、不同高度、地图状态和浮层实测见[本轮记录](pure-vw-refactor-2026-10-28.md)。
## Demo 入口与版本边界

| 站点 | 公开入口 | 可交互入口 |
| --- | --- | --- |
| Admin | https://lumal-admin.cuteyuchen.top/ | `/#/examples/viewport`、`/#/examples/datav`、`/#/examples/cockpit` |
| Cockpit | https://lumal-cockpit.cuteyuchen.top/ | 顶部视口实验、布局恢复和错误反馈 |
| DataV | https://lumal-datav.cuteyuchen.top/ | 继续使用完整组件指南 |
| 文档 | https://lumal.cuteyuchen.top/ | 此指南和包功能覆盖表 |

上述入口曾随 PR #9 合入 master 并完成授权部署；首次生产验收基线为 `e2ac131`，不是当前候选上线证明。
npm 版本、源码提交、构建产物、Vercel Deployment 和域名别名仍须分别核对，
不能用某一个成功替代全部上线验收。历史证据与未覆盖边界见 `0.0.7-beta` 发布记录。
