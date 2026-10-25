# 0.0.6-beta 发布执行记录

准备日期：2026-10-25。分支：`codex/lumal-project-types-and-quality`。
准备起点：`8c1d7ea55cec1eed6b7fb852badd007e57fcf30a`。

## 当前状态

**候选准备中，尚未发布。** 不把此前 `0.0.5-beta` 或源码验收记录当成本版发布成功。
本页随真实执行结果更新；任何门禁失败、凭据错误或部分发布均停止后续发布动作。

- 已只读核实九个已发布包的 `beta` 均为 `0.0.5-beta`，新增 `@lumal/viewport` 返回 404。
- 十包均不存在 `0.0.6-beta`；选择该统一候选，保留历史版本与 `latest`。
- 已同步公共包和应用内部依赖、lockfile、十包 CHANGELOG、当前文档和仓库 Skill。
- 十包构建、冻结安装、registry 预检、85 项文档/Skill/发布安全契约、Skill validator 和文档生产构建通过。
- GitHub API 登录有效；Git 单次命令使用系统现有代理后 fetch 成功，不修改全局配置或关闭 TLS 校验。候选尚未推送。
- `DEPLOY_PRODUCTION` 变量不存在，本次只授权 npm 发布，不开启生产部署。

## 门禁

| 项目                                  | 实际状态               |
| ------------------------------------- | ---------------------- |
| 本版版本、内部依赖与 frozen lockfile  | 已通过，十包均尚未发布 |
| 本版完整本地发布检查                  | 未执行                 |
| 本版文档生产构建与 Skill 契约         | 已通过，文档构建 9.49s |
| 候选 Ubuntu / Linux PTY               | 未执行                 |
| 候选 Windows / 三轮 DataV 视觉        | 未执行                 |
| 同 run 静态站点与全部预算             | 未执行                 |
| 匹配 tag 的正式 npm 发布              | 未执行                 |
| 十包 registry / beta / tarball 完整性 | 未执行                 |
| 生产部署                              | 未授权，不执行         |

## 安全边界

仅通过仓库 `release-gate.yml` 发布；分支先运行 `dry_run=true`，
真实发布需要版本匹配的 tag 及四个校验 job 全部成功。
不修改或部署两个原业务项目，不将私有实现、接口配置、凭据或完整业务日志写入公开仓库。
省级旧版/候选隔离对照的既有失败仍见 [真实消费者兼容性](./real-consumer-compatibility.md)，
脱敏夹具和公共包门禁不等于原 Dashboard 或真实后端的业务验收。
