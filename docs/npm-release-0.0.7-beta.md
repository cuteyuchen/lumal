# 0.0.7-beta 发布执行记录

日期：2026-10-26。发布分支：`codex/release-0.0.7-beta`。

## 发布状态

**十包已发布，registry 完整性、同次 CI 产物及六类独立消费者全部核验通过。**
遵循本轮要求，先完成发包和消费验证，再更新当前文档、Skill 与 Admin Demo。
没有本地直接 publish、重发或移动既有标签。正式发布 run 未部署生产；
下文单独记录后续授权的站点恢复。

- 附注标签 `v0.0.7-beta` 指向 `5d190e2d726c192fdd3dc49a03190c4559906743`。
- 发布前十包均不存在本版；版本、内部精确依赖和 frozen lockfile 一致。
- [演练 40293247549](https://github.com/cuteyuchen/lumal/actions/runs/40293247549)
  对应同一 SHA，四门禁 success，publish/deploy 均 skipped。
- [正式 Release Gate 40298763933](https://github.com/cuteyuchen/lumal/actions/runs/40298763933)
  由正式 tag push 触发，重新运行全部门禁后才发布，不用演练替代正式检查。
- 十包 `beta` 均为 `0.0.7-beta`。九个既有包的 `latest` 保持 `0.0.1-beta`，
  viewport 的 `latest` 保持 `0.0.6-beta`；没有额外修改 dist-tag。
- `DEPLOY_PRODUCTION` 不存在，正式 deploy 为 skipped。npm 发布不代表五个演示站点已部署。

本版公共代码主要包含 Vite 受控视口转换的属性/选择器/声明控制与可选 Vue 行内样式、
Screen 模板共享 `viewport.config.ts`，以及 Cockpit Designer 布局名称输入修复。
Viewport 运行时沿用既有 API；其他公共包同步统一版本和内部依赖。
发布后的 Admin 工作区三模式属于应用侧集成，不是向已发布 tarball 追加代码。

## 正式门禁

| 验证项 | 实际环境 / 命令 | 结果 | Job |
| --- | --- | --- | --- |
| 版本、锁文件、发布图与 tag | Ubuntu，`release:verify` / `release:workflows` / actionlint | success，27s | `121491199291` |
| 完整发布检查 | Ubuntu 24.04.5 / Node 22.23.3 / pnpm 10.33.0，`pnpm release:check` | success，31m39s（含环境准备） | `121491402230` |
| Windows 门禁 | Server 2025 / Node 22.23.4 / pnpm 10.33.0 | success，10m56s | `121491402282` |
| Docs / Cockpit / DataV / 全部预算 | Ubuntu，同 run 的已验证公共包产物 | success，7m7s | `121504975971` |
| 十包正式串行发布 | 复用上述 npm dist，registry 预检后发布 `beta` | success，1m10s | `121508087484` |
| 生产部署 | 显式部署开关关闭 | skipped | `121508640267` |

正式发布 job 于北京时间 18:00:52 成功结束。Ubuntu 的 Chromium 安装耗时 11m21s，
之后正常完成完整检查；没有放宽超时、跳过浏览器或吞掉失败。

两平台主链各为 **130 files / 1,172 tests**，不把消费者中的重复测试混入主链计数：

- Linux 源码 PTY 12 项、tarball PTY 12 项；Windows 源码 PTY 12 项。
- Admin 12 个主组合、4 个可选组合、12 组浏览器消费场景；生产 E2E 34 项。
- Blank/Screen 14 个组合，每组五档 viewport，共 70 项布局检查。
- Viewport Dev/Build 共 40 项工作区、8 项局部缩放、2 项生命周期检查；
  另有真实浏览器 zoom 80%、100%、125%、150% 验证，不将 viewport 调整冒充 zoom。
- Cockpit 完整生产构建、E2E 类型检查、10 项生产 E2E 通过；
  skipped/unexpected/flaky 均为 0，错误数组为空。
- Windows 三轮 DataV 视觉 21 项通过；Vite tarball 的类型、ESM/CJS、SSR、
  CSS/SCSS、来源边界、Dev/Build 等验证通过。后者不是浏览器几何测量。

正式 run 原始日志、run/jobs/artifacts JSON、日志哈希及消费者附件保存在
`output/release/formal-40298763933-*`，为忽略的验收证据，不进入 npm。

### 失败与复测

此前演练 `40290588687` 已取消，不算通过。候选 Windows 短路径规范化问题
由 `5d190e2` 修复，junction 正反例及越界拒绝均经验证。

本地 Windows 前两次完整检查分别遇到 lodash-es `EBUSY` 和生成项目的 plugin-kit
解析失败；原现场已清理，不能断言第二个失败的具体根因。独立复测通过后，
第三次 `pnpm release:check` 完整退出 0，日志为 `output/release-007-check-final.log`。
没有删除测试、更改依赖或使用重试配置掩盖失败。

## Registry 与发布产物

正式 npm artifact 为 `12641551296`，名称为
`lumal-npm-dist-5d190e2d726c192fdd3dc49a03190c4559906743`。
API digest：
`sha256:c5f36589fb5ea5af0c5ea975629c1128f58441c264e2a6897d96132b63252f31`。
下载到独立目录后共十包、**702 文件 / 1,843,293 bytes**，未以工作区 dist 代替。

```bash
node output/release/verify-published-0.0.7-beta.mjs \
  --tag-sha 5d190e2d726c192fdd3dc49a03190c4559906743 \
  --publish-log output/release/formal-40298763933-publish-job-121508087484.log \
  --dist-artifact F:/lumal-release-validation/formal-40298763933-npm-dist \
  --wait-for-registry
```

18:03:55 至 18:04:20，退出 0，首轮十包全部可见。逐包比对：
正式 tag manifest、registry manifest、exports/类型/bin/样式、模板资源、
同版内部依赖、`beta` 和既有 `latest`、tarball SHA-512/SHA-1，
以及发布日志 SHA-1；全部 dist 文件集合和字节均与同 run artifact 一致。

| 包 | tarball bytes | dist 文件数 | tarball / 发布日志 SHA-1 |
| --- | ---: | ---: | --- |
| `@lumal/charts` | 12,158 | 13 | `df16d04214bdb0c3baebf6398137ede0fefedaba` |
| `@lumal/cockpit` | 97,196 | 97 | `5b0edb26980e3cbce057103af4c3f6fba0456787` |
| `@lumal/core` | 178,177 | 279 | `dbf522da42e30baa987cfa4c4b4edfa8ee6c36f6` |
| `@lumal/datav` | 92,428 | 131 | `a576533adda4711609fb64b278e06a37f5bbf4bf` |
| `@lumal/icons` | 19,279 | 44 | `11119c3d348244d5b4889c12346b9af74eeb7b8a` |
| `@lumal/icons-vue` | 16,944 | 19 | `59678801930a6f1453488471d62d7cc56b97477f` |
| `@lumal/vben-compat` | 33,278 | 51 | `83f70ec9b0037b7af53f1f58d72352e2829d35ca` |
| `@lumal/viewport` | 10,766 | 14 | `3262454c1f4a1e329c528e1d6104d646f051e7e4` |
| `@lumal/vite` | 19,172 | 18 | `72f984c18bf97953cf7db75167c2fb2674200694` |
| `create-lumal-admin` | 105,173 | 36 | `1e0d1180c8c97b55fb27e7848fbd0389868e2142` |

Registry 未提供十包 gitHead，实际记录为 null，不伪造该字段。
来源链由明确 tag、同 run artifact 字节及发布日志/registry 校验和建立。
严格报告为
`output/release/registry-published-verification-0.0.7-beta-2026-10-26T10-03-55-449Z/report.json`，
SHA256 为 `785d5368ae114bd4d426ba93b0af00a3aee735625493aae2ed3555794f1cab76`。
发布日志 110,937 bytes，SHA256 为
`220199e39cc3ea4af351a9a22b93f06d93010348f4ea4f9c9262d052755b5d31`。

## 发布后独立消费

Windows x64 / Node 24.14.1 / pnpm 10.33.0，于 18:04:36 至 18:09:38 执行：

```bash
node output/release/verify-registry-consumers-0.0.7-beta.mjs \
  --tag-sha 5d190e2d726c192fdd3dc49a03190c4559906743 \
  --registry-report output/release/registry-published-verification-0.0.7-beta-2026-10-26T10-03-55-449Z/report.json \
  --temp-parent F:/lumal-release-validation
```

退出 0，32 条子命令和一次 metadata HTTP 操作全部成功。
使用真实 registry CLI；Blank 经过 `pnpm --package=create-lumal-admin@0.0.7-beta dlx create-lumal`，
Minimal 经过保留的 `pnpm create lumal-admin@0.0.7-beta` 入口。
没有 workspace、file/link、npm alias、源码 alias 或 overrides。
实际安装和 lockfile 的 Lumal integrity 均与严格发布报告一致。

每组先正常安装生成 lockfile，再复制到没有 node_modules 的独立目录做 frozen 安装。
冻结副本执行完整 `pnpm check`，覆盖 lint、format:check、typecheck、test、build；
额外执行 `pnpm format` 并以源码哈希验证幂等，冻结安装不改变 lockfile。

| 场景 | runtime / dev 依赖数 | normal / frozen 秒 | check / format 秒 | 总 JS / CSS gzip bytes |
| --- | --- | --- | --- | --- |
| Blank | 1 / 12 | 19.607 / 2.722 | 13.976 / 0.762 | 24,028 / 175 |
| 静态 Screen | 1 / 12 | 18.410 / 2.717 | 12.125 / 0.583 | 24,855 / 543 |
| Screen HTTP + HTTP Auth + contain | 4 / 12 | 36.164 / 2.887 | 12.431 / 0.675 | 41,454 / 705 |
| Admin Minimal / Local / Hash | 7 / 13 | 23.274 / 5.955 | 39.276 / 0.904 | 210,151 / 42,380 |
| Admin Standard / HTTP / History | 7 / 13 | 21.723 / 5.976 | 16.258 / 1.285 | 378,610 / 43,182 |
| Admin Vben Compatible / Local / History | 8 / 13 | 25.622 / 6.920 | 16.779 / 1.323 | 394,487 / 43,463 |

表中 gzip 为全部 JS/CSS 逐文件压缩后求和，不是首屏网络传输。
Blank 和静态 Screen 仅有 Vue 运行时依赖。
Windows pnpm.cmd 调用产生非致命 DEP0190 警告，所有命令退出 0；
脚本拒绝 shell 元字符，参数只来自固定参数和隔离临时目录。
本节不证明真实业务后端联通或原业务 Dashboard 已验收。

完整报告：
`output/release/registry-consumers-0.0.7-beta-2026-10-26T10-04-36-156Z/report.json`，
SHA256 为 `afd2f874539ad3e86cff8d4ab0b10f9825b3db4cef58800eedc19e95f1a83e7c`。
隔离工程保留在 `F:/lumal-release-validation/lumal-npm-007-cauxgH`。

## 正式产物预算

| 站点 | 首屏 JS gzip bytes / 原上限 | 首屏 CSS gzip bytes / 原上限 |
| --- | ---: | ---: |
| Admin | 332,910 / 335,000 | 42,805 / 50,000 |
| Cockpit | 687,537 / 800,000 | 71,265 / 80,000 |
| DataV Guide | 417,337 / 850,000 | 46,295 / 55,000 |
| Vben Compat | 285,639 / 300,000 | 40,635 / 45,000 |

均为正式 tag 的同 run 结果，未提高预算。演练 Admin 的 332,898 B 与此不同，
不能混为正式数据，也不将个位字节的构建差异作为性能收益。

## 后置更新边界

当前指南、仓库 Skill 与 Demo 的后置修改单独提交并验收，不移动发布标签，
不为站点修复重发 npm。同版 registry tarball 的 README 是发包时快照，
后置修改仓库文档不会改写已发布 tarball。

两个真实业务仓库保持只读。省级旧消费者原有失败与业务补丁仍以
[兼容报告](./real-consumer-compatibility.md) 为准，不根据版本号直接宣称补丁均可删除。
公开 Demo、文档构建与生产部署分别记录；当时尚未执行站点发布，
后续结果见下方「合并与站点实际验收」。

## 发包后文档、Skill 与 Demo 验收

遵循先发包后更新的顺序，后置修改分为两个独立提交：

- `f530075`：同步十包 README、当前指南、文档站、版本检查与仓库 Skill。
  历史版本事实保留，不全局替换旧版本号。
- `cffa764`：Admin Header 增加 responsive / contain / width 选择，
  仅适配实际内容工作区，默认 responsive。使用公开 Viewport API，
  不改根字号、Header、标签栏、侧栏或权限白名单。

工作区设计尺寸为 1280×720，缩放下限 0.75，可读字号下限 12px。
正文及 Element Plus 变量显式补偿字号，自有小字通过应用 token 接入；
这不是对任意第三方固定字号的自动保证。六类可信页面保持 responsive：
`examples/viewport`、`examples/datav`、`examples/cockpit`、
`examples/crud-table`、`system/user`、`system/role`。
前三类避免双重缩放，后三类保留非 Teleport CRUD 编辑器的定位上下文。
其他系统页的 Select/Dialog 经实际点击验证仍 Teleport 到画布外。

三层包装 DOM 与插槽保持稳定，模式切换不重建 RouterView/KeepAlive 或清空草稿。
空间不足时使用局部滚动；偏好持久化对损坏或不可用 storage 安全回退。
应用侧调整未改包源码、manifest 或 lockfile，不需要重发 npm。

### 本地复测

环境为 Windows x64 / Node 24.14.1 / pnpm 10.33.0。
下表日志均位于 `output/release/`，未把正式 tag 的 CI 结果当作后置提交的验证。

| 验证项 | 实际命令 | 结果 / 日志 |
| --- | --- | --- |
| Admin 单元测试 | `pnpm --filter lumal-admin test` | 29 files / 211 tests，`007-postpublish-admin-tests-final.log` |
| 根脚本测试 | `pnpm test:scripts` | 9 files / 132 tests，`007-postpublish-scripts-tests-final-report.log` |
| Docs / Skill 专项 | `pnpm exec vitest run --config vitest.config.ts scripts/docs-links.test.ts scripts/lumal-skill.test.ts` | 2 files / 65 tests，`007-postpublish-docs-skill-tests.log` |
| 全仓 lint / 模板格式 | `pnpm lint`、`pnpm format:check` | 退出 0，`007-postpublish-lint-final.log`、`007-postpublish-format-check.log` |
| 发布边界 / 工作流 / 版本 | `pnpm release:boundaries`、`pnpm release:workflows`、`pnpm release:verify` | 退出 0；分支版本检查不包含 tag 检查，对应 `007-postpublish-*.log` |
| 文档构建 | `pnpm docs:build` | 严格链接构建通过，`007-postpublish-docs-build-final-report.log` |
| Admin 类型及生产构建 | `pnpm --filter lumal-admin build` | vue-tsc 与 Vite 退出 0，`007-postpublish-admin-build-cffa764.log` |
| 生产浏览器完整回归 | `pnpm test:e2e:release:built` | 38 passed，`007-postpublish-admin-e2e-cffa764.log` |
| 产物检查 | `node scripts/check-release-artifacts.mjs` | 退出 0，`007-postpublish-artifacts.log` |
| 全站预算 | `pnpm release:budgets --require-all` | 退出 0，`007-postpublish-budgets-cffa764.log` |

最终生产浏览器回归于北京时间 18:40:05 开始，耗时 127.989 秒：
expected 38，skipped/unexpected/flaky 均为 0，顶层错误数组为空，没有重试。
新四项覆盖三模式与持久化、草稿/缓存、局部滚动、六类覆盖及 Teleport 浮层。
1440×700 时实际工作区为 1132×542，contain 为 0.752778，
width 为 0.884375，验证高度约束真实生效，不仅断言模式标记。

JSON 报告保留为
`output/release/007-postpublish-admin-e2e-cffa764-report.json`，
436,015 bytes，SHA256 为
`b53df86a7795256e0d142b578d1d698b2f319532d6dd9a13559bc50082178dab`。
HTML、截图与测量附件分别保留于
`output/release/007-postpublish-admin-e2e-cffa764-html/`、
`output/playwright/007-postpublish-cffa764/`。

首次完整回归为 34 passed / 4 failed，新用例错误地假设 Element Plus Dropdown
暴露 `menuitemradio`。核对已安装实现和 trace 后，改用真实 `menuitem`
并以 `aria-current` 表示当前模式，保留点击、状态、布局与交互断言；
没有增加超时、重试或 skip。初始日志与失败现场保留于
`007-postpublish-admin-e2e.log` 和 `007-workspace-role-baseline/`。
截图附件禁用过渡动画以固定取证时刻，应用动画与原动画测试仍保留。

### 后置产物与 Skill

| 站点 | 本地首屏 JS gzip bytes / 原上限 | 本地首屏 CSS gzip bytes / 原上限 |
| --- | ---: | ---: |
| Admin | 334,341 / 335,000 | 43,032 / 50,000 |
| Cockpit | 687,530 / 800,000 | 71,268 / 80,000 |
| DataV Guide | 417,327 / 850,000 | 46,286 / 55,000 |
| Vben Compat | 285,636 / 300,000 | 40,627 / 45,000 |

Admin 同机改造前基线为 332,865 / 42,797 B，增量为 JS 1,476 B / CSS 235 B。
不与正式 Ubuntu 产物直接作增量对比；没有新增依赖或提高预算。
Admin JS 距原预算仅余 659 B，后续示例仍须保持动态加载边界。

仓库 Skill 与本机安装副本已逐文件比对并同步六份知识文件；
两份 `quick_validate.py` 校验均通过，独立接线审查未发现公开 API 使用障碍。
本机 Python 默认 GBK，直接运行曾在以 GBK 读取 UTF-8 文件时解码失败；
显式使用 `python -X utf8 <宿主的 quick_validate.py> <Skill 目录>` 后两份均通过，
未修改校验器或将 Skill 改为 GBK。
整目录文本一致；原有 `references/charts.md` 与宿主元数据仅有 LF/CRLF 差别，
没有为换行重写这两个安装文件。
保留宿主 `agents/openai.yaml` 元数据，SHA256 仍为
`6910543fc6e333d6a53c0d4b36494d4127cc7e6b6d918ffab17b7d94797fe9d1`。
公共 `--lumal-viewport-min-font-size` 与 Demo 的应用专用
`--lumal-workspace-min-font-size` 已在指南中区分。

上述本地复测不能替代后置提交的远端 PR 门禁，也不证明线上已更新。
后续 PR 门禁、合并与生产部署的独立结果见下文。

## PR 收尾与部署恢复

PR [#9](https://github.com/cuteyuchen/lumal/pull/9) 完整包含旧 PR #8 的历史，
合并前仍须通过当前提交的门禁，不能沿用正式 tag 或旧 head 的成功记录。

### Windows Cesium 取证拆分

后置 head `0b9c8e8` 的 CI `40311683158` 成功；Build Validation `40311683164`
的 Ubuntu、消费者和 Windows DataV 成功，但 Windows Demo Job `121534158932`
在 Cesium 用例耗尽 90 秒总预算。失败日志与 artifact `12645676662` 的 trace 显示：
Context 创建 16.144 秒、全幅截图 31.387 秒、同步 PNG 分析 20.615 秒。
After Hooks 已开始后才执行 resize，最后断言仅运行 512ms 即清理，
不能用此时残留的 `data-scale="1.000"` 证明正常 resize 失败。
原全幅图为 1886×962、616,550 bytes、290 种颜色，不是空白画布。

保留全部资源、Workers、全幅像素、原实例 resize、几何、截图和释放断言，
将全幅像素与 resize 拆成独立用例，并在退出 Cesium 后分析已经捕获的 PNG。
未修改 90 秒总预算、20 秒断言预算、0 次重试或应用运行时代码。
套件从 10 项变为 11 项；正式 tag 的 10 项仍是该 tag 的真实历史结果。

Windows x64 / Node 24.14.1 / pnpm 10.33.0 本地复验：

| 验证项 | 实际命令 | 结果 / `output/release/` 日志 |
| --- | --- | --- |
| 完整构建 | `pnpm cockpit:build` | 退出 0，类型及 Vite 构建、389 项 Cesium 资源通过；`007-pr9-cockpit-build-split.log` |
| 浏览器类型 | `pnpm typecheck:e2e:cockpit` | 退出 0；`007-pr9-cockpit-e2e-typecheck-split.log` |
| 应用单元 | `pnpm --filter lumal-cockpit test` | 6 files / 26 tests；`007-pr9-cockpit-tests-split.log` |
| 生产浏览器 | `pnpm test:e2e:cockpit:built` | 11 passed / 124.528 秒，无跳过、意外失败、flaky 或重试；`007-pr9-cockpit-e2e-split.log` |

完整浏览器报告保留为 `output/release/007-pr9-cockpit-e2e-split-report.json`，
2,499,065 bytes，SHA256 为
`b0914baa53080202335dacae95028e5c47f06eb7a8755d12b0c2c36081e999a9`。
Cesium resize / 全幅像素 / 中断恢复分别耗时 13.632 / 14.309 / 14.970 秒；
本机全幅仍检出 290 色，解码分析 59.9ms。不能将本机耗时冒充 Windows CI 复测结果。
该修复随后以 `e1ad53d` 通过独立 Ubuntu / Windows 门禁，结果见下方表格。

### 云端构建与生产 API

Cockpit 失败 Preview `dpl_5UEqEc3GBd9EW5KT9suQrTATZYp4` 的实时日志为：
公共包构建成功，随后 `No projects matched the filters in "/vercel/path0"`，
最终 `STATIC_BUILD_NO_OUT_DIR`，应用本身没有构建。平台历史遗留了改名前的
filter 和输出目录，不是本次 Vite / Cesium 构建错误。
已定向将该项目 Build Command 设为 `pnpm cockpit:build`、
Output Directory 设为 `apps/lumal-cockpit/dist`，其余项目和设置保持不变。
新 Preview `dpl_AQNS2Y8V4oTZeW1zcBNBxck7quED` 实际执行此完整构建链、
复制 389 项资源并 READY，构建至就绪 57.223 秒；不是只检查设置更新成功。

Admin 当前生产构建使用公开变量
`VITE_API_BASE_URL=https://lumal-mock-api.vercel.app/api`；
同域 `/api/status` 实测 404，公开 Mock 的 `/api/status` 与允许 Admin Origin 的 CORS 实测正常。
普通 CI 使用 `/api` 的静态产物不能直接覆盖线上。
部署时必须保留生产 API 配置，并将 Mock API 同步到包含新菜单种子的提交。
这些均为公开 Demo 接线，不涉及两个真实业务项目。

2026-10-26 的 PR 六项目 Preview 证明平台 Git 集成仍开启；
不能声称它已受 Actions Release Gate 自动约束。
本次维护者已明确授权验收后合并及更新文档和 Demo，
仅在当前 PR 全部门禁通过后进行定向站点恢复，并逐站记录提交、READY、alias 与 HTTP 结果。
不重跑已发布版本的 npm 链，不移动 `v0.0.7-beta`，不把历史部署快照当作本次线上证据。

## 合并与站点实际验收

本节为首次恢复的固定证据，不是对后续每次部署的永久状态承诺。
2026-10-26 23:22:18（北京时间），PR #9 使用 merge commit 合入
`master@e2ac131507a7a352749d62bbf0fefd4052803a0d`，保留全部提交历史。
PR #8 于 23:22:21 因历史已完整包含而自动标记 MERGED。
当时全部远程分支头均为新 master 的祖先，没有重复合并、删除旧分支或改写历史。
合并树与通过验收的 head `e1ad53d` 相同。

### 当前提交的远端门禁

| 验证项 | 实际 run / job | 结果 |
| --- | --- | --- |
| PR 主 CI | `40344570989` / `121647946058` | 131 files / 1,207 tests；lint、format、边界、类型、构建通过 |
| PR Ubuntu Demo | `40344570964` / `121647945854` | Cockpit 11 / Admin 38 生产 E2E、26 项应用单元、严格文档和原预算通过 |
| PR Windows Demo | 同 run / `121647945327` | 同上，Cockpit 481.416 秒、Admin 2.8 分钟；无跳过或重试 |
| PR Windows DataV | 同 run / `121647945808` | 21 passed，37.4 秒 |
| PR 独立消费者 | 同 run / `121647945679` | 12 组 Admin、8 个 CLI cases、14 组 Blank/Screen、三级视口与真实 zoom 通过 |
| 合并后主 CI | `40348667114` / `121662411103` | success，5 分 36 秒 |
| 合并后 CodeQL | `40348667390` / `121662408725` | success，2 分 11 秒，分析已上传 |
| 合并后 Build Validation | `40348667663` | failure：Ubuntu Demo、Windows DataV、独立消费者通过；Windows Cockpit 10 passed / 1 failed，后续 Admin / Docs / 预算未执行 |

PR head 为 `e1ad53d579f66deba88f96e4d0e4addede5720f4`；
Actions 检出的 PR merge ref 为 `96a7be2965060c08a3908455978abda201fdbf08`，
不把它混称为最终 master SHA。
Windows 为 Server 2025 / Node 22.23.4，Ubuntu 为 24.04 / Node 22.23.3，
均使用 pnpm 10.33.0。Cockpit 两平台报告 expected 11，
unexpected / skipped / flaky 均为 0。Ubuntu Cockpit 耗时 385.590 秒。
消费者是脱敏隔离夹具，不代表两个业务系统已在线验收。

CodeQL 原先被 GitHub 标为 `disabled_inactivity`，本次恢复现有工作流后，
合并提交实际触发并成功；没有将未运行的历史状态记为通过。
合并后的 Build Validation 独立运行，其 Windows 失败不冒用 PR head 的通过状态。
失败 job `121662410063` 在 Cesium 中断恢复用例的首次组件就绪断言超时：
trace 中 Cesium Tab 已选中，但惰性 Center JS 的 HTTP 200 请求耗时 23.169 秒，
晚于 20 秒断言结束约 1.52 秒；期间 `Suspense` 仍保留旧 ECharts 分支。
尚未执行到 WebGL 中断和恢复，不能据此认定 Cesium 恢复逻辑失败，
也不能仅凭无 Console 异常将该用例记为通过。原日志和 trace 保留在
`007-master-windows-e2ac131-job-121662410063.log` 与 artifact `12664570185`。
后续修复须在保持原超时、重试和体积预算的条件下独立验收。

后续 Demo 整改将 `SceneCenter` 的 `Suspense` 设为立即 fallback：
切换惰性引擎时显示已有加载态，同时卸载旧画布；不修改公共包或增加运行时依赖。
两项受控异步回归分别验证等待时释放旧图表，以及切回同步地图后迟到组件不得重新挂载。
旧实现定向红测为 3 passed / 1 failed；修复后本机应用单测 6 files / 28 tests、
生产 E2E 11 项通过（约 2.1 分钟），包含三项 Cesium 旧画布释放断言。
`build:app`（含 vue-tsc）、浏览器测试类型检查、定向 ESLint 与严格文档构建通过。
这证明本机行为契约，不单凭释放旧画布宣称 Windows 冷加载必然缩短至 20 秒以内；
后续 PR 与 master 的远端结果须按其精确提交分别检查。

### 生产部署

以下五项为既有 Git 集成从精确 master SHA `e2ac131` 构建，
均为 production / READY、`aliasError=null`，生产别名已核对：

| 站点 | Deployment ID | 构建至就绪秒数 |
| --- | --- | ---: |
| Admin | `dpl_FuohfjbaV2RnHsfxZnBhsKRVoAeW` | 76.517 |
| Cockpit | `dpl_Ejfmp7NJPr1iVaJZLjmg9t9J9Gjv` | 84.070 |
| DataV | `dpl_3WASXHUVDi3Uonb3DTNiqc94ctKx` | 101.075 |
| Compat | `dpl_T8n3BAu3fzRbiQgwVGtAvSabApGK` | 70.128 |
| Mock API | `dpl_FRbZqao6NrmwNxMWoehQczLpus56` | 13.748 |

耗时为 `ready - buildingAt`，不含排队及后续缓存上传，不等于 Vite 编译耗时。
Git 自动生产依旧独立于 Actions；本次在全 PR 门禁通过后才合并，
不能据此声称平台已具有强制等待 Release Gate 的配置。

Docs 的 Git 部署被既有 Ignored Build Step 取消，GitHub 显示绿色也不代表构建成功。
保留该策略，从干净 `e2ac131` 执行 `pnpm docs:build`，使用既有
`prepare-vercel-output.mjs --clean-urls` 封装固定快照，再由 Vercel CLI 64.5.0
定向 prebuilt 上传。没有拉取或打印项目秘密环境值、关闭保护或重发 npm。

- Docs Deployment：`dpl_FFdr9BReKf4kcJqVEuUK5ATpXKXY`，production / READY / source=cli。
- 正式别名：`https://lumal.cuteyuchen.top`，`aliasError=null`。
- 快照：`F:/lumal-release-validation/deploy/docs-master-e2ac131-20261026/.vercel/output`。
- 平台返回 `meta={}`，不伪造 Git metadata；来源链由干净源码、构建日志、
  固定快照及下方公网逐文件哈希共同建立。

### 公网 HTTP 与权限

23:30 至 23:31 使用 Node 24.14.1 的显式环境代理执行；
首次原生 fetch 未使用代理，在 `/status` 网络超时，未取得 HTTP 响应且未创建会话。
诊断后经同一公开地址返回 HTTP 200，再以新报告复验；未把客户端网络阻塞伪装为 API 失败或成功。

| 对象 | 实际命令 / 检查 | 结果 |
| --- | --- | --- |
| Docs 固定快照 | `node --use-env-proxy <既有 verify-docs-deployment.mjs> <公开域名> <固定快照>` | 279 / 279 文件 SHA256 一致，83 条 clean URL 映射、真实 404，失败 0 |
| 四站静态资源 | `node --use-env-proxy output/release/verify-sites-007.mjs --sha e2ac131507a7a352749d62bbf0fefd4052803a0d --report <新文件>` | Admin 107、Cockpit 49、DataV 48、Compat 29，全部 HTTP / MIME / 解析通过 |
| Mock 会话与权限 | `node --use-env-proxy output/release/verify-mock-007.mjs --report <新文件>` | CORS、admin 新菜单、Cockpit 权限、guest 后端 403，通过；两自建会话均 finally 退出 |

Docs 快照整体 SHA256：
`269e19a9ea8a597b5954292a5d22f9ff8522350707053c56fb9eaadfc22d888d`。
四站验收遍历静态/动态 JS import 与 Vite 预载 CSS；
Admin 的 `examples/icons/viewport/datav/cockpit` 均解析到可获取的真实 JS chunk，
关于页元信息为 `commit=e2ac131`、`version=0.0.7-beta`，
生产 Mock baseURL 保持正确。Cockpit 另核对 Worker、Assets JSON 和 Widgets CSS，
拒绝以 HTML fallback 冒充静态资源。没有对公网执行 CRUD、重置或全套破坏性 E2E。

HTTP 资源检查不替代真实浏览器交互，也不证明与另一次 CI 产物逐字节一致；
浏览器证据来自上述精确 PR 的双平台生产 E2E。
本次未在生产域名重跑完整浏览器套件或业务系统验收。

证据均在忽略的 `output/release/`，不进入 npm：

| 文件 | SHA256 |
| --- | --- |
| `007-docs-e2ac131-production-http.log` | `3eb4ca3539860e099075d8ec09214de44d05d66aace18634532c28f271f278e5` |
| `sites-production-007-e2ac131.json` | `c8ad198aed425daf8e4f11ec282bad8d6824a83d9ebc0b18936a46c59839edec` |
| `mock-production-007-e2ac131-proxy.json` | `e0cd51a47599f7faa1595ee9fc41c0256885a7b0abe9c9b28d3bb260bd425414` |

部署元数据为 `vercel-production-e2ac131.json` 与 `vercel-docs-prebuilt-e2ac131.json`。
本报告在首次部署后归档，不在该固定 Docs 快照中；后续文档归档部署需单独保留其快照，
不能把报告提交号混称为首次站点构建号。

### 体积与剩余边界

PR Windows Admin 首屏 JS / CSS gzip 为 334,337 / 43,032 B，
Ubuntu 为 334,348 / 43,041 B，原上限仍为 335,000 / 50,000 B。
Cockpit 分别为 687,530 / 71,268 B 与 687,537 / 71,265 B，
原上限仍为 800,000 / 80,000 B。无新增运行时依赖或预算调整。

两个真实业务项目保持只读；未宣称业务 Dashboard、商业地图或真实后端已验收。
十包版本与 `v0.0.7-beta` 保持不变，站点、文档和 Skill 后置修改不改写已发布 tarball。
