# 0.0.7-beta 发布执行记录

日期：2026-10-26。发布分支：`codex/release-0.0.7-beta`。

## 发布状态

**十包已发布，registry 完整性、同次 CI 产物及六类独立消费者全部核验通过。**
遵循本轮要求，先完成发包和消费验证，再更新当前文档、Skill 与 Admin Demo。
没有本地直接 publish、重发、移动既有标签或部署生产站点。

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
公开 Demo、文档构建与生产部署分别记录，本站点发布仍未执行。
