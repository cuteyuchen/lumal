import { builtinIconDefinitions } from './builtin-icons'
import { registerIcons } from './registry/icons'

registerIcons(builtinIconDefinitions)

export { builtinIconDefinitions }

export {
  getRegisteredIconGroups,
  registerIconGroups,
} from './registry/groups'
/***********************图标能力导出*********************/
export {
  createComponentIconDefinitions,
  createIconifyIconDefinitions,
  getRegisteredIconDefinitions,
  registerIcons,
  resolveIconDefinition,
} from './registry/icons'
export { subscribeIconRegistry } from './registry/state'
export type { IconRegistryListener } from './registry/state'
export {
  applySvgGradient,
  clearIconDataUriCache,
  composeSvgIcons,
  getGradientIconDataUri,
  getIconDataUri,
  getIconSvgText,
  getStaticLocalSvgIconDefinitions,
  recolorSvgString,
  registerStaticLocalSvgIcons,
  resolveAnyIconDefinition,
  resolveStaticLocalSvgIconDefinition,
  svgToDataUri,
  validateMonochromeSvg,
} from './runtime'
export type { SvgValidationResult } from './runtime'
export type {
  IconDefinition,
  IconGradientOptions,
  IconGradientStop,
  IconGroupDefinition,
  IconKey,
  IconSource,
} from './types'
