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

静态根入口没有强制运行时依赖，也不引用 Vue。Vue 组件由 `@lumal/icons-vue` 提供；状态形变属于本包的通用可选入口，不影响 SVG/Data URI 输出或图标来源类型。

## 通用状态形变

当前仓库提供 `@lumal/icons/morph`；已发布版本请核对安装包的 `exports` 和声明文件。原生 DOM 或其他框架使用时显式安装可选 peer：

下列命令对应 `0.1.1-beta`，精确版本安装以 registry 存在对应版本为前提。
发布核验前使用候选 tarball，也可使用构建后的源码 file 依赖；不从本文推断浮动标签。

```bash
pnpm add @lumal/icons@0.1.1-beta morphicons@2.0.0
```

```ts
import { createIconMorph, prepareIconMorph } from '@lumal/icons/morph'

// 应用侧在客户端传入专用图标容器，不接管按钮本身。
export function mountIcon(target: HTMLElement) {
  const icon = createIconMorph(target, 'lumal:sidebar-collapse', { size: 20, spring: 'smooth' })
  return {
    ready: icon.ready,
    collapse: () => icon.update('lumal:sidebar-expand'),
    destroy: () => icon.destroy(),
  }
}

// 返回 Morphicons 原生 IconInput，可交给官方 React/Svelte 等绑定。
const prepared = await prepareIconMorph('lumal:sun')
console.log(prepared?.icon)
```

- `createIconMorph` 同步显示静态 SVG，首次就绪不播放；`update(source, options?)` 切换目标，连续操作从中间形状继续。
- `ready` 和 `update` 返回 `Promise<boolean>`，`false` 表示静态回退或任务失效。选项包含 `enabled`、`spring`、`size`、`color`、`title`，默认开启、`smooth`、`1em`。
- 容器只放图标，卸载时调用 `destroy()`。关闭、减少动画、转换失败会清理实例并恢复静态目标；销毁也取消异步任务和监听。
- `prepareIconMorph` 支持注册名、直接定义和可信单色 SVG；SSR、加载失败或不能保真转换时返回 `undefined`，由框架保留原来的静态渲染。返回值还包含 `d`、`shape`、颜色及描边元数据。
- 原生控制器只渲染本地 SVG；组件、Iconify 和未知名称由消费方处理，渐变和其他复杂 SVG 保持静态。转换数据不依赖框架，其他框架绑定的生命周期、静态回退和减少动画策略由消费方负责。
- Morphicons 仅为可选 peer，通过动态 `import()` 加载；静态根入口无需安装或加载引擎。ESM/CJS 均保留动态边界。

完整 API 边界及 Vue 调用方式见仓库 `docs/icons.md`。

内置图标包含 `lumal:menu`、`lumal:search`、`lumal:arrow-up`、`lumal:arrow-down`、`lumal:arrow-right`、`lumal:copy` 和 `lumal:download` 等通用操作。Admin 的“功能示例 / 图标”提供图标库、三种来源、渲染参数、选择器和 SVG 工具示例。

系统状态图标包含太阳/月亮、`lumal:sidebar-expand` / `lumal:sidebar-collapse`、`lumal:maximize` / `lumal:restore` 和 `lumal:fullscreen` / `lumal:fullscreen-exit`。侧栏图标统一为 24×24 单色描边，最大化图标仅保留描边轮廓。
