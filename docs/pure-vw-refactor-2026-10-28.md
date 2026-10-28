# 纯 vw 重构记录（2026-10-28）

## 基线

- 开始 HEAD：`35efcc8e207d9f6333efbdd2428102677b7fef00`，工作区干净。
- 开发分支：`codex/pure-vw-unification`。
- 已 fetch；远端 master：`83464a6b6820cdcd3a78c0c1ede7830dab44c7f9`。
- 当前分支与 master 分叉；保留本地成果，单独纳入远端地图引擎释放、减少动画和测试修复，不合并分支。
- Node 24.14.1、pnpm 10.33.0；`pnpm install --frozen-lockfile` 通过。
- 改动前：`pnpm --filter @lumal/vite test` 78 项通过；Viewport 18 项通过。

## 契约

业务普通 px 经受控 AST 转为 `P / D * 100 vw`；动态设计数值为 `P * W / D`。
所有方向统一按宽度，没有高度比例、整画布缩放、居中偏移或尺寸下限补偿。
细边框与显式忽略项例外；原子化规则、业务脚本、地图坐标、实际测量值不自动转换。

## 阶段

1. 保留安全 AST 转换，移除 runtime 单位输出和断点复制。Vite 编译常量将同一个开关和 D 提供给运行时，未接入时默认 px。
2. 精简 Viewport，迁移 Core 动态 token、DataV 和 Cockpit。容器测量不成为缩放除数。
3. 迁移 Admin、全部示例、脚手架、公开文档与独立消费者。
4. 执行全量质量门禁、tarball、生产浏览器、原生 zoom 与发布边界检查，再准备未发布的预发布版本。

本文件持续记录实际结果，未执行的验收不得视为通过。历史发布证据保持原样；本轮不发布、不 push、不部署。

## 阶段一验证

- `pnpm --filter @lumal/vite test`：4 文件、79 项通过，含消费端 D=1440、公共包 token、编译配置注入与既有来源安全测试。
- `pnpm --filter @lumal/viewport test`：11 项通过，覆盖公式、共享监听、KeepAlive 和测量清理。
- `pnpm --filter @lumal/vite build`：ESM/CJS 与声明构建通过；Node fs 保持 external，不被误打包为浏览器空模块。
- 这是底层契约阶段，不代表尚在迁移的 Core、应用、脚手架或完整消费者已经通过验收。
