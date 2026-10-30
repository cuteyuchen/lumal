# 0.1.1-beta 发布执行记录

日期：2026-10-30。**十个公共包已发布，registry、同次正式门禁产物与八类独立消费者全部核验通过。**
发布命令成功、安装消费、应用验收和生产部署分别记录，不相互替代。

## 版本与授权

- PR [#18](https://github.com/cuteyuchen/lumal/pull/18) 以
  `747aaeb7e9fe43d126f09db97fb5ef7c1abf51ad` 合入 master，保留提交历史。
- 附注标签 `v0.1.1-beta` 固定指向
  `7e4d01cd462c324129e24cb80d7fe742523c4f23`。
  该提交仅在合并后修正十包 README 的发布状态表述。
- 旧 `v0.1.0-beta` 与失败 Gate `40900334549` 保持原样，该版本未发布。
  不移动旧标签、不复用失败版本、不本地直接 publish。
- 维护者明确授权提交、验证及发布，随后明确暂缓 Cockpit Demo，只要十包验证无误即可发布。
  该授权不代表 Demo 已修复，也不用于修改或绕过正式发布门禁。
- 十包 `beta` 均为 `0.1.1-beta`。九包 `latest` 仍为 `0.0.1-beta`，
  `@lumal/viewport` 的 `latest` 仍为 `0.0.6-beta`，与发布前快照一致。
- `DEPLOY_PRODUCTION` 未启用，正式 deploy 为 skipped，未手动部署生产。
  平台 Git 自动部署独立于 Actions，本记录不声称它们全部关闭或线上已验收。

本版是旧 Beta 多模式体系的破坏性升级：业务继续写 px，由 Vite 按项目唯一设计宽度
生成普通 vw；Core 动态设计尺寸、DataV、Cockpit 使用同一宽度配置。
Viewport 仅保留宽度数值工具、共享窗口监听和实际元素测量；
旧策略插件、画布包装、模式联合类型及 DataV/Cockpit 整画布缩放已移除，不提供兼容壳。
详细接线与动态数字边界见 [统一 vw](./screen-viewport-guide.md) 和 [迁移指南](./upgrade-guide.md)。

## 正式门禁

[Release Gate 40998794045](https://github.com/cuteyuchen/lumal/actions/runs/40998794045)
由正式标签 push 触发，四个校验全部成功后才发布十包，没有使用历史通过状态代替。
发布 job 于北京时间 **12:20:16** 成功结束。

| 校验 / 作业 | Job | 结果 / 总用时 |
| --- | --- | --- |
| 版本、lockfile、tag、工作流安全与 actionlint | `123878076440` | success，24 秒 |
| Windows lint、格式、单测、类型、构建、tarball、DataV 视觉 | `123878206038` | success，12 分 16 秒 |
| Ubuntu 完整 `pnpm release:check` | `123878206077` | success，31 分 20 秒 |
| Docs / Cockpit / DataV Guide 构建、生产浏览器与全部预算 | `123887304001` | success，6 分 9 秒 |
| 十包串行发布，复用本次校验的 npm dist | `123889151078` | success，38 秒 |
| 生产部署 | `123889350843` | skipped |

两平台主链各 **137 文件 / 1,263 项测试**，不将消费者重复运行的测试混入该计数。
正式门禁还包括：

- Vite/Viewport 独立 tarball 的 ESM/CJS、类型、SSR、CSS/SCSS、模板 AST、
  原子类、忽略、来源、Source Map、幂等与 Dev/Build，以及 D=1920/1440。
- 12 组 Admin 主组合、4 组可选能力、12 组浏览器消费者与 14 组 Blank/Screen。
- 视口消费者 48 组主检查、36 组宽度检查、4 组滚动条检查、2 组生命周期检查；
  1280×720、1366×768、1920×720/920/1080、2560×1440，
  原生 browser zoom 为 80% / 100% / 125% / 150%，不以 DPR 或调整 viewport 代替。
- 37 项 Admin 生产 E2E、12 项 Ubuntu Cockpit 生产 E2E、21 项 Windows DataV 视觉回归。
- 原有发布边界、完整类型检查、产物检查、预算和十包 pack dry-run。

### 独立 Windows Demo 例外

最终源提交的 CI `40997330017`、CodeQL `40997330095` 成功；
Build Validation `40997330038` 的双平台 Vite tarball、完整消费者、
Windows DataV 和 Ubuntu 生产链成功，但 Windows Cockpit 生产浏览器步骤失败。
不把整个 Build Validation 记为通过，也不声称此前的 WARP / 几何读取修正解决了所有问题。
维护者授权暂缓该独立 Demo，未继续修改其源码、测试或预算。
正式 Gate 自身的 Windows 公共包检查和 Ubuntu 生产浏览器均真实通过。
完整历史失败见 [回归记录](./release-regressions-2026-10-30.md)。

## Registry 与同次产物

正式 npm artifact：`12953413658`，
`lumal-npm-dist-7e4d01cd462c324129e24cb80d7fe742523c4f23`。
下载 ZIP 的 SHA256 与 API digest 相同：
`012f27227fb27f38984e2e5b956ea213432cec67bd1a7e7d632d404929774d58`。
解压后为 **700 个 dist 文件 / 1,859,441 bytes**，不是工作区遗留 dist。
相较 `0.0.7-beta` 发布快照的 702 文件 / 1,843,293 bytes，文件减少 2 个、
未压缩总量增加 16,148 bytes；十包 tarball 合计 590,488 bytes。
这是版本产物差异，不是同环境性能基准或性能收益承诺。

```powershell
node output/release/verify-published-0.1.1-beta.mjs 7e4d01cd462c324129e24cb80d7fe742523c4f23 output/release/formal-40998794045-npm-dist
```

最终退出 0。逐包核对 tag manifests、exports、类型、样式、bin、内部同版依赖、
README/CHANGELOG/模板资源、tarball SHA-512/SHA-1、发布日志 SHA-1、beta/latest，
全部 dist 文件集合与字节和本次正式 artifact 一致。
Registry 未提供 gitHead，十包均记录 null，不伪造该字段。

| 包 | tarball bytes | dist 文件数 | tarball / 发布日志 SHA-1 |
| --- | ---: | ---: | --- |
| `@lumal/icons` | 19,391 | 44 | `6363231e685d3dc201d0d0f273de7b502f9d4905` |
| `@lumal/icons-vue` | 17,507 | 19 | `c7e61e64422f07c0a80b93ad21ae2775475905c5` |
| `@lumal/core` | 185,158 | 285 | `db112fea9ecec741ce6386d823a40132ed4c7c4f` |
| `@lumal/charts` | 12,781 | 13 | `36c1f41c186cb7bd4d7fe4f97c34297385f93ccc` |
| `@lumal/viewport` | 8,183 | 10 | `31bf344a0f56a623c351307afb4cf1c6ce3f5f59` |
| `@lumal/datav` | 92,309 | 129 | `5f95c1470b2581aa950f0382dd15054c3a9e9593` |
| `@lumal/cockpit` | 95,542 | 95 | `1142dbc64633d5af726b06e01ba3ed92696d29b5` |
| `@lumal/vben-compat` | 33,495 | 51 | `890aed419e031d753be30779c308591b6b23e1a3` |
| `@lumal/vite` | 19,944 | 18 | `8997a5b6c130db3d251d40e1688d409ecc4ab8e0` |
| `create-lumal-admin` | 106,178 | 36 | `ba5cbec81f3a9877cd8a05afde9d2c1f26a32534` |

严格报告：`output/release/registry-published-0.1.1-beta-EC7wr1/report.json`，
SHA256 `55f9f819aac7622cf5b0a9d5a24d9f1e679e4251938db5d2b04ebc92591fed7b`。
发布日志 111,821 bytes，SHA256
`48cad0cd434be55477d7607998b67853af4a67bb33531e962bd205cf8853d987`。

首轮查询因聚合元数据尚未包含 icons-vue 新版本而中断，精确版本端点随后十包均返回 200；
未重复发布或修改 dist-tag。第二轮核验发现 npm 将 bin 的 `./dist/...` 规范化为 `dist/...`，
仅修正本地核验脚本，对 tag、registry 和 tarball 的 bin 同等去除该可选前缀，
没有减少字段、文件或字节断言。初始日志与失败报告保留。

## 发布后独立消费

使用 Windows x64 / Node 24.14.1 / pnpm 10.33.0，在仓库外系统 Temp 新建工程，
不写入两个只读业务项目。真实 registry CLI 精确安装 `0.1.1-beta`，
禁止 workspace、file/link、npm alias、overrides 和 Lumal 工作区源码引用。
模板自身的 `@ → ./src` 通过 TypeScript AST 明确核对，不误认为引用 Lumal 源码。
初始本地脚本曾错误禁止所有 alias，已修正该核验条件，未修改发布包或生成项目。

每组正常安装生成 lockfile，再复制至无 node_modules 的独立目录做 frozen 安装。
冻结副本执行 `pnpm check`，包含 lint、format:check、typecheck、test、build；
再执行 `pnpm format`，以源码哈希验证幂等，锁文件 integrity 必须与十包发布报告一致。

北京时间 12:34:45 至 12:50:43 执行以下命令，退出 0：

```powershell
node output/release/verify-registry-consumers-0.1.1-beta.mjs --tag-sha 7e4d01cd462c324129e24cb80d7fe742523c4f23 --registry-report output/release/registry-published-0.1.1-beta-EC7wr1/report.json
```

| 场景 | normal / frozen 秒 | check / format 秒 | 项目单测 |
| --- | --- | --- | ---: |
| Blank | 35.894 / 11.061 | 94.807 / 0.581 | 1 |
| 默认静态 vw Screen，D=1920 | 43.002 / 11.318 | 18.855 / 0.591 | 1 |
| Charts Screen，D=1440 | 31.907 / 14.470 | 39.310 / 0.607 | 1 |
| DataV Screen，D=1440 | 36.473 / 12.819 | 18.354 / 0.623 | 1 |
| Cockpit Runtime Screen，D=1440 | 69.494 / 31.261 | 58.693 / 0.629 | 1 |
| Standard Local / Hash Admin | 64.909 / 37.486 | 55.502 / 1.306 | 36 |
| Standard HTTP / History Admin | 67.792 / 38.456 | 29.031 / 1.568 | 46 |
| Vben Compatible Local / Hash Admin | 58.208 / 36.032 | 23.774 / 1.355 | 36 |

43 条子命令全部成功，八组 check 合计 123 项项目单测通过。
最终合并真实 lockfile 中的 Lumal 包集合，断言全部十包都被实际安装，
不是仅查询 registry 或只测试脚手架。Blank 与静态 Screen 仅 Vue 运行时依赖，
静态 Screen 不强制安装 Viewport；三个可视化 Screen 验证共享 D=1440 配置。

报告：`output/release/registry-consumers-0.1.1-beta-9U7A3x/report.json`，
SHA256 `61c87a4d20912d9fb719d4107c6576300c7cdc3fbe413f5f4737a8886bd1c437`。
隔离工程保留在 `C:/Users/yuchen/AppData/Local/Temp/lumal-registry-011-zlejtU`。
Windows pnpm.cmd 的 DEP0190 为非致命警告，全部命令仍退出 0；
参数来自固定输入和隔离目录，脚本拒绝 shell 元字符。
本项不新增浏览器，也不证明真实后端联通或两个业务项目已升级。

## 正式产物预算

| 站点 | 首屏 JS gzip bytes / 原上限 | 首屏 CSS gzip bytes / 原上限 |
| --- | ---: | ---: |
| Admin | 319,997 / 335,000 | 44,885 / 50,000 |
| Cockpit | 686,049 / 800,000 | 72,670 / 80,000 |
| DataV Guide | 418,532 / 850,000 | 48,004 / 55,000 |
| Vben Compat | 283,428 / 300,000 | 42,178 / 45,000 |

均为正式 Gate 本次结果，没有提高预算。Vue 基线 23,303 B，
minimal 26,090 B（增量 2,787 B），request 2,741 B，DataV charts 初始 26,394 B。
不同提交和操作系统的大小不作为同环境性能改善证明。

## 后置文档边界

发包后仅同步当前文档、文档站与仓库 Skill，另行提交，不改包源码或标签。
`git diff v0.1.1-beta -- packages` 必须为空；历史发布记录和失败证据保留。
文档收尾实际验证如下，不用正式标签的 CI 冒充后置提交验证：

| 命令 | 结果 |
| --- | --- |
| `pnpm test:scripts` | 10 文件 / 154 项通过，含文档、Skill、工作流安全与版本回归 |
| `pnpm lint` | 退出 0 |
| `pnpm format:check` | 退出 0 |
| `pnpm release:boundaries` | 退出 0 |
| `pnpm docs:build` | 严格链接构建通过 |
| `git diff --check` | 退出 0 |
| `git diff --exit-code v0.1.1-beta -- packages` | 无包变更，退出 0 |

文档构建仍有既有大 chunk 提示，没有修改阈值或关闭检查。
本次文档提交不另跑实机浏览器、不重跑已发布版本的发布链。
两个业务项目保持只读；动态 JS 设计尺寸仍显式使用公开数字工具，
地图测量、业务数据、屏幕坐标和第三方动态定位不扫描、不二次缩放。
