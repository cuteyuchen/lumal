# AI Skill

Lumal 提供一个总 Skill，帮助 AI 根据需求选择包，并按公开 API 接入，而不是每次重新扫描整个仓库。

知识源码位于仓库的 `skills/lumal/`，包含 `SKILL.md`、Codex 展示元数据与按需读取的 `references/`。它是一套可复制的说明文件，不会进入应用运行时，也不会增加生产包体积。

## 覆盖范围

| 包 | 主要指导内容 |
| --- | --- |
| `@lumal/core` | 轻入口、应用启动、Schema/CRUD、路由权限、标签缓存、请求、会话、字典、主题 |
| `@lumal/charts` | ECharts 注册、图表面板、尺寸适配和事件边界 |
| `@lumal/datav` | 独立组件入口、DataV config 与 ECharts option、动画和异步引擎 |
| `@lumal/cockpit` | v3 配置、模块注册、runtime/designer 隔离、中心插槽、缩放与保存 |
| `@lumal/icons` | 图标注册、SVG 工具、Data URI 和静态清单插件 |
| `@lumal/icons-vue` | 图标组件、选择器与响应式注册表 |
| `@lumal/vite` | resolver、工作区 alias 与可选 Devtools |
| `@lumal/vben-compat` | 迁移步骤、支持子集及不支持的 Vben/VXE 能力 |
| `create-lumal-admin` | 创建命令、精确版本、local/http 模式和模板维护 |

## 安装与调用

将整个 `skills/lumal` 目录复制到 AI 工具支持的 Skill 目录，保留 `references` 相对结构，不要只复制 `SKILL.md`。

Codex 的仓库级位置为消费项目中的 `.agents/skills/lumal/`，个人级位置为 `~/.agents/skills/lumal/`。如果当前宿主已配置其他 Skill 目录，按宿主配置安装。已有同名 Skill 时先比较并保留自定义内容，不直接覆盖。发现位置与调用方式可查阅 [Codex 官方 Skills 文档](https://developers.openai.com/codex/skills/)。

在支持显式 Skill 调用的工具中，可以使用：

```text
使用 $lumal，为这个已有 Vue 项目接入一个带查询和分页的项目列表。
使用 $lumal，选择最轻量的方式展示数字翻牌和滚动榜单。
使用 $lumal，给已有驾驶舱增加设计器，保持只读页面不加载编辑能力。
使用 $lumal，把这份 Vben Grid 配置迁移到 Lumal，并列出不兼容项。
```

Skill 的描述也包含 Lumal 包名及适用场景，支持隐式发现的工具可以根据任务选择它。其他 AI 工具可把 `SKILL.md` 作为入口，并按其中链接读取相关参考。

## 使用边界

- Skill 按需求加载分包参考，不要求 AI 每次读取所有包。
- 示例基线为工作区的 `0.0.4-beta`，不是对 npm 最新或已发布版本的承诺；AI 应先核对项目实际依赖及其公开声明。
- Skill 不代替具体业务接口契约、安全审查或测试，也不赋予 AI 自动发布权限。
- 普通包消费者不需要 Lumal 仓库源码 alias；只使用请求或图标工具时，不应被引导安装整套后台。

## 维护

公共 API、导出路径、引擎依赖或模板行为变更时，同步更新仓库的 `skills/lumal/references/`。新增包时补充总入口选型表和分包参考，再更新本地安装副本。

本功能不修改脚手架生成内容，也不改变任何运行时 API；消费项目按需安装这一总 Skill 即可。
