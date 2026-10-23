# 下一阶段开发与验收

日期：2026-10-23。历史基线与实际起点均为 `29e474e`。
工作分支：`codex/lumal-project-types-and-quality`。开始时工作区干净。

## 基线

- 实际 origin 是 `cuteyuchen/luma`，未擅自改成任务书中的 `cuteyuchen/lumal`。
- 本地 master 为 `a938f1a`，是当前 HEAD 的祖先。Admin 重构尚未合入 master，完整保留历史。
- `git fetch origin --prune` 因 github.com:443 连接失败，远端最新状态不能由本地跟踪引用证明。
- `gh run list --branch codex/scaffold-admin-refactor` 返回空列表，不能宣称参考分支有 Ubuntu CI。
- CodeGraph 索引存在，但本机命令及 MCP 工具均不可用，已回退到源码和 rg。
- Windows Node 24 / pnpm 10.33.0 可用；WSL 未安装，无 Docker 命令。
- 两个真实消费者仅只读审查，不执行其脚本，不复制业务源码、内部地址、凭据、地图或数据。

## 实施清单

| 阶段 | 范围 | 状态 |
| --- | --- | --- |
| 0 | 现有 Admin、PTY、Local/HTTP、生产浏览器与布局回归 | Windows 生成器 51 项通过；消费者运行中；Linux 待 CI |
| 1 | 公共工程层、ESLint/Prettier、AI 约定与统一 check | 已实现，54 项生成器测试及 Standard/HTTP 独立 check 通过 |
| 2–3 | Blank、Screen、旧 CLI 兼容、可选请求与认证 | 待实施 |
| 4 | 缩放复用、独立视口入口、定向 px 转换 | 待实施 |
| 5–8 | 混合路由、请求/CRUD 契约、真实消费者兼容 | 已开始只读审计 |
| 9 | 增量模块与 OpenAPI 收益审查 | 待审查 |
| 交付 | 完整门禁、体积、文档、分阶段提交 | 待完成 |

## 已发现的真实缺口

省级消费者补丁增加无业务 field 的 index 列、跨页序号和排除 CRUD 自动表单。
当前 Core 源码仍直接调用 `column.field.trim()`，尚未原生解决，后续须补契约及组件测试。

小流域将视口转换仅在 build 开启并作用于第三方依赖；新插件必须明确范围、默认关闭、
开发生产一致，不能复制这套全局行为。业务上下文注入应继续保留在应用 Adapter。

完整命令、结果与最终阻塞将在各阶段结束后更新；历史报告不作为本轮新执行证据。

GitHub REST API 已确认远端 master 仍为 `a938f1af6f8980adf000e96d3231f0d5499174d4`。
本机 Git HTTPS 连接仍失败，不能由 REST 查询推断已成功 fetch/push。
