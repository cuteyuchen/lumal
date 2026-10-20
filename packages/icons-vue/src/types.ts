import type { IconGroupDefinition } from '@lumal/icons'

export type { LumalIconMorphSpring } from '@lumal/icons/morph'

/***********************选择器插槽类型*********************/
export interface LumalIconPickerGroupSelectSlotProps {
  modelValue: string
  groups: IconGroupDefinition[]
  setGroup: (group: string) => void
}
