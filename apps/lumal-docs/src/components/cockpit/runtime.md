# LumalCockpit

```ts
import { LumalCockpit } from '@lumal/cockpit/runtime'
import '@lumal/cockpit/style.css'
```

```vue
<LumalCockpit
  v-model:active-layout-id="activeLayoutId"
  :config="config"
  :registry="registry"
  viewport-mode="scale"
>
  <template #header-title="{ title }">
    <AppHeader :title="title" />
  </template>
  <template #center="{ context, layout }">
    <ApplicationCenter :context="context" :layout="layout" />
  </template>
</LumalCockpit>
```

- 中心内容由应用插槽提供，不进配置
- `viewportMode`: `scale` | `vwvh` | `external`
- `external` 不做画布变换，供 `LumalViewport` 或 DataV 全屏容器承担唯一缩放责任。
- 完整可运行示例、Widget 与实际容器设置见 [Demo 与业务接入](/reference/demo-integration-guide)。
- 包文档：[@lumal/cockpit](/packages/cockpit)
