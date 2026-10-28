# 图标系统

Lumal 图标系统拆为两个包：

- `@lumal/icons`：框架无关的 TypeScript 图标内核，提供注册表、SVG 工具、Data URI 和 Vite 静态 SVG 插件。静态根入口没有强制运行时依赖。
- `@lumal/icons/morph`：同一包的可选通用形变入口，提供 SVG 转换数据与原生 DOM 控制器，不依赖 Vue 或其他 UI 框架。
- `@lumal/icons-vue`：Vue 3 组件与响应式适配层，提供 `LumalIcon`、图标选择器和 `useIconRegistry`；形变复用通用入口。

## Admin 示例

Admin 的“功能示例 / 图标”（`/examples/icons`）包含：

- 图标库与选择器：搜索、分组、分页、名称复制和弹窗确认/取消；包含 Element Plus 图标分组，Admin 的分组控件使用 Element Plus 下拉框。
- 渲染与样式：本地 SVG、离线 Iconify 数据、Element Plus 图标、Vue 组件，注册名称/直接定义/可信 SVG 的调用代码与复制，尺寸、颜色继承和 SVG 渐变。
- SVG 工具：单色校验、改色、渐变、合成、Data URI 预览、SVG / Data URI 复制与 SVG 下载。
- 形变动画：按需加载的四组状态切换，提供动画开关和 `smooth` / `snappy` / `bouncy` 弹簧预设。

应用图标在 `apps/lumal-admin/src/icons/index.ts` 集中维护，并在启动时注册。页面、菜单、工具栏统一通过 `LumalIcon` 渲染；菜单管理使用 `LumalIconPicker` 选择注册名称，并在表格中预览。

Iconify 分组预置 16 个离线图标：保留原有星形徽标，另从 Iconify 的 Lucide 图标集中选取 15 个常用图标，支持中文名称和注册名称搜索。资源清单在 Admin 的 `src/icons/iconify-icons.ts`，例如 `iconify:lucide:search`、`iconify:lucide:mail`；不请求远程服务，不引入完整图标集依赖，也不进入图标内核。Lucide 与其 Feather 派生图标的许可随应用发布于 `public/lucide-icons-LICENSE.txt`。

Element Plus 图标在 Admin 中从官方 `@element-plus/icons-vue` 预生成为可信 SVG，以 `element-plus:Edit` 等名称注册到 `local-svg` 来源，不增加新的来源类型，也不成为两个图标包的内置依赖。预生成资源覆盖官方全部导出，仅在打开图标选择器或实际菜单使用该分组时加载，避免完整资源集进入登录首屏，也不在运行时加载完整 Vue 组件图标集。

升级官方图标依赖后执行 `pnpm --filter lumal-admin icons:generate` 更新 `src/icons/element-plus-icons.json`，并将官方 MIT 许可复制到 `public/element-plus-icons-LICENSE.txt` 随应用发布。对应测试会将每个 SVG 与当前官方组件的服务端渲染结果比较，防止资源遗漏或过期。

## 安装

以下命令显式选择 `0.1.0-beta.0`；两个图标包保持同版，不依赖 npm 的 `latest` 标签。
实际可用性以 registry 为准，候选发布核验前使用本地 tarball。

只使用纯 TypeScript 能力：

```bash
pnpm add @lumal/icons@0.1.0-beta.0
```

Vue 项目同时安装适配层：

```bash
pnpm add @lumal/icons@0.1.0-beta.0 @lumal/icons-vue@0.1.0-beta.0 vue@^3.5 @iconify/vue@^5
```

不使用 Vue，只使用通用形变时，显式安装可选 peer：

```bash
pnpm add @lumal/icons@0.1.0-beta.0 morphicons@2.0.0
```

形变从 `/morph` 可选入口加载；使用其他版本时先核对其 `exports` 与类型声明，不把工作区新增 API 当作旧包能力。

## 注册图标

```ts
import {
  createIconifyIconDefinitions,
  registerIcons,
} from '@lumal/icons'

registerIcons([
  {
    key: 'app:dashboard',
    label: '控制台',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="..."/></svg>',
  },
])

registerIcons(createIconifyIconDefinitions('mdi', [
  'home',
  'account',
]))
```

源 SVG 应保持单色并使用 `currentColor`。注册表使用普通 `Map` 保存数据，框架适配器可以通过 `subscribeIconRegistry()` 订阅变更。

`IconDefinition<TComponent = unknown>` 把组件实现视为不透明载荷，因此纯 TypeScript 包不依赖 Vue、React 或其他 UI 框架。Vue 组件图标可以这样注册：

```ts
import { createComponentIconDefinitions, registerIcons } from '@lumal/icons'
import { Edit } from '@element-plus/icons-vue'

registerIcons(createComponentIconDefinitions('element-plus', {
  Edit,
}))
```

## Vue 渲染

```vue
<script setup lang="ts">
import { LumalIcon } from '@lumal/icons-vue'
import '@lumal/icons-vue/style.css'
</script>

<template>
  <LumalIcon name="app:dashboard" color="#1677ff" :size="24" />
</template>
```

`LumalIcon` 只负责 Vue 渲染。SVG 改色和渐变仍调用 `@lumal/icons` 的纯 TypeScript 实现，不在 Vue 包内复制算法。

### 输入方式

| 方式 | 传入参数 | 适用场景 |
| --- | --- | --- |
| 注册名称 | `name="app:dashboard"` | 复用已注册资源，模型只保存名称 |
| 直接定义 | `:icon="iconDefinition"` | 传入包含 `source` 和资源数据的 `IconDefinition` 对象 |
| 可信 SVG | `:icon="svgText"` | 直接传入可信的 SVG 字符串，不需要先注册 |

同一个 SVG 配合同样的样式参数，三种输入方式应得到相同外观，差异在资源传入方式。Admin 在各预览下显示属性类型和完整 Vue 调用代码，并随选择、尺寸、颜色、继承及渐变参数更新；代码可复制。Iconify 与组件图标没有可用的原始 SVG 字符串时，不展示 SVG 字符串示例。

## 状态形变

形变是图标包的通用能力，不限定 Vue。通用入口负责资源解析、保真检查、区域归一化和原生 DOM 生命周期；Vue 层仅负责响应式属性及官方 Vue 绑定。

### 原生 DOM

以下为应用接线片段，`iconHost` 是按钮内部专用的空图标容器；控制器接管其子节点，不接管按钮事件或业务状态：

```ts
import { createIconMorph } from '@lumal/icons/morph'

export function mountSidebarIcon(iconHost: HTMLElement) {
  const icon = createIconMorph(iconHost, 'lumal:sidebar-collapse', {
    size: 20,
    spring: 'smooth',
    title: '侧栏状态',
  })

  return {
    ready: icon.ready,
    setCollapsed: (collapsed: boolean) => icon.update(
      collapsed ? 'lumal:sidebar-expand' : 'lumal:sidebar-collapse',
    ),
    destroy: () => icon.destroy(),
  }
}
```

`createIconMorph(target, source, options?)` 同步显示静态 SVG，`ready` 表示初始动画引擎是否就绪。`update(source, options?)` 合并选项并返回 `Promise<boolean>`，`true` 表示使用形变渲染，`false` 表示静态回退或任务已过期。选项为 `enabled`（默认 `true`）、`spring`（默认 `'smooth'`）、`size`（默认 `'1em'`）、`color` 和 `title`；设置 `enabled: false` 会取消动画并恢复静态目标。

应用卸载时调用 `destroy()`，取消动画、偏好监听和未完成的异步任务，留下当前目标的静态 SVG。不要在同一个容器中混放文字、按钮或其他框架维护的子节点。原生控制器只渲染本地 SVG；Iconify、组件和未知名称没有可用的静态 SVG，应用需要自行保留对应渲染分支。

### 其他框架

```ts
import { prepareIconMorph } from '@lumal/icons/morph'

const prepared = await prepareIconMorph('lumal:sun')
if (prepared) {
  // prepared.icon 可交给 morphicons/react、morphicons/svelte 等官方绑定。
  // 同时传递 color、strokeWidth、linecap、linejoin，保留原图标外观。
  console.log(prepared.icon, prepared.strokeWidth)
}
```

`prepareIconMorph(source)` 接收注册名称、直接 `IconDefinition` 或可信 SVG 字符串，返回原生 `IconInput`、规范路径 `d`、几何标识 `shape` 和外观元数据；SSR、转换失败或引擎加载失败返回 `undefined`。它不创建框架实例，也不管理消费方组件的生命周期。其他绑定应在客户端准备数据，首次保留原始静态 SVG，并遵守系统减少动画设置；仅外观变化时复用目标引用，不重新触发形变。当前不新增 React/Svelte 等 Lumal 适配包。

### Vue

```vue
<script setup lang="ts">
import type { LumalIconMorphSpring } from '@lumal/icons-vue'
import { LumalIcon } from '@lumal/icons-vue'
import { computed, shallowRef } from 'vue'
import '@lumal/icons-vue/style.css'

/***********************侧栏状态*********************/
const collapsed = shallowRef(false)
const spring = shallowRef<LumalIconMorphSpring>('smooth')
const iconName = computed(() => collapsed.value ? 'lumal:sidebar-expand' : 'lumal:sidebar-collapse')
</script>

<template>
  <button type="button" :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'" @click="collapsed = !collapsed">
    <LumalIcon :name="iconName" morph :morph-spring="spring" :size="20" />
  </button>
</template>
```

| 属性 | 类型 | 默认值 |
| --- | --- | --- |
| `morph` | `boolean` | `false` |
| `morphSpring` | `LumalIconMorphSpring`，即 `'smooth' \| 'snappy' \| 'bouncy'` | `'smooth'` |

形变复用同一个 `LumalIcon` 实例，不要添加 `:key="iconName"`。首次显示直接呈现当前图标，之后名称或 SVG 形状变化才播放；仅修改颜色或尺寸不会重播。连续切换会从当前中间形状转向最新目标。

### 支持与回退

- 支持可信、带有效 `viewBox` 的单色本地 SVG：注册名称、直接 `IconDefinition` 和 `icon` SVG 字符串均可使用。建议使用 `currentColor` 继承文字颜色。
- 基础几何通过 Morphicons 官方 SVG 适配器转换；填充图形先完成区域归一化，再交给 DOM 控制器或官方框架绑定渲染。
- Iconify、Vue 组件、渐变、多色、样式类、透明度、虚线、变换、裁剪/遮罩/滤镜等不能保真转换的图形保持原有静态渲染。混合填充与描边仅支持统一圆头圆角描边；不支持时无需修改调用方。
- 尊重 `prefers-reduced-motion`，包括运行中切换系统偏好。减少动画、关闭 `morph`、卸载或转换失败会清理动画实例，显示静态目标图标。
- SSR 和异步引擎加载期间输出原有 SVG，不显示空白占位。尺寸、颜色、`title` 均保留；图标本身仍为装饰内容，按钮必须提供可访问名称。

`@lumal/icons` 仅声明 `morphicons@2.0.0` 为可选 peer，并用独立 `./morph` 子入口隔离。`@lumal/icons-vue` 将该版本作为依赖，复用通用转换后动态加载官方 Vue 绑定。适配器、DOM 引擎与区域归一化模块都保留动态加载边界，ESM/CJS 均可消费；只使用静态注册表、SVG/Data URI 或静态 Vue 图标时不加载动画引擎。`IconDefinition.source` 仍只有 `local-svg`、`iconify`、`component`，SVG 工具、选择器和 Data URI 协议不变。

### 系统入口

| 场景 | 图标对 | 状态来源 |
| --- | --- | --- |
| 登录页、顶栏主题切换 | `lumal:moon` / `lumal:sun` | 实际解析后的主题 |
| 桌面侧栏、移动菜单 | `lumal:sidebar-expand` / `lumal:sidebar-collapse` | 现有 `collapsed` / 移动菜单状态 |
| 标签栏内容最大化 | `lumal:maximize` / `lumal:restore` | 内容最大化状态 |
| CRUD 表格全屏 | `lumal:fullscreen` / `lumal:fullscreen-exit` | 真实 `fullscreenchange`，包括 Escape 退出 |

Admin 保留整页主题过渡，应用内部通过 `waitForAdminThemeTransition(): Promise<void>` 等待页面快照释放后再更新主题图标，并取消过期等待任务。这是 Admin 应用的协调函数，不是 `@lumal/*` 的公开 API。图标等待不会延迟主题业务状态提交。没有增加悬停、循环或全局动画偏好设置。

## Vue 响应式注册表

```ts
import { useIconRegistry } from '@lumal/icons-vue'

const { icons, groups, resolve } = useIconRegistry()
```

该 composable 把 `@lumal/icons` 的订阅接口转换为 Vue `computed`，运行时注册新图标或分组后会自动更新。

## 图标分组

```ts
import { registerIconGroups } from '@lumal/icons'

registerIconGroups([
  { key: 'app', label: '应用图标', order: 1 },
])
```

## SVG 改色与渐变

```ts
import {
  applySvgGradient,
  getGradientIconDataUri,
  recolorSvgString,
} from '@lumal/icons'

const blueSvg = recolorSvgString(svgText, '#1677ff')
const gradientSvg = applySvgGradient(svgText, {
  from: '#1677ff',
  to: '#0f766e',
})
const uri = getGradientIconDataUri('app:dashboard', {
  from: '#1677ff',
  to: '#0f766e',
})
```

## Data URI、校验与合成

```ts
import {
  composeSvgIcons,
  getIconDataUri,
  validateMonochromeSvg,
} from '@lumal/icons'

const uri = getIconDataUri('app:dashboard', '#1677ff')
const validation = validateMonochromeSvg(svgText)
const composed = composeSvgIcons([backgroundSvg, foregroundSvg])
```

运行时最多缓存 256 个 Data URI。校验会拒绝脚本、事件属性、外部 HTTP 资源和固定 `fill/stroke` 颜色。

`svgToDataUri`、`getIconDataUri` 和 `getGradientIconDataUri` 会为缺少默认 SVG 命名空间的根元素补充 `xmlns="http://www.w3.org/2000/svg"`，使内联资源也能作为独立图片预览和下载；已有声明会保留。

SVG 仅用于项目内可信静态资源。注册和 `LumalIcon` 渲染不会自动净化输入；`validateMonochromeSvg` 是有限的单色格式检查，不是完整 sanitizer，不能据此信任用户上传、远程接口或其他不可信 SVG。不可信来源应先在应用信任边界使用专门的净化方案，或转换为不执行脚本的图片资源。

## 图标选择器

```vue
<script setup lang="ts">
import { LumalIconPicker, LumalIconPickerDialog } from '@lumal/icons-vue'
import { shallowRef } from 'vue'

const value = shallowRef('app:dashboard')
const dialogVisible = shallowRef(false)
</script>

<template>
  <LumalIconPicker v-model="value" group="app" show-labels />
  <LumalIconPickerDialog v-model="value" v-model:visible="dialogVisible" />
</template>
```

选择器支持搜索、分组、分页、选中态和键盘焦点；弹窗确认后才更新外部模型。

显示名称（`show-labels`）时使用加宽网格，名称自动换行，不截断为省略号。搜索框与原生分组下拉框使用相同控件高度，默认 32px，可通过 `--el-component-size` 调整；这只是样式变量回退，不会引入 Element Plus 依赖。

独立选择器的 `pageSize` 默认 48。弹窗保持每页 48 个，桌面 8 列，480px 及以下为 6 列，360px 及以下为 4 列，让完整页的每一行数量一致；最后一页只展示实际剩余图标。Admin 图标库默认每页 72 个，并提供 12、24、48、72、96 的数量选项。

弹窗外框高度固定为 `min(680px, 88dvh)`，640px 及以下为 `min(680px, 92dvh)`，不随搜索、分组或分页结果数量改变。标题和操作区固定，中间内容区独立滚动，并预留滚动条空间，避免滚动条出现时挤动网格与分组控件。

### 按 UI 框架替换分组控件

`@lumal/icons` 不依赖 Vue 或 Element Plus。`@lumal/icons-vue` 仅依赖 Vue 适配能力，不引入 Element Plus；独立选择器默认仍使用原生分组下拉框。需要 Element Plus 的 Vue 应用可以通过 `group-select` 插槽接入：

```vue
<LumalIconPicker v-model="value">
  <template #group-select="{ modelValue, groups, setGroup }">
    <ElSelect
      :model-value="modelValue"
      :teleported="false"
      aria-label="图标分组"
      @update:model-value="setGroup"
    >
      <ElOption value="" label="全部分组" />
      <ElOption v-for="group in groups" :key="group.key" :value="group.key" :label="group.label" />
    </ElSelect>
  </template>
</LumalIconPicker>
```

此处为模板片段，`ElSelect`、`ElOption` 和 Element Plus 样式由消费应用自行引入；无需 Element Plus 的消费者不需要使用该插槽。`LumalIconPickerDialog` 同样支持并转发 `group-select`。

插槽类型 `LumalIconPickerGroupSelectSlotProps` 从 `@lumal/icons-vue` 导出，包含当前分组 `modelValue`、分组列表 `groups` 和更新回调 `setGroup(group)`。选择分组会沿用原有筛选及分页重置逻辑。弹窗中的自定义下拉层应保留在弹窗内部，例如设置 `teleported="false"`，以保留焦点约束和 Escape 行为。

分组插槽放在普通容器中，不用原生 `label` 包裹复合控件，避免内联选项层点击后再次激活下拉框。自定义控件仍需提供 `aria-label` 等可访问名称。

Admin 的 `AppIconGroupSelect` 复用这一接线，覆盖图标示例、弹窗、菜单管理和其他图标选择示例。

## Vite 静态 SVG 插件

`@lumal/icons/vite` 暴露 `createStaticLocalSvgIconsPlugin`，用于构建期收集静态 SVG。该入口同样不依赖 Vue。
