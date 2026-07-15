import type { SceneStatus } from '../data/demo-scene'

export type CenterEngine = 'echarts' | 'openlayers' | 'cesium'
export type CenterTheme = 'light' | 'dark'

export interface SceneCenterRendererProps {
  selectedIds: string[]
  focusedId: string
  filterStatus?: SceneStatus
  theme: CenterTheme
  reducedMotion: boolean
}
