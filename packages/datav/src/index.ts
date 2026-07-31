import type { App, Component } from 'vue'
import LumalActiveRingChartComp from './components/LumalActiveRingChart.vue'
import LumalBorderBoxComp from './components/LumalBorderBox.vue'
import LumalCapsuleChartComp from './components/LumalCapsuleChart.vue'
import LumalChartsComp from './components/LumalCharts.vue'
import LumalConicalColumnChartComp from './components/LumalConicalColumnChart.vue'
import LumalDecorationComp from './components/LumalDecoration.vue'
import LumalDigitalFlopComp from './components/LumalDigitalFlop.vue'
import LumalFlylineChartComp from './components/LumalFlylineChart.vue'
import LumalFlylineChartEnhancedComp from './components/LumalFlylineChartEnhanced.vue'
import LumalFullScreenContainerComp from './components/LumalFullScreenContainer.vue'
import LumalLoadingComp from './components/LumalLoading.vue'
import LumalPercentPondComp from './components/LumalPercentPond.vue'
import LumalScrollBoardComp from './components/LumalScrollBoard.vue'
import LumalScrollRankingBoardComp from './components/LumalScrollRankingBoard.vue'
import LumalWaterLevelPondComp from './components/LumalWaterLevelPond.vue'
import './source-style.css'

type WithInstall<T> = T & { install: (app: App) => void }

function withInstall<T extends Component>(component: T, name: string): WithInstall<T> {
  const installable = component as WithInstall<T>
  installable.install = app => app.component(name, component)
  return installable
}

export const LumalActiveRingChart = withInstall(LumalActiveRingChartComp, 'LumalActiveRingChart')
export const LumalBorderBox = withInstall(LumalBorderBoxComp, 'LumalBorderBox')
export const LumalCapsuleChart = withInstall(LumalCapsuleChartComp, 'LumalCapsuleChart')
export const LumalCharts = withInstall(LumalChartsComp, 'LumalCharts')
export const LumalConicalColumnChart = withInstall(LumalConicalColumnChartComp, 'LumalConicalColumnChart')
export const LumalDecoration = withInstall(LumalDecorationComp, 'LumalDecoration')
export const LumalDigitalFlop = withInstall(LumalDigitalFlopComp, 'LumalDigitalFlop')
export const LumalFlylineChart = withInstall(LumalFlylineChartComp, 'LumalFlylineChart')
export const LumalFlylineChartEnhanced = withInstall(LumalFlylineChartEnhancedComp, 'LumalFlylineChartEnhanced')
export const LumalFullScreenContainer = withInstall(LumalFullScreenContainerComp, 'LumalFullScreenContainer')
export const LumalLoading = withInstall(LumalLoadingComp, 'LumalLoading')
export const LumalPercentPond = withInstall(LumalPercentPondComp, 'LumalPercentPond')
export const LumalScrollBoard = withInstall(LumalScrollBoardComp, 'LumalScrollBoard')
export const LumalScrollRankingBoard = withInstall(LumalScrollRankingBoardComp, 'LumalScrollRankingBoard')
export const LumalWaterLevelPond = withInstall(LumalWaterLevelPondComp, 'LumalWaterLevelPond')

const components = [
  LumalActiveRingChart,
  LumalBorderBox,
  LumalCapsuleChart,
  LumalCharts,
  LumalConicalColumnChart,
  LumalDecoration,
  LumalDigitalFlop,
  LumalFlylineChart,
  LumalFlylineChartEnhanced,
  LumalFullScreenContainer,
  LumalLoading,
  LumalPercentPond,
  LumalScrollBoard,
  LumalScrollRankingBoard,
  LumalWaterLevelPond,
]

export function install(app: App): void {
  components.forEach(component => app.use(component))
}

export default { install }

export {
  computeFullScreenScale,
  useFullScreenScale,
} from './composables/useFullScreenScale'

export type {
  FullScreenScaleResult,
  UseFullScreenScaleOptions,
} from './composables/useFullScreenScale'

export type {
  ActiveRingChartConfig,
  ActiveRingChartDataItem,
  ActiveRingDigitalFlopStyle,
  BorderBoxVariant,
  CapsuleChartConfig,
  ConicalColumnChartConfig,
  DataValueItem,
  DataValueKey,
  DataVChartsOption,
  DecorationVariant,
  DigitalFlopConfig,
  DigitalFlopStyle,
  FlylineChartConfig,
  FlylineChartHaloStyle,
  FlylineChartPoint,
  FlylineCoordinate,
  FlylineDurationRange,
  FlylineEnhancedConfig,
  FlylineEnhancedLine,
  FlylineEnhancedPoint,
  FlylineHaloStyle,
  FlylineIconStyle,
  FlylineImageStyle,
  FlylineLineStyle,
  FlylineTextStyle,
  FullScreenContainerMode,
  LumalChartsOption,
  PercentPondConfig,
  RankingItem,
  ScrollBoardColumn,
  ScrollBoardConfig,
  ScrollBoardEventPayload,
  ScrollBoardRow,
  ScrollBoardRowKey,
  ScrollCarousel,
  ScrollRankingBoardConfig,
  ScrollRankingComputedItem,
  ScrollRankingDataItem,
  WaterLevelPondConfig,
} from './types'
