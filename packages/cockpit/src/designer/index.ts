import type { App } from 'vue'
import LumaCockpitDesignerComp from './LumaCockpitDesigner.vue'

/***********************组件安装包装*********************/
type WithInstall<T> = T & { install: (app: App) => void }

function withInstall<T extends Record<string, unknown>>(component: T, name: string): WithInstall<T> {
  const installable = component as WithInstall<T>

  installable.install = function install(app: App): void {
    app.component(name, component as never)
  }

  return installable
}

/***********************导出*********************/
export const LumaCockpitDesigner = withInstall(
  LumaCockpitDesignerComp as unknown as Record<string, unknown>,
  'LumaCockpitDesigner',
) as typeof LumaCockpitDesignerComp & { install: (app: App) => void }

export { default as CockpitComponentLibrary } from './CockpitComponentLibrary.vue'
export { default as CockpitLayoutEditor } from './CockpitLayoutEditor.vue'
export { default as CockpitWidgetPreview } from './CockpitWidgetPreview.vue'
export { default as CockpitWidgetDropZone } from './CockpitWidgetDropZone.vue'

export { useCockpitDraft } from './useCockpitDraft'
export type { DraftSelection, DraftWidgetLocation, MoveWidgetResult, UseCockpitDraftReturn } from './useCockpitDraft'
