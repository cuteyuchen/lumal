import type { App, Component } from 'vue'
import LumaActiveRingChartComp from './components/LumaActiveRingChart.vue'
import LumaBorderBoxComp from './components/LumaBorderBox.vue'
import LumaCapsuleChartComp from './components/LumaCapsuleChart.vue'
import LumaChartsComp from './components/LumaCharts.vue'
import LumaConicalColumnChartComp from './components/LumaConicalColumnChart.vue'
import LumaDecorationComp from './components/LumaDecoration.vue'
import LumaDigitalFlopComp from './components/LumaDigitalFlop.vue'
import LumaFlylineChartComp from './components/LumaFlylineChart.vue'
import LumaFlylineChartEnhancedComp from './components/LumaFlylineChartEnhanced.vue'
import LumaFullScreenContainerComp from './components/LumaFullScreenContainer.vue'
import LumaLoadingComp from './components/LumaLoading.vue'
import LumaPercentPondComp from './components/LumaPercentPond.vue'
import LumaScrollBoardComp from './components/LumaScrollBoard.vue'
import LumaScrollRankingBoardComp from './components/LumaScrollRankingBoard.vue'
import LumaWaterLevelPondComp from './components/LumaWaterLevelPond.vue'
import './source-style.css'

type WithInstall<T> = T & { install: (app: App) => void }

function withInstall<T extends Component>(component: T, name: string): WithInstall<T> {
  const installable = component as WithInstall<T>
  installable.install = app => app.component(name, component)
  return installable
}

export const LumaActiveRingChart = withInstall(LumaActiveRingChartComp, 'LumaActiveRingChart')
export const LumaBorderBox = withInstall(LumaBorderBoxComp, 'LumaBorderBox')
export const LumaCapsuleChart = withInstall(LumaCapsuleChartComp, 'LumaCapsuleChart')
export const LumaCharts = withInstall(LumaChartsComp, 'LumaCharts')
export const LumaConicalColumnChart = withInstall(LumaConicalColumnChartComp, 'LumaConicalColumnChart')
export const LumaDecoration = withInstall(LumaDecorationComp, 'LumaDecoration')
export const LumaDigitalFlop = withInstall(LumaDigitalFlopComp, 'LumaDigitalFlop')
export const LumaFlylineChart = withInstall(LumaFlylineChartComp, 'LumaFlylineChart')
export const LumaFlylineChartEnhanced = withInstall(LumaFlylineChartEnhancedComp, 'LumaFlylineChartEnhanced')
export const LumaFullScreenContainer = withInstall(LumaFullScreenContainerComp, 'LumaFullScreenContainer')
export const LumaLoading = withInstall(LumaLoadingComp, 'LumaLoading')
export const LumaPercentPond = withInstall(LumaPercentPondComp, 'LumaPercentPond')
export const LumaScrollBoard = withInstall(LumaScrollBoardComp, 'LumaScrollBoard')
export const LumaScrollRankingBoard = withInstall(LumaScrollRankingBoardComp, 'LumaScrollRankingBoard')
export const LumaWaterLevelPond = withInstall(LumaWaterLevelPondComp, 'LumaWaterLevelPond')

const components = [
  LumaActiveRingChart,
  LumaBorderBox,
  LumaCapsuleChart,
  LumaCharts,
  LumaConicalColumnChart,
  LumaDecoration,
  LumaDigitalFlop,
  LumaFlylineChart,
  LumaFlylineChartEnhanced,
  LumaFullScreenContainer,
  LumaLoading,
  LumaPercentPond,
  LumaScrollBoard,
  LumaScrollRankingBoard,
  LumaWaterLevelPond,
]

export function install(app: App): void {
  components.forEach(component => app.use(component))
}

export default { install }

export type {
  ActiveRingChartConfig,
  ActiveRingChartDataItem,
  ActiveRingDigitalFlopStyle,
  BorderBoxVariant,
  CapsuleChartConfig,
  ConicalColumnChartConfig,
  DataValueItem,
  DataValueKey,
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
  LumaChartsOption,
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
