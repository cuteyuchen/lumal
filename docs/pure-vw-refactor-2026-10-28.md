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

以上为阶段证据；公开 tarball 矩阵、各站点产物、Admin 原生 zoom 与生产 E2E 仍需在最终记录中分别列出，不能据此提前宣称整个交付完成。
