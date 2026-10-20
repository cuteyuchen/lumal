# @lumal/icons

## 什么时候用

需要框架无关的图标注册/分组、SVG 改色/渐变/合成、Data URI、状态形变或 Vite 静态 SVG 注册时使用。渲染 Vue 组件时搭配 [icons-vue](icons-vue.md)；不要为纯 TypeScript 工具引入 Vue。

## 运行时入口

`@lumal/icons` 没有 Vue/UI 运行时依赖。`IconDefinition.source` 为 `local-svg`、`iconify` 或 `component`，`key` 用稳定且带应用前缀的名字。

静态入口没有强制运行时依赖；状态形变由 `@lumal/icons/morph` 通用子入口提供，不限定 Vue，也不新增来源类型。内置侧栏图标为 `lumal:sidebar-expand` / `lumal:sidebar-collapse`；最大化与全屏仍使用 `lumal:maximize` / `lumal:restore`、`lumal:fullscreen` / `lumal:fullscreen-exit`。

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

## 通用形变

以下为仓库源码能力，发布包先核对 `exports`。原生或其他框架显式安装 `morphicons@2.0.0` 可选 peer；静态根入口不需要引擎或 Vue。

```ts
import { createIconMorph, prepareIconMorph } from '@lumal/icons/morph'

export function mountIcon(target: HTMLElement) {
  const icon = createIconMorph(target, 'lumal:sidebar-collapse', { size: 20, spring: 'smooth' })
  return {
    ready: icon.ready,
    collapse: () => icon.update('lumal:sidebar-expand'),
    destroy: () => icon.destroy(),
  }
}

const prepared = await prepareIconMorph('lumal:sun')
console.log(prepared?.icon)
```

- `createIconMorph` 只接管专用图标容器的子节点。`ready/update` 返回是否使用形变渲染，`false` 表示回退或任务过期；卸载调用 `destroy`。
- `update(source, options?)` 合并 `enabled/spring/size/color/title`。默认开启、`smooth`、`1em`；首次静态，后续几何变化形变，连续切换从中间形状继续，关闭/减少动画/失败恢复静态目标。
- 原生控制器只渲染本地 SVG，不能拿它渲染组件、Iconify 或未知名称。其他框架先调用 `prepareIconMorph`，将原生 `icon` 及外观元数据交给官方绑定；生命周期、SSR 静态回退和减少动画由消费方负责，不新增 Lumal 框架包。
- 支持注册名、直接定义及可信单色 SVG。不能保真转换（渐变、透明度、样式类、变换、裁剪等）、SSR 或引擎失败时准备结果为 `undefined`；转换不是安全净化。
- ESM/CJS 均保留动态引擎边界；不要在业务入口静态引入 Morphicons，静态图标/SVG/Data URI 消费者不应加载引擎。

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
