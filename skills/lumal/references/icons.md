# @lumal/icons

## 什么时候用

需要框架无关的图标注册/分组、SVG 改色/渐变/合成、Data URI，或 Vite 静态 SVG 注册时使用。渲染 Vue 组件时搭配 [icons-vue](icons-vue.md)；不要为纯 TypeScript 工具引入 Vue。

## 运行时入口

`@lumal/icons` 没有 Vue/UI 运行时依赖。`IconDefinition.source` 为 `local-svg`、`iconify` 或 `component`，`key` 用稳定且带应用前缀的名字。

```ts
import { getIconDataUri, recolorSvgString, registerIcons } from '@lumal/icons'

const svgText = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>'

registerIcons([
  { key: 'app:project', source: 'local-svg', svgText },
])

const blueSvg = recolorSvgString(svgText, '#1677ff')
const markerImage = getIconDataUri('app:project')
```

- `registerIcons/registerIconGroups` 注册图标及分组；同一应用集中维护资源，不逐个业务组件重复注册。
- `resolveIconDefinition/resolveAnyIconDefinition` 查定义。
- `recolorSvgString/applySvgGradient/composeSvgIcons` 处理 SVG。
- `getIconDataUri/getGradientIconDataUri/svgToDataUri` 给地图、Canvas 或 CSS 消费；资源变化后需要时用 `clearIconDataUriCache`。
- `registerStaticLocalSvgIcons/getStaticLocalSvgIconDefinitions` 适合静态清单。

## Vite 静态清单

构建期插件必须从 `@lumal/icons/vite` 导入，不是 `@lumal/vite`：

```ts
import { createStaticLocalSvgIconsPlugin } from '@lumal/icons/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    createStaticLocalSvgIconsPlugin({
      localSvg: {
        import: '/src/icons/local-icons.ts',
        exportName: 'localIcons',
      },
    }),
  ],
})
```

`local-icons.ts` 导出可信的 IconDefinition 数组；省略 `exportName` 时读取默认导出。插件接收清单，不自动扫描 SVG 目录。已有 `createLumalAdmin({ icons: { localSvg } })` 注册时不需要再重复注入同一批资源。

## 安全边界

- 注册和渲染不做完整 SVG 净化，只接收项目内可信静态资源。
- `validateMonochromeSvg` 是有限格式检查，不是 sanitizer。不能据此接受用户上传或远程不可信 SVG。
- 不把后端返回的任意 SVG 文本直接注册后交给 Vue HTML 渲染。
- 普通 URL/PNG 不是 SVG 字符串，不能交给 SVG 改色工具。

仓库核对位置：`packages/icons/src/index.ts`、`types.ts`、`runtime`、`vite/static-local-svg-icons.ts`。
