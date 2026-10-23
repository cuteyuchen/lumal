---
"create-lumal-admin": minor
"@lumal/core": patch
---

脚手架改为 Clack 键盘向导，保持参数、CI 和非交互兼容，支持摘要确认、取消和安全回滚。
生成项目按应用、独立业务模块与共享能力分层；系统管理使用独立页面、强类型业务 API、
真实权限树、父子菜单，以及 Local/HTTP 一致的业务约束和失败恢复。
标准预设增加工作台与个人中心，Vben 迁移模块独立注册，补齐终端、消费者和生产浏览器验证。
Core 主题移除 Element Plus 已删除的空样式入口，不改变公共运行时 API。

此记录尚未消费，不指定下一 Beta 编号。沿用九包 fixed-group 和手工 Beta 准备流程；
维护者需先核对 registry，再选择未发布版本，不能覆盖 0.0.5-beta 或直接执行标准 minor bump。
