# 发布前回归修复记录

## 状态与边界

`v0.1.0-beta` 指向 `ee503991eb342ad0d58150eeba7d852474aeecd7`。
正式 Release Gate `40900334549` 的首次运行失败，npm 发布和生产部署均未执行。
旧标签不移动；最初修复经 PR #17 合并至 `master@3d831dd`，
后续版本准备位于 `codex/release-0.1.1-beta`，候选版本为 `0.1.1-beta`，尚未发布。
本记录不能作为新提交的完整发布通过证据。

## 角色授权树

Ubuntu 非发布消费者复验 `40855946423` attempt 3、job `123562719997`
再次在 `standard/local/hash` 的角色授权操作失败。
页面已有 33 个树节点，却包含 33 个未解析的 `EL-CHECKBOX`，实际 `.el-checkbox` 为零。
不是授权数据未加载或等待时间不足。

同一份本地成功消费者的生产产物可确定性复现：

1. 独立进程先导入 Tree 分块，内部 `ElTreeNode.components.ElCheckbox` 正常。
2. 另一独立进程先导入 Checkbox 分块，再读取相同 Tree，内部 Checkbox 为 `undefined`。

Tree、Checkbox 和 Table 的静态循环分块改变了模块初始化顺序，
组件注册表提前捕获尚未初始化的值。修复仅为脚手架增加
`output.strictExecutionOrder: true`，与 Admin 现有配置一致。
保留 vendor 分组、懒加载、`entriesAware` 和 420 KiB 分包阈值，
不全量注册 Element Plus，不提高预算或超时。

新增三种 Admin 预设的生成配置回归，并在真实授权流程中检查没有未解析标签、
复选框可见，原有授权保存、回显、错误反馈与权限断言保持不变。

## 标签字号

Core 的 `.lumal-tabs__tab` 是原生按钮，未继承字体时会采用 UA 字号。
旧产物在 390、1280、1920px 视口下均为 `13.3333px`，
而主题字号按设计宽度 1920 分别为约 2.84、9.33、14px。
390px 下文字高度 17px，按钮高度约 6.52px，发生明显溢出。

修复为原生按钮增加 `font: inherit`，不增加字体补偿或新的适配规则。
单测保护继承声明；Admin 和 tarball 消费者检查实际字号及内容边界。
旧产物截图仅用于复现，不能替代修复后验证。

## 诊断与验证

正式门禁失败上传补齐 `output/playwright/scaffold/` 和
`output/release/scaffold-report.json`，发布安全测试保护这两项路径。
没有修改发布依赖图、凭据边界、审批或部署开关。

已完成的定向验证：

- Core 全量测试：36 文件、413 项通过。
- 脚手架测试：5 文件、97 项通过；新增配置回归先失败后通过。
- 发布安全回归：57 项通过；新增诊断路径回归先失败后通过。
- 修改文件 ESLint、Core 类型检查通过。

`master@3d831dd` 的本地完整 `release:check`、站点构建和原预算已通过；
1262 项单测、37 项 Admin 生产 E2E、tarball 消费者及真实浏览器
80/100/125/150% zoom 均完成。该基线的双平台 CI `40921327442`、
CodeQL `40921327495` 通过，不能替代下一候选提交的验证。

## Windows Cockpit 渲染后端

同一基线的 Build Validation `40921328158` 两轮均失败，不能视为通过：

- attempt 1：Windows 11/12 通过，中断恢复用例超过 90 秒预算。
- attempt 2：Windows 11/12 通过，恢复用例通过，但全幅像素与退出用例超时；
  trace 中截图约 30.91 秒、切回 ECharts 约 20.86 秒，整体超过原预算。
- Ubuntu 完整生产浏览器、双平台 Vite tarball、Windows DataV 和模板消费者均通过。
  Windows 后续 Admin、文档及预算步骤被跳过，不算验证成功。

两份失败 artifact 分别为 `12919207424`、`12920899240`。
未发现能够确定的生命周期或二次缩放缺陷；没有继续对同一 SHA 盲目重跑。

对同一生产产物、1920×1080 视口和完整 Cesium 画布进行本地后端对照：
SwiftShader 截图约 4.6–6 秒，Windows D3D11 WARP 约 0.4–1.5 秒；
CPU 采样显示本机 SwiftShader 的同步 shader 编译开销较高。
这些是本机证据，不单独证明远端根因。

Windows Cockpit 测试改用 Chromium 已支持的 `--use-angle=d3d11-warp`，
Linux 继续使用 SwiftShader。全幅用例记录并断言实际 WebGL renderer，
Windows 必须为 Microsoft Basic Render Driver / D3D11，避免参数失效后静默回退。
保持全部 12 用例、原像素断言、1920×1080、90 秒预算、零重试和严格浏览器诊断；
不修改应用地图实现，不影响 DataV 视觉基准。

新增配置回归先失败后通过；定向 6 项脚本测试及 E2E 类型检查通过。
本机完整 Cockpit 12/12 通过，用时约 1 分钟，其中全幅 10.1 秒、恢复 14.9 秒。
新候选的完整本地门禁、双平台 GitHub 生产验证和正式 Release Gate 仍须独立完成。

### Resize 测量复核

PR #18 的 `75e9a98` 在 Build Validation `40986555091` 再次出现 Windows 11/12：
这次失败为 resize 后舞台几何断言，20 秒内多次 `boundingBox()` 均不符合预期；
全幅与恢复用例通过。Ubuntu 生产链、双平台 CI、完整消费者、
双平台 Vite tarball 和 Windows DataV 均通过，仍不能因此合并或发布。

失败 artifact `12947184463`，SHA256
`7cb457474e189a9f3f1c8adf5c1c68afd3c55f34805ad9e72844a4b2414651b2`。
trace 中舞台始终使用 `width:100vw;height:56.25vw`。
本机对同产物施加六倍 CPU 节流后复现：切回 1920 宽时协议 `boundingBox()`
仍返回上一帧 1440×810，而随后 DOM `getBoundingClientRect()` 已为 1920×1080；
切到 1280 宽时协议仍为 1920×1080，DOM 已为 1280×720。
完整 Chromium 无头实现也能观察到短暂的旧布局，不能靠换 channel 宣称解决。

舞台断言改为直接读取 DOM 布局矩形，与既有 Canvas 几何采样一致；
保留 `<1px` 误差、原实例、绘图尺寸、真实截图、Worker 网络及退出清理断言，
不增长 timeout、不增加 retry，也不修改应用尺寸或地图。
这避免把滞后的协议几何当成当前 CSS vw 结果，仍需新提交的完整 CI 验证。

候选源码的本地完整 `release:check` 已退出 0，包含 1263 项主链单测、
37 项 Admin 生产 E2E、tarball/模板/原生 zoom、类型、构建及 pack；
该结果不替代本次测量修正后或新 master 的远端门禁。
测量修正后的本机 Cockpit 12/12 通过（约 1 分钟；resize 5.0 秒、
全幅 9.0 秒、恢复 8.6 秒），类型、Lint 和 36 项相关脚本/Skill 测试通过。
Docs/Cockpit/DataV 构建及 `release:budgets --require-all` 通过，预算未调整。
