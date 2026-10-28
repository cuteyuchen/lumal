# 浏览器 vw 协作验收

本文件保留旧实现的历史验收，不是当前 API 推荐。纯 vw 重构见
[本轮记录](./pure-vw-refactor-2026-10-28.md)。

日期：2026-10-27。下述首次代码验收对应提交 `b3c38db`，Header 后续接入结果见文末。
本文记录未发布源码的代码验收，不代表 npm 发布或生产部署，
也不声称完成浏览器实测。小流域项目仅用于只读对比，没有修改其源码。
本文保留首次及 Header 接入阶段的历史行为与结果；2026-10-28 的整页修复和真实浏览器证据
见 [Admin 页面缩放验收](./admin-viewport-zoom-2026-10-28.md)，不要将下述局部转换范围视为当前 Admin 行为。

## 确认的行为

设计稿继续使用 px，vw 以浏览器宽度 / 设计宽度换算，宽、高、间距使用同一宽度比例。
页面保持流式布局，不以实际容器高度计算 contain 比例，也不整体 transform。
例如设计宽1920、浏览器宽1280、实际容器宽1000：

| 输入 | 默认直接 vw | 运行时协作表达式 | vw 下最终尺寸 |
| --- | --- | --- | --- |
| `width:192px` | `10vw` | `calc(192 * var(--lumal-viewport-unit, 1px))` | 128px |
| `height:96px` | `5vw` | `calc(96 * var(--lumal-viewport-unit, 1px))` | 64px |
| `padding:24px` | `1.25vw` | `calc(24 * var(--lumal-viewport-unit, 1px))` | 16px |
| `font-size:14px;line-height:20px` | 保留 | 保留 | 14px / 20px |
| `min-width:320px;border:1px solid` | 保留 | 保留 | 320px / 1px |
| `w-[192px]` 及对应生成规则 | 保留 | 保留 | 原子化工具负责 |

`output:'runtime'` 是可选新配置，默认 `output:'vw'` 不变。
LumalViewport 在 vw 下设置单位为 `100 / designWidth vw`，其他模式重置为1px。
已完成容器测量后，同一包装器切换 responsive/contain/width/disabled 不重建内容，
也不对协作 CSS 重复缩放。初始 disabled、尚未测量时首次切到画布模式，
仍可能因等待容器测量而重新挂载内容；本次没有改变这项既有行为。
实际容器 size/resize 不变；vw 的 slot.scale、变量 scale 和暴露 result 采用窗口宽度比例。
禁用区域重置继承的单位，Teleport 到包装器外回退设计 px。

不能在已 transform 的 contain/width 画布内再嵌套 vw；单位不能撤销祖先物理变换。
外部 transform、已有 raw vw、CSS 变量定义作用域及第三方引擎仍由应用显式隔离。
不扫描 TS/JS，动态数值复用无 target 的 `useViewportScale({ designWidth, mode:'width' })`。

## 验证

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @lumal/vite test` | 4文件73项通过 |
| `pnpm --filter @lumal/viewport test` | 1文件18项通过 |
| `pnpm --filter create-lumal-admin exec vitest run --config ../../vitest.config.ts tests` | 5文件98项通过 |
| `pnpm test:scripts` | 9文件122项通过，含30项 Skill 契约 |
| Admin `tests/viewport-canvas.test.ts` | 2项通过，覆盖画布字体补偿与 vw 保留字号 |
| `pnpm typecheck` | 仓库脚本覆盖的全部类型检查通过 |
| `pnpm build` | 全部公共包及 Mock API 构建通过 |
| `pnpm docs:build` | 通过，保留原体积提示 |
| `pnpm format:check` | 通过 |
| `pnpm release:boundaries` | 通过 |
| `pnpm test:vite-consumer` | 两种独立 Vue 消费者通过，见下文 |
| `pnpm lint` | 原有未提交 AppWorkspaceViewport.vue 存在4处引号格式错误 |
| 排除上述原有文件的全仓 ESLint | 通过，本次修改文件无 Lint 问题 |
| `pnpm --filter lumal-admin build` | 原有未提交 menu.ts:17 组件联合类型错误阻断类型阶段 |
| `pnpm --filter lumal-admin exec vite build` | 生产打包通过，已核对示例 CSS 的协作表达式及最小尺寸保留 |

Admin 原有两处错误不属于本次修改，文件与改动均保留，不混入本次提交。

`test:vite-consumer` 串行重建并打包 Vite、Viewport 和 CLI，随后验证：

- 独立 Vue 工程仅通过安装的 tarball 公共入口消费；ESM/CJS、类型和 Vue SSR 通过。
- CSS、SCSS、模板静态 style、对象/数组中的静态样式、Dev/Build 产物一致。
- 直接 vw 与协作输出并存；字号/行高、最小尺寸、边框、变量、原子化规则、忽略和来源边界受保护。
- 真实 CLI 生成 `--template screen --viewport vw`，独立安装、frozen 复装、类型检查与生产构建通过。
- 生成项目共享设计配置、只增加所需两包，无 Core；生产 CSS 的32px padding与16px gap已进入协作转换。

机器报告位于 `output/release/vite-viewport-report.json`。
源码包版本未改；Changeset 标记三包后续版本准备。本次未发布、未推送、未部署生产，
没有修改省级平台或小流域项目。Admin 示例仍只转换独立视口目录，不影响现有工作区开关。

## Admin Header 后续接入

顶部工作区菜单新增 `vw 流式`，使用同一1920设计宽度与浏览器宽度单位；
原1280×720画布基准、响应式默认值及本地偏好键保留。转换扩展到自有内容页、
公共页面样式及请求示例，不转换 Header、侧栏、第三方样式与独立画布。
编辑器留在内容树内的用户/角色管理和 CRUD 示例在 contain/width 下回退响应式，
在 vw 下仍可适配，切换不重建页面内容或标签缓存。

后续验证：Admin 30文件196项测试、Skill 30项测试、全仓 Lint、
Admin 完整类型检查及生产构建、文档构建均通过。
真实 Vite 转换与 Dev/Build 产物核对覆盖间距转换、Header 44/36px、
图表340px、行高20px、最小尺寸32px及网格轨道保护；未运行浏览器视觉测试。
上文首次验收遇到的菜单组件联合类型及工作区对象引号格式问题，
已在此次直接相关接线中修复。此次仅修改私有 Demo、测试及文档，不需要更新公共包版本。
