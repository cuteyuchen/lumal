import type { DraftWidgetLocation } from './useCockpitDraft'

/***********************Designer 放置选择*********************/

export type DesignerPlacementSelection
  = | { kind: 'library', type: string, title: string }
    | { kind: 'placed', location: DraftWidgetLocation, widgetId: string, title: string }

