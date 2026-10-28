---
"@lumal/vite": minor
"@lumal/core": minor
"@lumal/icons-vue": patch
---

补齐显式整页 vw 的浏览器页面缩放接线，不改变局部转换的安全默认值。
Vite 新增默认关闭的 variableFallbacks 和 mediaQueries，支持普通变量 fallback、
尺寸约束函数及受根模式控制的传统/范围媒体与容器宽高断点；保留来源、原子化和重复转换保护。
Core 主题新增可选 cssLength，Layout/Tabs 新增默认开启的 responsive；
图标数字 size 使用可回退1px的协作单位，字符串尺寸保持原样。
Admin 统一 Header、侧栏、主题、body浮层与显式表格列宽，自管理画布整页回退，
不扫描业务脚本、不修改 Viewport 公共 API。
