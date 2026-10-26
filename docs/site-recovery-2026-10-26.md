# 文档站更新与 Admin 图标菜单核验

执行日期：2026-10-26，北京时间。产品版本保持 `0.0.6-beta`。
本次生产文档的源码为 `master@abd9e859e5034e3dd33a9d3dc456c3e06d6c6d3f`，
未重新发布 npm、移动发布标签或修改真实业务项目。

## 文档站

文档源码的首页、安装命令、导航和 Skill 已是 `0.0.6-beta`，
但公开域名仍指向历史 CLI 部署：

| 项目     | 更新前                                     | 本次恢复                                   |
| -------- | ------------------------------------------ | ------------------------------------------ |
| 部署 ID  | `dpl_7vBn9PRwq8JSLeKAy3D39VBc8Sxx`         | `dpl_8y6mLR2f4uNHoG2NGDPFpxCsNQ8i`         |
| 源码提交 | `4112ecc156026672817c79c46e2d846becad2d8c` | `abd9e859e5034e3dd33a9d3dc456c3e06d6c6d3f` |
| 公开地址 | `https://lumal.cuteyuchen.top`             | 相同，已绑定新部署                         |

master 的 Git 部署 `dpl_C4Sthc3MVjjDcJBEzEBmPFhDjdYK` 为 CANCELED，
原因是已有 Ignored Build Step 跳过构建。Git 合并、npm 发布成功或旧部署 READY，
均不能证明新版文档已上线。本次没有开启 Git 自动发布或整个生产部署矩阵。

恢复使用当前源码重新执行 `pnpm docs:build`，复用
`scripts/prepare-vercel-output.mjs --clean-urls` 生成独立固定快照，
核对现有 `lumal-docs` 项目后使用 Vercel CLI `64.5.0` 定向 prebuilt 部署。
没有复用正式发包 run 中缺少后续文档更新的旧 Docs artifact。

固定快照为 `output/deploy/docs-master-abd9e85-20261026-0903/.vercel/output`。
既有 HTTP 验证器以无 Cookie、无 Authorization 的公网 GET 逐文件核对，
2026-10-26 09:04:52 完成：

- 264 / 264 个文件的 SHA-256 与上传快照一致，失败数为 0。
- 78 条无扩展名路径映射生效，目录首页、JS、CSS 和字体均经过核验。
- 未知路径返回真实 HTTP 404，正文与上传的 `404.html` 一致，不用首页冒充深层文档。
- 快照整体 SHA-256：`87e52de7dd1c23b98f316957ede12362fc61d41bbdcd70d6ec6eba6f87224ff1`。
- 原始逐文件结果保留在该快照目录的 `verify-http.log`，不进入 npm 包。

首页、安装、包总览、CLI、viewport、模板指南、三级适配指南与 `0.0.6-beta`
发布记录已随同一次部署更新。历史发布记录保留原版本号，不以全局替换破坏历史。
09:06:22 至 09:06:24 另行独立 GET 核对 11 个页面的各自标题、专属正文与最终 URL，
11 / 11 通过；独立未知路径返回 404。证据文件为
`output/repair/docs-independent-http-abd9e85-20261026.json`，
SHA-256 为 `7161e92a4253678896c219d9d080499472924d311492651a2b906c978de455b5`。
首轮断言曾因 VitePress 零宽锚点、首页 hero 不在正文容器内而误报，
修正验证器定位后重新请求通过，没有为消除误报修改站点。

## Admin 图标菜单

用户错误栈中的资源为 `index-BO6t9qFj.js`、`vendor-lumal-CLk7Xz5M.js`。
错误发生在组件白名单解析阶段，不能通过删除菜单、吞掉异常或任意 fallback 修复。

当前源码契约：

- `apps/lumal-admin/src/router/components.ts` 已注册
  `'examples/icons' -> import('../views/examples/IconsView.vue')`。
- `apps/lumal-mock-api/domain/menu-seed.ts` 下发的组件键为同一字符串。
- `apps/lumal-admin/tests/router.test.ts` 已覆盖 admin、operator、guest
  从菜单访问图标页与恢复深层地址。
- `packages/core/tests/menu-route-runtime.test.ts` 区分组件解析错误和懒加载错误，
  不放宽远程组件白名单。

2026-10-26 08:58:14 至 08:59:42，对公开 Admin 域名进行匿名 GET：

| 资源                               | HTTP | 实际证据                                                      |
| ---------------------------------- | ---- | ------------------------------------------------------------- |
| `/`                                | 200  | 当前入口 `index-BLsRHSkn.js`，预载 `router-CEC3wsMu.js`       |
| `/assets/index-BLsRHSkn.js`        | 200  | 引用上述 router chunk                                         |
| `/assets/router-CEC3wsMu.js`       | 200  | 包含 `"examples/icons":()=>import("./IconsView-CoFIrnIl.js")` |
| `/assets/IconsView-CoFIrnIl.js`    | 200  | JavaScript 模块，15,173 bytes，非 HTML fallback               |
| `/assets/index-BO6t9qFj.js`        | 404  | 用户错误栈中的旧入口                                          |
| `/assets/vendor-lumal-CLk7Xz5M.js` | 404  | 用户错误栈中的旧运行时                                        |

当前公开域名绑定 `dpl_BYCir7h5VgUv6NYy1PZFQweoQFdu`，
源码为 `master@abd9e85`，状态 READY。
首页与路由文件返回 `Cache-Control: public, must-revalidate, max-age=0`，
Last-Modified 分别为 08:47:05、08:47:06（北京时间）。
可以确定当前站点已包含映射和目标页面，不能仅凭这些 GET 断言用户浏览器的具体缓存根因。
没有为这一现象强制重新部署 Admin。

旧标签页应重新载入，必要时使用 Ctrl+F5，再检查实际入口；
不要求清空 localStorage、业务数据或所有站点缓存。
如果新入口下仍复现，应继续收集当前 JS 名称及菜单响应，不能将其认定为同一旧产物问题。

## 新增回归与验证

新增 `apps/lumal-admin/tests/route-component-contract.test.ts`，直接遍历后端静态、
远程菜单种子中的全部 26 种组件，要求前端白名单提供懒加载函数。
另验证关键样本确实被遍历、未知组件仍被拒绝；共 28 项，不联网且不复制菜单夹具。

| 验证项                   | 实际命令 / 环境                                                                                                                                         | 结果                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 菜单契约与 Core 路由异常 | `pnpm exec vitest run --config vitest.config.ts apps/lumal-admin/tests/route-component-contract.test.ts packages/core/tests/menu-route-runtime.test.ts` | 2 files / 51 tests 通过                                  |
| Admin 全量代码测试       | `pnpm --filter lumal-admin test`，本机 Node 24 / 本地 Mock                                                                                              | 27 files / 178 tests 通过                                |
| 新测试 lint              | `pnpm exec eslint apps/lumal-admin/tests/route-component-contract.test.ts`                                                                              | 退出 0                                                   |
| 文档 / Skill / 发布安全  | `pnpm exec vitest run --config vitest.config.ts scripts/docs-links.test.ts scripts/lumal-skill.test.ts scripts/release-safety.test.mjs`                 | 3 files / 85 tests 通过                                  |
| 当前文档构建             | `pnpm docs:build`                                                                                                                                       | 退出 0；保留 VitePress 搜索 chunk 的体积告警，未提高预算 |
| 文档生产 HTTP            | `node output/repair/verify-docs-deployment.mjs https://lumal.cuteyuchen.top/ output/deploy/docs-master-abd9e85-20261026-0903/.vercel/output`            | 264 / 264 文件匹配，78 路径映射，真实 404，失败 0        |
| 文档专属内容复核         | 独立匿名 GET 首页及 10 个指南 / 包 / 发布页面                                                                                                           | 11 / 11 正文、标题与路由匹配；另测真实 404               |
| master CI                | GitHub Actions run `40250940859`，`abd9e85`                                                                                                             | lint、format、边界、测试、类型与构建全部 success         |
| master Build Validation  | GitHub Actions run `40250940866`，`abd9e85`                                                                                                             | Ubuntu 消费者及视口 / zoom、Windows DataV 均 success     |

本次未进行公网账号登录、生产 CRUD 写操作或额外实机浏览器测试。
HTTP 资源核验与代码测试不能被宣称为用户原浏览器环境的完整复现。
未修改公共 API，仓库及安装版 Lumal Skill 仍以已发布 `0.0.6-beta` 为基准，
无需为单次部署记录虚增版本或改写 API 指南。

本报告是后续归档的执行证据，不在本次已上传的固定 Docs 快照内；
不要把报告提交号混称为该快照的构建提交号。
