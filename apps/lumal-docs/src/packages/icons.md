# @lumal/icons

框架无关的图标内核：注册表、分组、SVG 改色 / 渐变 / 合成、校验、Data URI 缓存、Vite 静态 SVG 插件。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/icons` |
| 本地路径 | `packages/icons` |
| 在线文档 | https://lumal.cuteyuchen.top/packages/icons |
| npm 地址 | `https://www.npmjs.com/package/@lumal/icons` |
| 详细说明 | [图标系统](/reference/icons) |

## 安装

下列命令对应工作区版本；registry 可用性与源码接入见 [安装说明](/guide/essentials/installation)。

```bash
pnpm add @lumal/icons@0.1.1-beta
```

Vue 项目请同时安装 [@lumal/icons-vue](./icons-vue)。

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `@lumal/icons` | 注册、改色、合成、Data URI 等 |
| `@lumal/icons/vite` | Vite 静态 SVG 插件 |

## 注册图标

```ts
import {
  createIconifyIconDefinitions,
  registerIcons,
  recolorSvgString,
} from '@lumal/icons'

registerIcons([
  {
    key: 'app:dashboard',
    label: '控制台',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="..."/></svg>',
  },
])

registerIcons(createIconifyIconDefinitions('mdi', ['home', 'account']))

const blueSvg = recolorSvgString(svgText, '#1677ff')
```

源 SVG 建议单色并使用 `currentColor`。注册表为普通 `Map`；框架适配层可通过 `subscribeIconRegistry()` 订阅变更。

## Vite 插件

```ts
import { createStaticLocalSvgIconsPlugin } from '@lumal/icons/vite'

export default {
  plugins: [
    createStaticLocalSvgIconsPlugin({
      localSvg: '/src/icons/manifest.ts', // 默认导出 IconDefinition[] 的可信静态模块
    }),
  ],
}
```

具体选项见包内类型与 [图标系统](/reference/icons)。

SVG 仅接受可信静态资源，注册不会自动净化输入。`validateMonochromeSvg` 是有限格式检查，不是完整 sanitizer，不能据此信任用户上传或远程 SVG。

## 边界

- **无** Vue / React 运行时依赖
- 组件实现作为 `IconDefinition` 的不透明载荷，由适配层解释
