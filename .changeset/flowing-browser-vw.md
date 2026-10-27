---
"@lumal/vite": minor
"@lumal/viewport": patch
"create-lumal-admin": patch
---

修正 vw 为浏览器宽度 / 设计宽度的流式适配，宽高共用宽度比例，不再误用容器宽高。
Vite 新增可选 output: runtime，将受控 CSS 与模板行内样式输出为局部单位表达式，
LumalViewport 在 vw 外恢复设计 px，避免与 contain/width 重复缩放，默认直接 vw 输出不变。
Screen 的 --viewport vw 自动接入共享设计尺寸与构建转换；其他模式保持轻量。
保留字体/行高、最小尺寸、原子化 CSS、来源边界和动态脚本保护。
