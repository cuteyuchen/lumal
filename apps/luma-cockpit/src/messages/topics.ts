/***********************独立应用业务消息协议*********************/
// 独立应用自行维护 topic 与 payload 类型，@luma/cockpit 不导入此文件。

import type { SceneStatus } from '../data/demo-scene'

export const cockpitTopics = {
  nodeSelected: 'standalone:node-selected',
  centerReady: 'standalone:center-ready',
  sceneRegionFocus: 'scene:region-focus',
  scenePointFocus: 'scene:point-focus',
  sceneFilterChange: 'scene:filter-change',
  sceneSelectionChange: 'scene:selection-change',
} as const

export interface NodeSelectedPayload {
  id: string
}

export interface SceneFocusPayload {
  id: string
}

export interface SceneFilterPayload {
  status?: SceneStatus
}

export interface SceneSelectionPayload {
  ids: string[]
}
