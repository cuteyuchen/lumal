# @lumal/icons

框架无关的 Lumal 图标内核，提供图标注册表、分组、SVG 改色、渐变、校验、合成、Data URI 缓存和 Vite 静态 SVG 插件。

SVG 输入必须是可信静态资源。注册不自动净化输入，`validateMonochromeSvg` 仅做有限格式检查，不是完整 sanitizer；不要直接注册用户上传或远程不可信 SVG。

```ts
import { recolorSvgString, registerIcons } from '@lumal/icons'

registerIcons([
  {
    key: 'app:dashboard',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="..."/></svg>',
  },
])

const blueSvg = recolorSvgString(svgText, '#1677ff')
```

该包没有 Vue 或其他 UI 框架运行时依赖。Vue 组件由 `@lumal/icons-vue` 提供，详细说明见仓库文档 `docs/icons.md`。
