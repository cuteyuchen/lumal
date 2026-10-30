# @lumal/core：启动与组件

## 什么时候用

已有 Vue 应用需要后台基础设施、页面布局、Schema 表单/表格或 CRUD 时使用。只需请求、权限或主题时直接使用相应服务子入口，不安装整套 UI；新建完整基座先读 [脚手架](create-lumal-admin.md)。

## 入口与依赖

- `@lumal/core/minimal`：无默认组件表的启动器，`components` 只接受显式映射或 `false`；默认不安装字典。
- `@lumal/core`：带默认 UI 组件表的便利入口，支持 preset 和按名称选择注册。
- `@lumal/core/components`：页面、Schema、CRUD、分页等组件及其类型。
- `@lumal/core/layout`：后台壳与路由出口，详见 [路由与布局](core-routing.md)。
- UI 使用 Element Plus；Router、Pinia 仅在对应场景显式传入。启动器不会替应用创建这些实例。

使用 UI 时在应用入口统一引入样式，避免逐页重复导入：

```ts
import '@lumal/core/theme-chalk/index.scss'
import '@lumal/core/style.css'
import '@lumal/icons-vue/style.css'
```

SCSS 入口需要 Sass 工具链。样式覆盖顺序沿用应用约定，不重复全量导入两套 Element Plus 主题。

## 最小启动

下面是使用 UI 的 `main.ts`；纯服务应用可以省略 Element Plus 和上述 UI 样式：

```ts
import { createLumalAdmin } from '@lumal/core/minimal'
import ElementPlus from 'element-plus'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import '@lumal/core/theme-chalk/index.scss'
import '@lumal/core/style.css'
import '@lumal/icons-vue/style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [],
})

await createLumalAdmin({
  rootComponent: App,
  router,
  elementPlus: ElementPlus,
}).mount('#app')
```

组件在使用它的 SFC 中局部导入即可；需要 Pinia 时另行安装并传入已有实例，不是最小启动的必需项。`mount()` 会等待应用 `setup` 和 `router.isReady()`，不能当作同步方法。

## 组件选择

| 需求 | 组件 |
| --- | --- |
| 单独的新增、编辑、查看表单 | `LumalSchemaForm`，`v-model` + `schemas` |
| 已由应用管理数据的列表 | `LumalSchemaTable`，`rows` + `columns` |
| 查询、表格、分页及 CRUD 编辑闭环 | `LumalCrudTable` |
| 普通页面容器 | `LumalPage` |
| 查询、工具栏、内容、分页分区 | `LumalPageLayout` |
| 独立分页 | `LumalPagination` |

Schema Form/Table 使用 `field`，不要混用 Vben 的 `fieldName`。字典优先使用 `dictionary`；`view` 模式用于文本回显，不用一组禁用输入框代替详情。

表单联动区分 `hidden` 与 `visible`：前者不渲染字段，后者用 CSS 显隐并保留实例、值和校验。
`visible/hidden/disabled/required/componentProps` 等动态配置读取当前模型上下文。
`submitDisabled` 只禁用提交，`submitLoading` 同时阻止重复提交；都不应通过禁用整张表单来模拟。
原生 `novalidate` 已将提交校验交给 Element Plus，不要额外叠加浏览器原生校验弹窗。

## CRUD 最小示例

这是只展示列表的可独立组件。接真实接口时替换数据源，并保持 `{ items, total }` 协议：

```vue
<script setup lang="ts">
import type { CrudDataSource, CrudTableColumn } from '@lumal/core/components'
import { LumalCrudTable } from '@lumal/core/components'
import { useTemplateRef } from 'vue'

/***********************表格配置*********************/
const columns: CrudTableColumn[] = [
  { field: 'name', label: '名称' },
]
const dataSource: CrudDataSource = {
  fetch: async () => ({
    items: [{ id: 1, name: '示例项目' }],
    total: 1,
  }),
}

/***********************表格控制*********************/
const tableRef = useTemplateRef<InstanceType<typeof LumalCrudTable>>('tableRef')

async function reload() {
  await tableRef.value?.reload()
}

defineExpose({ reload })
</script>

<template>
  <LumalCrudTable
    ref="tableRef"
    title="项目"
    :data-source="dataSource"
    :table="{ columns, rowKey: 'id' }"
    :toolbar="{ create: false, batchDelete: false }"
    :actions="{ view: false, edit: false, remove: false }"
  />
</template>
```

## 重要契约

- CRUD 可以用受控 `rows/total`，也可以用 `dataSource`；确定数据所有权，不同时维护两套请求和分页状态。
- `dataSource.fetch({ page, pageSize, query })` 返回 `Promise<unknown>`；非标准响应必须配置 `parseResponse`，不要猜测 `records/list/data`。
- 新页面用 `query`、`table`、`toolbar`、`actions`、`editor`、`pagination` 配置对象。编辑器应使用 `editor.type: 'dialog' | 'drawer'`，不要照搬其他库 API。
- `create/update/remove/removeMany` 是可选能力；未接入接口时不要展示能写入的假操作。
- 未传 `formSchemas` 时从 columns 派生表单；显式传入会整体替换派生结果。`showInForm`、`showInTable` 分别控制两边。
- `table-${field}`、`query-${field}`、`form-${field}` 和 `row-actions` 等插槽用于局部定制，不必复制整个 CRUD。
- CRUD 不自带页面壳，需要页标题或描述时在外面组合 `LumalPage`。
- `0.1.1-beta` 支持 `{ type: 'index', label: '序号' }` 无业务field列，按分页计算跨页序号，
  不派生编辑字段、不请求字典；普通列field仍强类型。`SchemaTableColumn`是判别联合，
  自定义扩展应使用交叉type，而非interface extends联合类型。
- DataSource的create/update/remove resolve即完成，返回false不是失败；业务失败必须reject，
  保留编辑器和错误重试。不要机械迁移旧CRUD的boolean saveHandler。

仓库核对位置：`packages/core/src/exports/components.ts`、`packages/core/src/app/types.ts`、`packages/core/src/components/*/types.ts`、`docs/core-api.md`。
