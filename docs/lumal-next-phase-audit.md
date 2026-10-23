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
| 0 | 现有 Admin、PTY、Local/HTTP、生产浏览器与布局回归 | Windows 终端通过；12 组消费者及生产浏览器通过；布局35项通过；Linux 待 CI |
| 1 | 公共工程层、ESLint/Prettier、AI 约定与统一 check | 已实现，54 项生成器测试及 Standard/HTTP 独立 check 通过 |
| 2 | Blank、静态 Screen、旧 CLI 兼容 | 已实现；72 项生成器测试、4 组独立消费者及五种视口生产浏览器通过 |
| 3 | Screen 可选请求与认证 | 已实现；9 种能力组合生成测试，HTTP/Local 质量与生产认证流程通过 |
| 4 | 缩放复用、独立视口入口、三级策略、定向 px 转换 | 视口与40组真实浏览器通过；定向 px 转换继续实施 |
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

## 阶段 0–2 证据

- `output/release/scaffold-report.json`：本轮 Windows Node 24，
  12 组 Admin 消费者和 Chromium 149 生产浏览器通过，4 组可选模块构建通过。
- `output/release/next-baseline-layout-corrected.log`：布局、标签、路由释放35项通过。
- `output/release/next-project-types-tests.log`：72 项生成器测试通过，含 Windows PTY。
- `output/release/project-templates-report.json`：独立 Blank/Screen 质量、幂等性、体积与多视口浏览器结果。
- `output/release/next-quality-final-check.log`、`next-quality-frozen.log`：Standard/HTTP 46 项单测、
  完整 check 及锁文件复装通过。

消费者测试均以打包后的公开入口安装，不用源码 alias；报告中的临时目录在执行结束后清理。
Linux PTY 未在本机执行，不能用 Windows PTY 结果替代。

阶段 3：`next-screen-services-tests.log` 为78项生成器测试；
`next-screen-services-consumer.log` 为新增认证消费者完整 check。
HTTP 使用独立脱敏验收服务器，不拦截浏览器 fetch；验证错误凭据、
登录持久化、受保护指标、刷新、刷新失败退出及生产 Local Demo 禁用。
最终全量消费者报告仍需在全部公共包重建后重新生成，不能用阶段快照代替。

## 三级视口阶段证据

- `pnpm --filter @lumal/viewport test`：14项通过；类型检查及包构建通过。
- DataV74项、Cockpit59项回归通过，旧公开函数与返回 Ref 保留；external 不注册监听。
- 新包 ES 6.75KB / gzip2.50KB，仅 Vue peer；共享实现作为 DataV/Cockpit 外部依赖。
- 真实消费者仅只读：工作区固定 min1280×660、382侧栏、210底栏和仅宽度断点是应用侧约束；
  趋势使用 LumalChart，统计弹窗已 append-to-body，不应施加全局变换。
- `viewport-report.json`：Chromium149.0.7827.55，Dev/Build ×5窗口×4真实zoom，共40组通过。
  同时记录实际DPR/inner尺寸、所有浮层矩形、地图实例编号、resize计数与点击误差；
  真实OL矢量地图与ECharts Canvas非空、表格/弹窗/下拉/Tooltip及缓存返回均通过。
- 1280×720窗口在80/100/125/150%时，inner分别1600×900、1280×720、1024×576、约853×480；
  对应可用工作区高度约784/604/460/364。该结果来自tabs.setZoom，不是viewport模拟。
- 省级原测试未删除、未修改；脱敏夹具独立编写，不含业务接口、行业数据或私有资产。
- `scripts/lumal-skill.test.ts`、发布安全与包名59项通过；release boundaries通过。
  未在真实消费者部署，也未宣称原项目已升级通过。
