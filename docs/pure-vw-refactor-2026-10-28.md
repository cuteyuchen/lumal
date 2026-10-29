# 纯 vw 重构记录（2026-10-28）

## 基线

- 开始 HEAD：`35efcc8e207d9f6333efbdd2428102677b7fef00`，工作区干净。
- 开发分支：`codex/pure-vw-unification`。
- 已 fetch；远端 master：`83464a6b6820cdcd3a78c0c1ede7830dab44c7f9`。
- 当前分支与 master 分叉；保留本地成果，单独纳入远端地图引擎释放、减少动画和测试修复，不合并分支。
- Node 24.14.1、pnpm 10.33.0；`pnpm install --frozen-lockfile` 通过。
- 改动前：`pnpm --filter @lumal/vite test` 78 项通过；Viewport 18 项通过。

## 契约

业务普通 px 经受控 AST 转为 `P / D * 100 vw`；动态设计数值为 `P * W / D`。
所有方向统一按宽度，没有高度比例、整画布缩放、居中偏移或尺寸下限补偿。
细边框与显式忽略项例外；原子化规则、业务脚本、地图坐标、实际测量值不自动转换。

## 审查清单

| 处理 | 范围 |
| --- | --- |
| 保留 | PostCSS/Vue AST、属性/选择器过滤、声明/模板忽略、原子类、SCSS/map/依赖边界；元素测量及生命周期；驾驶舱业务编排 |
| 删除 | Viewport 多模式策略、画布组件、旧缩放/居中/字号补偿；DataV/Cockpit 模式 prop/算法；Admin 模式菜单与专属偏好 |
| 替换 | 仅普通 vw 输出；运行时数字只使用实际 CSS 100vw；Core 动态 token 与框架数字尺寸内部转换；消费时转换公共 CSS |
| 更新调用方 | Admin、独立 Cockpit/DataV Guide/Viewport Lab/Vben、Admin/Screen/Blank 脚手架、tarball 夹具、文档及仓库 Skill |

## 阶段

1. 保留安全 AST 转换，移除 runtime 单位输出和断点复制。Vite 编译常量将同一个开关和 D 提供给运行时，未接入时默认 px。
2. 精简 Viewport，迁移 Core 动态 token、DataV 和 Cockpit。容器测量不成为缩放除数。
3. 迁移 Admin、全部示例、脚手架、公开文档与独立消费者。
4. 执行全量质量门禁、tarball、生产浏览器、原生 zoom 与发布边界检查，再准备未发布的预发布版本。

本文件持续记录实际结果，未执行的验收不得视为通过。历史发布证据保持原样；本轮不发布、不 push、不部署。

## 阶段一验证

- `pnpm --filter @lumal/vite test`：4 文件、79 项通过，含消费端 D=1440、公共包 token、编译配置注入与既有来源安全测试。
- `pnpm --filter @lumal/viewport test`：11 项通过，覆盖公式、共享监听、KeepAlive 和测量清理。
- `pnpm --filter @lumal/vite build`：ESM/CJS 与声明构建通过；Node fs 保持 external，不被误打包为浏览器空模块。
- 这是底层契约阶段，不代表尚在迁移的 Core、应用、脚手架或完整消费者已经通过验收。

## 阶段二验证

- `pnpm test`：133 文件、1,201 项通过，含业务权限、CRUD、请求、地图及设计器契约；没有通过删除业务测试、提高预算或跳过断言获得通过。
- 后续补齐 DataV 水波振幅、数字翻牌阴影/虚线和 SVG 标题字号；`pnpm --filter @lumal/datav test`：12 文件、74 项通过，新增4项 D1920/1440 与窗口变化测试，区分配置设计值、业务值和实际测量。
- `pnpm typecheck`、`pnpm --filter lumal-viewport-lab typecheck` 通过。
- `pnpm test:viewport`：生产/开发共48组工作区、36组宽度与浮层、2组实例/KeepAlive/稳定计数、4组根滚动条/gutter检查通过；真实原生80%/100%/125%/150%缩放，不使用 viewport/DPR 冒充 zoom。
- `pnpm format:check`、`pnpm release:boundaries`、`pnpm release:workflows` 通过；冻结锁文件复装通过。
- `pnpm release:verify --check-registry`：十包候选 `0.1.0-beta.0` 均尚未发布，内部依赖和锁文件一致。不验证/创建 tag，不发布。
- 发布边界发现示例直接导入 Vite 源码，已改成公开入口并补充精确构建依赖；不放宽边界门禁。
- 浏览器首轮切换环境沿用大窗口，导致 OpenLayers 初始分辨率约束改变，旧双击固定缩放断言失败。两轮从同一原生窗口初始化后完整复验通过，保留交互、点击误差和实例不重建断言。
- 主链单测曾有旧字符串 labelWidth 断言失败，按新的数字设计输入契约更新后全量通过；新增虚线测试修正为实际 SVG 的逗号分隔格式后74项通过。

以上为阶段证据；以下单独记录最终消费者、站点及真实浏览器结果。

## 主要修改

| 范围 | 文件与结果 |
| --- | --- |
| Vite | `packages/vite/src/viewport-transform.ts`、`viewport-css.ts`；复用原有模板/选择器 AST，不扫描脚本，删除 runtime 输出及媒体断点切换 |
| Viewport | 新增 `src/units.ts`、`useViewportWidth.ts`，保留 `useElementSize.ts`；删除策略、画布与旧缩放模块 |
| Core 等 | `packages/core/src/theme/dom.ts`、theme/layout/Schema/CRUD；图标、Charts、Vben 数字设计输入同步换算 |
| DataV | `LumalFullScreenContainer.vue`、数值图形组件、类型及导出；删除 `useFullScreenScale.ts` |
| Cockpit | runtime、Designer、types、composables；删除 `useCanvasScale.ts`，保留业务布局、模块、保存和地图生命周期 |
| Admin | 实际 Vite 接入、Header/偏好/页面/主题；删除工作区包装器、模式菜单、模式服务和专属持久化键 |
| 其他消费者 | Cockpit、DataV Guide、Viewport Lab、Vben 兼容示例及 Admin/Screen/Blank 模板 |
| 工程与文档 | tarball/原生 zoom/生产 E2E、包 README、统一指南、迁移指南、文档站、仓库 Skill、十包版本和 lockfile |

完整文件清单可在本分支执行 `git diff --name-status 35efcc8 HEAD` 查看；不是对业务仓库的修改。

## 公开配置与破坏项

- `createViewportTransformPlugin` 保留入口和既有 AST 安全控制；新增 `frameworkStyles`，默认接入 Lumal 自有样式。
- `enabled` 默认关闭，`viewportWidth` 默认1920；开启后默认 `fontSize/minSize/inlineStyles:true`。
  `fontSize:false` 同时保留 font-size/font/line-height；细边框默认通过 `minPixelValue:1` 保留。
- 文件、选择器、属性、忽略标记与精度继续可控；`frameworkStyles:false` 只控制静态 CSS 来源。
  编译开关与设计宽度为项目级，局部文件过滤不是路由运行时开关，不承诺还原已经编译的 vw。
- 删除 Viewport 的 `LumalViewport`、`createViewportPlugin`、`resolveViewportPolicy`、
  `useViewportPolicy`、`computeViewportFontSize`、`computeViewportScale`、`useViewportScale` 及对应模式/策略/缩放类型。
- 删除 DataV 的 `computeFullScreenScale`、`useFullScreenScale`、相关类型和全屏容器 mode；
  删除 Cockpit 的 `CockpitViewportMode`、viewportMode、旧画布 Composable 与适配菜单。
- 删除 Vite 的 `output`/`mediaQueries`、Core 旧主题 `cssLength` 接线及脚手架多模式参数。
  不保留别名、兼容壳或隐蔽模式分支。
- 新运行时工具为 `getViewportConfig/getViewportWidth/viewportLength/viewportPixels/useViewportWidth`；
  CSS-only 项目不需要加载运行时。数字设计尺寸在框架内部处理，实际测量及 Popper 坐标不换算。
- DataV 新容器只承载内容，`width/height` 为设计 px，`overflow` 默认 auto，可明确 hidden；
  Cockpit 默认内容宽度取项目 D，设计高度只决定内容高度，既不参与除数也不居中缩小。

项目只在 Vite 填一次 D。编译常量将同一开关和 D 注入浏览器及受控 SSR 模块，
不把 Vite/PostCSS 带到运行时；公共包发布 CSS 仍保留设计 px，在消费端转换。
独立使用 Viewport 时可显式传一个普通配置对象，不强制依赖 Vite。

## 实际转换

默认开启、D1920时：

```css
.panel {
  width: 10vw; /* 输入192px */
  height: 5vw; /* 输入96px */
  font-size: 0.729167vw; /* 输入14px */
  line-height: 1.041667vw; /* 输入20px */
  min-height: 2.083333vw; /* 输入40px */
  border: 1px solid red; /* 物理细边框例外 */
}
```

静态 `style="width:192px;height:96px"` 得到10vw/5vw；
`:style="{ width:'192px', top:'24px' }"` 得到10vw/1.25vw。
数组中可分析项使用相同 CSS AST，动态项保留。fontSize:false时14px/20px同时保留；
已有 vw/var/min/max/clamp、显式忽略和原子化生成规则按约定保护，普通属性选择器不误伤。
class/:class/aria/URL/脚本字符串、经纬度和业务数值不改。

D1440时，192px为13.333333vw；真实 Screen tarball 的 DataV 字号和 Cockpit 内容宽度
均按1440验证，证明没有将发布 CSS 永久固定为1920基准。

## 最终验证

| 命令/检查 | 结果 |
| --- | --- |
| `pnpm test` | 134文件、1,205项通过；最终日志 `output/release/pure-vw-test-final.log` |
| `pnpm typecheck`、Viewport Lab typecheck、Cockpit E2E typecheck | 通过；Admin/其他应用类型检查同时由各 build 执行 |
| `pnpm lint`、`pnpm format:check` | 通过，最后一轮代码变更后复核 |
| `pnpm build` | 十公共包及 Mock 构建通过，ESM/CJS/声明与导出完整 |
| Admin、Cockpit、DataV Guide、Vben 兼容示例构建 | 通过；没有只验证 source alias |
| `pnpm test:vite-consumer` | 通过；D1920/1440、ESM/CJS、Vue 类型、SSR、AST、SCSS/map/来源、幂等及 Dev/Build |
| `pnpm test:create-projects` | 14个仓库外 tarball 项目全部通过安装、frozen复装、lint、格式、类型、单测、生产构建与浏览器验证 |
| `pnpm test:create-consumer` | 12个Admin组合、4个可选模块组合、轻入口及8组CLI参数全部通过；Admin组合均完成真实生产浏览器交互 |
| `pnpm test:viewport` | 48组工作区、36组宽度与浮层、2组生命周期/实例、4组滚动条/gutter通过 |
| `node scripts/check-admin-viewport-zoom.mjs` | Dev/Build共60组尺寸/浮层及10组侧栏，80%/100%/125%/150%/200%原生缩放通过 |
| `pnpm test:e2e:release:built` | 最终34项通过；登录/权限/CRUD/导航/主题/表格/浮层及嵌入示例保留 |
| `pnpm test:e2e:cockpit:built` | 12项通过，包含真实拖拽、配置保存恢复、全屏、OpenLayers/Cesium/ECharts切换与实例释放 |
| `pnpm test:datav:visual` | 最终站点重建后7项通过，不更新金图、不删除图形/动画断言 |
| `pnpm release:boundaries`、`release:workflows`、`pack:dry-run` | 全部通过 |
| `pnpm release:artifacts` | 产物、图标消费者和原有预算全部通过，未提高预算 |
| `pnpm release:verify --check-registry`、`pnpm changeset:status` | 十包版本/内部依赖/lockfile一致，候选未发布，无额外待 bump |
| `pnpm docs:build` | 通过；最终日志 `output/release/pure-vw-docs-build.log` |

真实浏览器为Windows隔离Chromium149，覆盖1280×720、1366×768、1920×720、
1920×920、1920×1080、2560×1440，并在脚手架补充1440×900/390×844。
原生缩放由隔离扩展调用 `chrome.tabs.setZoom`，不用viewport/DPR冒充；
只对参与转换的设计内容保证比例，1px边框及明确忽略项保持例外。
同宽不同高不变比例，矮屏检查正常滚动；地图点击、视图、实例、图表resize及KeepAlive状态保留。
Designer在1366×768真实拖入模块后，保存的区域宽度仍为360设计px，刷新再打开不受当前窗口污染。

## 产物与本地证据

| 首屏gzip | JS实际/原预算（B） | CSS实际/原预算（B） |
| --- | --- | --- |
| Admin | 318218 / 335000 | 44966 / 50000 |
| Cockpit | 686067 / 800000 | 72675 / 80000 |
| DataV Guide | 417160 / 850000 | 48012 / 55000 |
| Vben兼容示例 | 286551 / 300000 | 42193 / 45000 |

minimal相对Vue基线增加2787B；request为2741B；DataV charts初始26395B。
纯静态Screen从关闭转换到D1920/D1440，JS均为63513B，
CSS分别990/1035/1043B；D变化由消费CSS表达，未强制增加Viewport运行时。
这些是本轮实际产物与配置对照，不冒充旧版本全站体积的前后性能结论。

- `output/release/vite-viewport-report.json`：独立Vue打包产物与来源/公式结果。
- `output/release/viewport-report.json`：布局、原生zoom、滚动条、地图/图表生命周期；Dev/Prod错误列表均为空。
- `output/release/admin-viewport-zoom.json`：原生zoom逐组尺寸、物理边框例外及浮层结果。
- `output/release/scaffold-report.json`、`project-templates-report.json`：完整tarball矩阵，不能用历史报告代替。
- `output/playwright/admin-viewport/1280x720-1.png`、`1920x920-1.png`、`1920x920-2.png`、
  `2560x1440-1.png`：Admin真实原生截图，200%不改变参与适配内容的视觉比例。
- `output/playwright/viewport/`、`cockpit-viewport-*.png`、`cockpit-cesium-1440.png`、`cockpit-designer-1366.png`及
  `output/playwright/scaffold/`：实际地图、浮层、Designer与消费者证据。

以上output为本机生成的验收产物，不提交大型截图/日志，不将它们当作远端CI或已部署站点证据。

## 失败处理与边界

- 迁移期的旧模式/固定px断言已按新契约替换，权限、CRUD、地图、保存、失败反馈等业务验证保留。
- 生成项目曾暴露import顺序及测试注入的overrides排序问题，已修源模板与验证脚本，不绕过lint。
- Local Demo生产环境禁止登录的安全门禁保留；验收实际登录表单尺寸，不误拿未挂载的Screen padding。
- Admin原生zoom先后暴露按钮过渡和物理边框混算；通过等待真实尺寸稳定、单独记录物理边框修正验收，
  误差阈值未提高。固定状态列精确校验输入取整及实际列宽，末列仍保留吸收剩余空间的表格功能。
- 最后一次Admin复验曾因弹窗入场时两次跨帧采样得到1.09px假错位；同帧采样后原1px断言连续3次通过，
  再次完整34项通过。原失败日志保留为 `output/release/pure-vw-admin-e2e.log`，最终为 `pure-vw-admin-e2e-final.log`。
- CodeGraph本机CLI不可用，已先尝试再使用rg；GitHub匿名API限流后通过已认证CLI确认master仍为基线提交，
  没有修改remote或覆盖后续本地成果。
- 不覆盖任意第三方JS动态内联尺寸。ECharts字号/设计边距等显式用数字工具；
  实际DOM/Canvas尺寸、Popper位置、拖拽屏幕坐标、经纬度和业务数值直接使用。
- 未执行Firefox/WebKit、Linux/macOS或远端CI；没有对省级/小流域原项目写入、操作业务数据或执行生产后端验收。
  本轮不以历史业务项目的失败记录宣称新候选已完成业务升级。
- 完整矩阵、本地代码、生产浏览器及文档构建最终无未解决FAIL/BLOCKED。
  未发布npm、未push/合并、未部署，也未创建/移动远端tag。

## 版本与提交

按fixed-group十包策略准备合法破坏性候选 `0.1.0-beta.0`，不是继续覆盖已发布Beta版本。
十包内部依赖、lockfile、公开声明、导出、CHANGELOG和模板版本同步；registry预检确认候选尚未发布。
此为发布准备，不代表获得发布授权。

已分阶段本地提交 `63289ae`（构建/运行时宽度规则）与 `83ce69f`（公共包与消费者迁移）；
最终验收与文档作为后续本地提交，精确SHA随交付给出。

## 发布版本确认（2026-10-29）

维护者指定本轮发布版本为 `0.1.0-beta`，沿用仓库既有 Beta 命名；此前准备的
`0.1.0-beta.0` 仅为未发布候选，两者均为合法预发布版本，不是同一个版本。
十包 manifests、内部依赖、锁文件、当前 CHANGELOG、文档和空 Changeset 同步为
`0.1.0-beta`。上文保留当时的候选与验收事实，不将旧 SHA 的通过结果作为新提交证明。
本轮授权为合并 PR、确认 master 新提交 CI、执行正式 Release Gate，通过后发布 npm；
不包含手动生产部署、移动已有 tag 或覆盖已发布版本。

## 合并后发布前检查（2026-10-29）

PR #14 合并为 `dac631b11dba598d79f9a8a86880ac4fd71f97e4`。
该提交 CI `40822148122` 的 Ubuntu / Windows 各 1,237 项测试、类型与构建成功，
CodeQL 成功；Build Validation `40822148205` 的两平台 Demo、Vite tarball 和 DataV
视觉成功，但消费者 job `123276831629` 的 Screen DataV 字号采样失败，后续视口检查未运行。

失败值为 `26.666666666666668`，即旧宽度 1280 / D1440 的 30px；
期望为新宽度 1366 对应的 `28.458333333333332`。隔离 tarball 项目中使用 Playwright Clock
冻结 RAF 可确定复现，推进 32ms 后即得到正确值；不是运行时公式缺陷。
消费者改为等待字号提交后使用原 `toBeCloseTo(..., 1)` 断言，并新增组件级 RAF 回归；
不修改公共运行时、容差、作业超时、重试或预算。原失败日志和只读复现证据保留在
`output/release/master-dac631b-build-failed.log` 与 `dac631b-datav-raf-confirmed.json`。
发布流程停在 master 检查，尚未创建版本 tag 或执行发布；修复后须重新验证最终提交。

修复本地验证：DataV 75 项、脚本 152 项、Lint、模板格式、版本一致性与文档构建通过；
`LUMAL_PROJECT_CASES=screen-datav,screen-cockpit pnpm test:create-projects` 的两个独立
tarball 项目完成安装、Lint、格式、类型、单测、构建及七组生产浏览器视口检查。
这些定向结果不替代修复提交、合并后的 master 和 Release Gate 的完整远端验收。

PR #15 首轮 `342e74c` 的两平台 CI 各 1,238 项、CodeQL、两平台 Vite tarball、
Windows DataV 视觉、Ubuntu 生产 Demo 和完整消费者（含十四模板与真实 zoom）通过；
Build Validation `40827176958` 的 Windows Cockpit 浏览器 11 项通过，Cesium 恢复用例
超过原 90 秒预算，后续 Windows Admin 未执行。未合并此 PR，未运行 Release Gate 或发布。
原 trace 显示恢复后的 768×512 Canvas 已采样成功（20 色），重复可见性检查耗时约 24 秒，
截图约 20 秒，切换引擎时触及测试总预算。去掉截图 helper 的重复可见性等待，
由三个调用方各自确认一次就绪，保留唯一画布、真实像素、错误反馈和退出清理断言；
不改运行时、视口尺寸、截图范围、预算、超时、重试或跳过规则，须重新完整验证。
调整后本地 `pnpm test:e2e:cockpit` 从包依赖重新构建，完整 12 项通过（3.2 分钟），
恢复用例 21.2 秒；另通过 Cockpit 31 项单测、E2E 类型检查和 Lint。
本地机器与 GitHub Windows 性能不同，不能用此结果代替新提交的完整远端检查。

`e3c7cf6` 的完整消费者、双平台 CI / Vite tarball、CodeQL、Windows DataV 视觉与 Ubuntu
生产 Demo 通过，Windows 恢复用例也通过（52.7 秒）；但 Build Validation `40830461373`
的 Cesium resize 用例失败，旧 Canvas 已断开，页面出现“Cesium 渲染中断”，后续 Windows
Admin 未运行。这不是先前的恢复超时，不能通过增加等待或重试视为解决。
原日志、截图和 trace 保留在 `output/release/pr15-e3c7-windows-demo/`。
先保留 Cesium renderError / contextlost 的底层信息并增加错误及旧监听清理回归，
以便区分真实渲染缺陷与环境错误；尚未确定根因，PR 和发布继续阻断。
