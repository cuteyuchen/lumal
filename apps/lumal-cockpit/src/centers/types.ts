import type { SceneStatus } from '../data/demo-scene'

export type CenterEngine = 'echarts' | 'openlayers' | 'cesium'

export interface SceneCenterRendererProps {
  selectedIds: string[]
  focusedId: string
  filterStatus?: SceneStatus
  reducedMotion: boolean
}
