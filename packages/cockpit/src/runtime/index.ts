import type { App } from 'vue'
import LumaCockpitComp from './LumaCockpit.vue'

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
export const LumaCockpit = withInstall(
  LumaCockpitComp as unknown as Record<string, unknown>,
  'LumaCockpit',
) as typeof LumaCockpitComp & { install: (app: App) => void }

export { cockpitRuntimeEnvKey, useCockpitRuntimeEnv } from './context'
export type { CockpitRuntimeEnv } from './context'
export { default as LumaCockpitCanvas } from './LumaCockpitCanvas.vue'
export { default as LumaCockpitCenterHost } from './LumaCockpitCenterHost.vue'
export { default as LumaCockpitColumn } from './LumaCockpitColumn.vue'
export { default as LumaCockpitContainer } from './LumaCockpitContainer.vue'

export { default as LumaCockpitRegion } from './LumaCockpitRegion.vue'
export { default as LumaCockpitWidgetHost } from './LumaCockpitWidgetHost.vue'
export { resolveCockpitComponent } from './resolveComponent'
