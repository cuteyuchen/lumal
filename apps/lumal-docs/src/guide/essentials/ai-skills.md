# AI Skill

Lumal 提供一个总 Skill，帮助 AI 根据需求选择包，并按公开 API 接入，而不是每次重新扫描整个仓库。

知识源码位于仓库的 `skills/lumal/`，包含 `SKILL.md`、Codex 展示元数据与按需读取的 `references/`。它是一套可复制的说明文件，不会进入应用运行时，也不会增加生产包体积。

## 覆盖范围

| 包 | 主要指导内容 |
| --- | --- |
| `@lumal/core` | 轻入口、Schema 显隐与校验、动态路由、标签缓存、请求刷新和会话隔离、字典、主题 |
| `@lumal/charts` | ECharts 注册、图表面板、尺寸适配和事件边界 |
| `@lumal/viewport` | 应用默认、页面和容器适配、响应式尺寸、地图/图表与 Teleport 边界 |
| `@lumal/datav` | 独立组件入口、DataV config 与 ECharts option、动画和异步引擎 |
| `@lumal/cockpit` | v3 配置、模块注册、runtime/designer 隔离、中心插槽、缩放与保存 |
| `@lumal/icons` | 图标注册、SVG 工具、Data URI 和静态清单插件 |
| `@lumal/icons-vue` | 图标组件、选择器与响应式注册表 |
| `@lumal/vite` | resolver、工作区 alias、可选 Devtools、定向 CSS 与可选 Vue 行内视口转换 |
| `@lumal/vben-compat` | Vben 5.7.0 固定基准、`/v5` 组件元组与 legacy 注册元组、轻量路由入口、支持子集 |
| `create-lumal-admin` | Admin / Screen / Blank、三预设、按需认证与数据、非交互创建与真实后端接线 |

## 安装与调用

将整个 `skills/lumal` 目录复制到 AI 工具支持的 Skill 目录，保留 `references` 相对结构，不要只复制 `SKILL.md`。

Codex 的仓库级位置为消费项目中的 `.agents/skills/lumal/`，个人级位置为 `~/.agents/skills/lumal/`。如果当前宿主已配置其他 Skill 目录，按宿主配置安装。已有同名 Skill 时先比较并保留自定义内容，不直接覆盖。发现位置与调用方式可查阅 [Codex 官方 Skills 文档](https://developers.openai.com/codex/skills/)。

在支持显式 Skill 调用的工具中，可以使用：

```text
使用 $lumal，为这个已有 Vue 项目接入一个带查询和分页的项目列表。
使用 $lumal，创建 standard、HTTP 和 History 模式的后台，按 API 契约接入现有后端。
使用 $lumal，创建无 API 和认证的纯静态 Screen，选择按实际内容容器适配。
使用 $lumal，选择最轻量的方式展示数字翻牌和滚动榜单。
使用 $lumal，给已有驾驶舱增加设计器，保持只读页面不加载编辑能力。
使用 $lumal，把这份 Vben 5.7.0 Grid 页面迁移到 /v5 入口，并列出需要改写的部分。
```

Skill 的描述也包含 Lumal 包名及适用场景，支持隐式发现的工具可以根据任务选择它。其他 AI 工具可把 `SKILL.md` 作为入口，并按其中链接读取相关参考。

## 使用边界

- Skill 按需求加载分包参考，不要求 AI 每次读取所有包。
- 示例与 `metadata.api-version` 基线为已发布并核验的 `0.1.1-beta`，不保证始终是 npm 最新版本；AI 应先核对实际安装包和 registry。目标版本不可用时不能悄悄换用旧 CLI，开发未发布源码时使用精确提交的本地 tarball。
- Skill 不代替具体业务接口契约、安全审查或测试，也不赋予 AI 自动发布权限。
- 普通包消费者不需要 Lumal 仓库源码 alias；只使用请求或图标工具时，不应被引导安装整套后台。
- HTTP 未配置时必须明确失败，不回退演示登录；Vben 5 使用 `/v5`，根及 `/legacy` 保留旧 Lumal 行为，不能混用两种元组。

## 维护

公共 API、导出路径、引擎依赖或模板行为变更时，同步更新仓库的 `skills/lumal/references/`。新增包时补充总入口选型表和分包参考，再更新本地安装副本。

安装副本不会随仓库提交自动更新。升级时先比较整个目录并保留用户自定义内容，再同步
`SKILL.md` 和相关 `references/`；不要删除额外文件或覆盖无关的宿主元数据。同步后复核内容，
并使用宿主的 Skill 校验器检查入口。

仓库维护者可运行：

```bash
pnpm exec vitest run --config vitest.config.ts scripts/lumal-skill.test.ts
pnpm docs:build
```

专项测试检查相对链接与公开导入路径，不代替组件行为或示例类型验收。完整的三模板、
HTTP 和 Vben 5 验证范围见 [升级验收](/reference/upgrade-verification)，
具体兼容限制见 [迁移矩阵](/reference/migration-from-vben)。
