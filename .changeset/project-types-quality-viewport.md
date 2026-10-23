---
"create-lumal-admin": minor
"@lumal/viewport": minor
"@lumal/core": patch
"@lumal/datav": patch
"@lumal/cockpit": patch
"@lumal/vite": minor
---

通用脚手架增加 Blank 与 Screen，认证、数据、路由、可视化和适配按需组合，
保留原 Admin 命令；所有模板统一质量工具、LF和AI规范。

新增轻量 Vue 视口包，复用 DataV/Cockpit 算法与生命周期，支持应用默认/页面/容器策略，
不改变后台字体偏好。Vite 增加显式范围且默认关闭的CSS视口转换。
Core 修复旧会话迟到认证失败、连续会话通知、二进制请求体以及无业务field跨页序号。
增加真实tarball、混合路由、脱敏地图/图表及真实浏览器缩放门禁。

此记录尚未消费，不指定下一Beta编号；沿用当前十包fixed-group与手工Beta准备流程。
本轮不发布、打正式Tag或部署，维护者须核对registry后选择未发布版本。
