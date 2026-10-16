import type { CockpitRegistry, CockpitWidgetDefinition } from './types'
import { shallowReactive } from 'vue'

/***********************模块注册表实现*********************/

export function createCockpitRegistry(): CockpitRegistry {
  // 仅跟踪注册项增删，保持组件定义和第三方实例为原始对象。
  const widgets = shallowReactive(new Map<string, CockpitWidgetDefinition>())

  function registerWidget(definition: CockpitWidgetDefinition): void {
    if (!definition.type.trim())
      throw new Error('[cockpit] 模块 type 不能为空。')
    if (widgets.has(definition.type))
      throw new Error(`[cockpit] 模块 type 已注册：${definition.type}`)
    widgets.set(definition.type, definition)
  }

  function registerWidgets(definitions: CockpitWidgetDefinition[]): void {
    definitions.forEach(registerWidget)
  }

  function unregisterWidget(type: string): void {
    widgets.delete(type)
  }

  function resolveWidget(type: string): CockpitWidgetDefinition | undefined {
    return widgets.get(type)
  }

  function listWidgets(): readonly CockpitWidgetDefinition[] {
    return [...widgets.values()]
  }

  return {
    registerWidget,
    registerWidgets,
    unregisterWidget,
    resolveWidget,
    listWidgets,
  }
}
