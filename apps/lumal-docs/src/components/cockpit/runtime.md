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
- 设计px仅按项目统一设计宽度换算vw，高度不作为比例除数。
- baseWidth/baseHeight是内容尺寸，左右面板/列宽数字为设计px，行高百分比不变。
- 无适配模式、居中偏移或整画布transform；与DataV容器嵌套不二次缩放。
- 完整可运行示例、Widget 与实际容器设置见 [Demo 与业务接入](/reference/demo-integration-guide)。
- 包文档：[@lumal/cockpit](/packages/cockpit)
