# Admin 整页 vw 页面缩放验收

验收日期：2026-10-28。范围为当前未发布源码，不代表 npm 发布或生产部署。
小流域与省级平台项目保持只读；本轮不修改 `@lumal/viewport` 公共 API。
前一阶段的局部转换结果保留在 [历史记录](./viewport-vw-2026-10-27.md)。

## 根因与修复

之前的 Admin 只转换内容区的部分尺寸。Header/侧栏、主题字号、行高、最小尺寸、
细边框和依赖样式仍为固定 px，CSS/JS 断点会随浏览器放大切换到移动布局；
Dashboard 的表格数值列宽也不会被 CSS 转换覆盖。因此仅切到 vw 不可能保持整页视觉一致。

本轮显式选择整页设计稿策略：

- 使用共享1920设计宽度，根单位覆盖 Header、侧栏、主题和 Teleport 到 body 的 UI。
- Vite 精确接入 Core、Icons Vue、Element Plus 样式，开启字体、最小尺寸、细边框与变量 fallback；
  Windows 工作区 glob 统一正斜杠，避免源码样式漏转。
- 第三方主题逐 CSS 文件导入，清单测试防遗漏，不放宽无可靠 map 的跨文件 Sass 边界。
- CSS 顶层媒体/容器宽高断点按根模式切换；同时关闭 Layout/Tabs 的 JS 移动断点切换。
- Dashboard 数值列宽使用既有公开 `useViewportScale({ mode:'width', ... })` 显式计算。
- 登录和自管理 DataV/Cockpit/Viewport 路由整页回退，其他模式恢复1px；切换不重建标签缓存。
- 保持轻启动与路由组件分块，不提高原有首屏体积预算。

## 公开配置与兼容

| 包 | 变更 | 默认行为 |
| --- | --- | --- |
| Vite | `variableFallbacks?:boolean` | false，普通变量与动态尺寸函数仍保守保留 |
| Vite | `mediaQueries?:{ runtimeSelector:string }` | 关闭；仅 runtime 输出和单个 html 根复合选择器可用 |
| Core | `ThemeRuntimeEnvironment.cssLength` | 未提供时仍输出 px |
| Core | `resolveThemeTokens` 第二参数、`applyThemeToElement` 第三参数 | 可选格式化器，旧调用有效 |
| Core | Layout/Tabs `responsive?:boolean` | true，保留原移动交互 |
| Icons Vue | 数字 `size` 使用协作单位 | 未提供单位仍为 Npx；字符串原样保留 |

局部转换继续默认保护 `font-size:14px;line-height:20px`、最小尺寸和细边框。
整页 Admin 显式开启后，以上尺寸统一输出设计系数表达式。例如14px字号、20px行高分别为
`calc(14 * var(--lumal-viewport-unit,1px))` 和 `calc(20 * var(--lumal-viewport-unit,1px))`，
在1280宽窗口中最终约9.33px/13.33px。浏览器放大时 CSS 数值减小，最终视觉尺寸保持。

`width:192px` 和静态 Vue style 对象中的 `'192px'` 统一转换；
动态脚本、业务字符串、class/aria 属性及 `.w-\[192px\]{width:192px}` 保持原样。
已有视口变量/相对单位、忽略标记与文件/依赖边界继续优先。
新媒体策略支持传统/范围语法；嵌套、原子化、排除规则和范围外混合来源的查询保守跳过。
完整选项与根变量、局部画布隔离约定见 [适配指南](./screen-viewport-guide.md)。

## 原生页面缩放

先启动当前源码的 Admin Dev、生产 preview 与 Mock，再运行：

```powershell
$env:LUMAL_ADMIN_DEV_URL = 'http://127.0.0.1:5181'
$env:LUMAL_ADMIN_PREVIEW_URL = 'http://127.0.0.1:4177'
node scripts/check-admin-viewport-zoom.mjs
```

脚本使用临时 Chromium profile 和仓库最小扩展的 `chrome.tabs.setZoom`，
不使用 CSS zoom、deviceScaleFactor 或缩放 viewport 冒充浏览器页面 zoom，
不修改用户浏览器或持久偏好，结束后关闭隔离浏览器并删除本次临时 profile。

Dev/Build 在1280×720、1920×1080窗口，80/100/125/150/200%下共20组通过，
另有10组侧栏宽度通过。断言 Header/文字/行高、四列指标、表格宽高、无整页横向溢出、
根/body/stage 无 transform、菜单定位与实际点击、抽屉宽度；
另验证切回响应式恢复移动交互，进入自管理页面恢复根模式。无页面异常或 console.error。

1280×720生产窗口的实测示例（尺寸按实际页面 zoom 换算为视觉像素）：

| 项 | 100% | 200% |
| --- | --- | --- |
| CSS innerWidth | 1280 | 640 |
| Header 视觉高度 | 33.328125 | 33.328125 |
| 标题视觉字号 | 12 | 12 |
| 表格行视觉宽度 | 803 | 804 |
| 设置抽屉视觉宽度 | 256 | 256 |
| 指标列数 | 4 | 4 |

允许亚像素和表格取整误差，不声称逐像素完全相同。
机器报告：`output/release/admin-viewport-zoom.json`。
截图：`output/playwright/admin-viewport/`，包含两种窗口及全部生产缩放档位。
这里的 zoom 不含手机双指 pinch zoom；未接入的业务脚本、原子 px 与第三方数值协议仍须显式适配。

## 代码与消费者验证

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @lumal/vite test` | 4文件78项通过，含Windows路径、范围/容器查询、混合来源、复制声明 map 与幂等性 |
| `pnpm --filter @lumal/core test` | 36文件395项通过 |
| `pnpm --filter @lumal/icons-vue test` | 4文件28项通过，含字符串固定尺寸与已有适配值保护 |
| `pnpm --filter lumal-admin test` | 32文件200项通过 |
| `pnpm test:scripts` | 9文件122项通过，含 Skill 契约 |
| 受影响公共包 `typecheck` | Vite/Core/Icons Vue通过 |
| `pnpm admin:build` | 全部公共包、Mock与Admin类型检查/生产构建通过 |
| `pnpm test:vite-consumer` | 独立 tarball Vue与真实CLI生成Screen通过 |
| `pnpm lint`、`pnpm format:check` | 通过 |
| `pnpm docs:build` | 通过，保留原有大块提示 |
| `pnpm release:boundaries` | 通过；应用测试也通过公开包入口核对样式 |
| `pnpm release:artifacts`、`pnpm release:budgets` | 通过，包含图标ESM/CJS/SSR与原有消费者预算 |
| `pnpm test:e2e:release:built` | 生产Chromium 34项全部通过 |

生产 E2E 首轮发现两处旧断言（主题变量字面量、旧示例设计宽度），已改为核对实际字号和共享配置；
离开画布后的断言仍检查 responsive、无 transform 和无活动缩放祖先。
整套重跑还暴露访客 Header 检查结束早于工作台请求完成的时序问题，
登录辅助函数现等待对应请求完成，不删除或放宽403、console warning/error断言。
最终34项完整重跑通过，报告位于 `.playwright-results/release-report.json`。

Admin首屏gzip为JS 321380/335000 B、CSS 49901/50000 B，未提高预算。

独立消费者覆盖 ESM/CJS、Vue类型与SSR、CSS/SCSS、模板静态 style/对象/数组、
原子类和属性保护、逐声明来源/map、Dev/Build一致性及重复处理。
新增整页配置验证字体/行高、最小尺寸、细边框、普通变量 fallback、
传统/范围媒体查询及容器查询，局部配置的安全默认结果保持不变。
报告位于 `output/release/vite-viewport-report.json`，不是浏览器视觉证据。
安装时保留 pnpm 的 Windows Sass bin与忽略构建脚本等提示，frozen复装、类型和构建均通过。

包版本仍为0.0.6-beta；Changeset记录Vite/Core的minor和Icons Vue的patch，
留待维护者下一次统一版本准备。本轮不发布npm、不推送、不部署。
