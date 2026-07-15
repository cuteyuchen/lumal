export type BorderBoxVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
export type DecorationVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
export type DataValueKey = string | number
export type { EChartsOption as LumaChartsOption } from 'echarts'

export interface DataValueItem {
  key: DataValueKey
  label: string
  value: number
  color?: string
}

export interface ActiveRingChartDataItem {
  key?: DataValueKey
  name: string
  value: number
  [key: string]: unknown
}

export type ActiveRingDigitalFlopStyle = DigitalFlopStyle

/** DataV 2.10.0 activeRingChart config-compatible options. */
export interface ActiveRingChartConfig {
  activeRadius?: number | string
  activeTimeGap?: number
  animationCurve?: 'easeOutCubic' | 'linear'
  animationFrame?: number
  color?: readonly string[]
  data?: readonly ActiveRingChartDataItem[]
  digitalFlopStyle?: ActiveRingDigitalFlopStyle
  digitalFlopToFixed?: number
  digitalFlopUnit?: string
  lineWidth?: number
  radius?: number | string
  showOriginValue?: boolean
  [key: string]: unknown
}

/** DataV 2.10.0 capsuleChart config-compatible options. */
export interface CapsuleChartConfig {
  colors?: readonly string[]
  data?: readonly ActiveRingChartDataItem[]
  showValue?: boolean
  unit?: string
}

/** DataV 2.10.0 conicalColumnChart config-compatible options. */
export interface ConicalColumnChartConfig {
  columnColor?: string
  data?: readonly ActiveRingChartDataItem[]
  fontSize?: number
  img?: readonly string[]
  imgSideLength?: number
  showValue?: boolean
  textColor?: string
}

export interface DigitalFlopStyle {
  fill?: string
  fontFamily?: string
  fontSize?: number
  fontStyle?: string
  fontVarient?: string
  fontWeight?: number | string
  lineCap?: CanvasLineCap
  lineDash?: readonly number[]
  lineDashOffset?: number
  lineJoin?: CanvasLineJoin
  lineWidth?: number
  opacity?: number
  shadowBlur?: number
  shadowColor?: string
  shadowOffsetX?: number
  shadowOffsetY?: number
  stroke?: string
  textAlign?: 'center' | 'left' | 'right'
  textBaseline?: string
  [key: string]: unknown
}

/** DataV 2.10.0 digitalFlop config-compatible options. */
export interface DigitalFlopConfig {
  animationCurve?: string
  animationFrame?: number
  content?: string
  formatter?: (value: string) => number | string
  number?: readonly number[]
  rowGap?: number
  style?: DigitalFlopStyle
  textAlign?: 'center' | 'left' | 'right'
  toFixed?: number
}

/** DataV 2.10.0 percentPond config-compatible options. */
export interface PercentPondConfig {
  borderGap?: number
  borderRadius?: number
  borderWidth?: number
  colors?: readonly string[]
  formatter?: string
  lineDash?: readonly number[]
  localGradient?: boolean
  textColor?: string
  value?: number
}

/** DataV 2.10.0 waterLevelPond config-compatible options. */
export interface WaterLevelPondConfig {
  colors?: readonly string[]
  data?: readonly number[]
  formatter?: string
  shape?: 'rect' | 'round' | 'roundRect'
  waveHeight?: number
  waveNum?: number
  waveOpacity?: number
}

export interface RankingItem<T = unknown> extends DataValueItem {
  data?: T
}

export type ScrollBoardRow<T extends object = Record<string, unknown>> = T

export type ScrollBoardAlign = 'center' | 'left' | 'right'
export type ScrollCarousel = 'page' | 'single'

/** DataV 2.10.0 scrollBoard config-compatible options. */
export interface ScrollBoardConfig {
  align?: readonly ScrollBoardAlign[]
  carousel?: ScrollCarousel
  columnWidth?: readonly number[]
  data?: readonly (readonly unknown[])[]
  evenRowBGC?: string
  header?: readonly string[]
  headerBGC?: string
  headerHeight?: number
  hoverPause?: boolean
  index?: boolean
  indexHeader?: string
  oddRowBGC?: string
  rowNum?: number
  waitTime?: number
}

export interface ScrollBoardEventPayload {
  ceil: unknown
  columnIndex: number
  row: readonly unknown[]
  rowIndex: number
}

export interface ScrollRankingDataItem<T = unknown> {
  name: string
  value: number
  data?: T
  [key: string]: unknown
}

export interface ScrollRankingComputedItem<T = unknown> extends ScrollRankingDataItem<T> {
  percent: number
  ranking: number
  scroll: number
}

/** DataV 2.10.0 scrollRankingBoard config-compatible options. */
export interface ScrollRankingBoardConfig<T = unknown> {
  carousel?: ScrollCarousel
  data?: readonly ScrollRankingDataItem<T>[]
  rowNum?: number
  sort?: boolean
  unit?: string
  valueFormatter?: (item: ScrollRankingComputedItem<T>) => number | string
  waitTime?: number
}

export interface ScrollBoardColumn<T extends object = Record<string, unknown>> {
  key: keyof T | string
  label: string
  align?: ScrollBoardAlign
  width?: number | string
  formatter?: (value: unknown, row: T, index: number) => string | number
}

export type ScrollBoardRowKey<T extends object> = keyof T | string | ((row: T, index: number) => DataValueKey)

export type FlylineCoordinate = readonly [number, number]
export type FlylineDurationRange = readonly [number, number]

export interface FlylineTextStyle {
  color?: string
  fontSize?: number
  offset?: FlylineCoordinate
  show?: boolean
}

export interface FlylineHaloStyle {
  color?: string
  duration?: FlylineDurationRange
  radius?: number
  show?: boolean
}

export interface FlylineChartHaloStyle {
  color?: string
  /** DataV uses tenths of a second for the basic flyline halo. */
  duration?: number | FlylineDurationRange
  radius?: number
  show?: boolean
}

export interface FlylineIconStyle {
  height?: number
  show?: boolean
  src?: string
  width?: number
}

export interface FlylineImageStyle {
  height?: number
  url?: string
  width?: number
}

export interface FlylineChartPoint {
  position: FlylineCoordinate
  text?: string
}

export interface FlylineChartConfig {
  /** DataV 2.10.0 option name. */
  bgImgUrl?: string
  /** @deprecated Use `bgImgUrl`. */
  backgroundImage?: string
  /** DataV 2.10.0 option name. */
  centerPoint?: FlylineCoordinate
  /** @deprecated Use `centerPoint`. */
  center?: FlylineCoordinate
  /** DataV 2.10.0 option name. */
  centerPointImg?: FlylineImageStyle
  /** @deprecated Use `centerPointImg`. */
  centerImage?: FlylineImageStyle
  curvature?: number
  duration?: FlylineDurationRange
  flylineColor?: string
  flylineRadius?: number
  halo?: FlylineChartHaloStyle
  k?: number
  lineWidth?: number
  orbitColor?: string
  /** DataV 2.10.0 option name. */
  pointsImg?: FlylineImageStyle
  /** @deprecated Use `pointsImg`. */
  pointImage?: FlylineImageStyle
  points?: readonly (FlylineChartPoint | FlylineCoordinate)[]
  relative?: boolean
  text?: FlylineTextStyle
}

export interface FlylineEnhancedPoint {
  coordinate: FlylineCoordinate
  halo?: FlylineHaloStyle
  icon?: FlylineIconStyle
  name: string
  text?: FlylineTextStyle
}

export interface FlylineLineStyle {
  color?: string
  duration?: FlylineDurationRange
  orbitColor?: string
  radius?: number
  width?: number
}

export interface FlylineEnhancedLine extends FlylineLineStyle {
  source: string
  target: string
}

export interface FlylineEnhancedConfig {
  /** DataV 2.10.0 option name. */
  bgImgSrc?: string
  /** @deprecated Use `bgImgSrc`. */
  backgroundImage?: string
  curvature?: number
  halo?: FlylineHaloStyle
  icon?: FlylineIconStyle
  k?: number
  line?: FlylineLineStyle
  lines?: readonly FlylineEnhancedLine[]
  points?: readonly FlylineEnhancedPoint[]
  relative?: boolean
  text?: FlylineTextStyle
}
