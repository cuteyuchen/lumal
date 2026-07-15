import type { DecorationVariant } from '../types'

export type DecorationPoint = readonly [number, number]

export interface AnimatedPoint {
  animated: boolean
  beginSeconds: number
  durationSeconds: number
  point: DecorationPoint
}

export interface DecorationBar {
  colorIndex: 0 | 1
  durationSeconds: number
  height: number
  minHeight: number
  point: DecorationPoint
}

export interface RadarGeometry {
  arcPaths: string[]
  circleRadii: number[]
  scanPaths: string[]
  splitLines: string[]
}

export const DECORATION_DEFAULT_COLORS: Record<DecorationVariant, readonly [string, string]> = {
  1: ['#fff', '#0de7c2'],
  2: ['#3faacb', '#fff'],
  3: ['#7acaec', 'transparent'],
  4: ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.3)'],
  5: ['#3f96a5', '#3f96a5'],
  6: ['#7acaec', '#7acaec'],
  7: ['#1dc1f5', '#1dc1f5'],
  8: ['#3f96a5', '#3f96a5'],
  9: ['rgba(3, 166, 224, 0.8)', 'rgba(3, 166, 224, 0.5)'],
  10: ['#00c2ff', 'rgba(0, 194, 255, 0.3)'],
  11: ['#1a98fc', '#2cf7fe'],
  12: ['#2783ce', '#2cf7fe'],
}

export const DECORATION_DEFAULT_DURATION: Record<DecorationVariant, number> = {
  1: 2000,
  2: 6000,
  3: 1500,
  4: 3000,
  5: 1200,
  6: 2000,
  7: 2800,
  8: 2800,
  9: 3000,
  10: 3000,
  11: 2800,
  12: 3000,
}

let decorationInstance = 0

export function createDecorationInstanceId(vueId: string): string {
  decorationInstance += 1
  return `luma-decoration-${vueId.replace(/[^\w-]/g, '')}-${decorationInstance}`
}

function gridPoints(width: number, height: number, rows: number, columns: number): DecorationPoint[] {
  const horizontalGap = width / (columns + 1)
  const verticalGap = height / (rows + 1)

  return Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns)
    const column = index % columns
    return [horizontalGap * (column + 1), verticalGap * (row + 1)] as const
  })
}

const decoration1Grid = gridPoints(200, 50, 4, 20)

export function createDecoration1Points(): AnimatedPoint[] {
  return decoration1Grid
    .filter(() => Math.random() > 0.6)
    .map(point => ({
    animated: Math.random() > 0.6,
    beginSeconds: Math.random() * 2,
    durationSeconds: 1,
    point,
  }))
}

export const decoration1Rects = [
  decoration1Grid[39] ?? [0, 0],
  decoration1Grid[37] ?? [0, 0],
] as const

export function createDecoration3Points(): AnimatedPoint[] {
  return gridPoints(300, 35, 2, 25).map(point => ({
    animated: Math.random() > 0.6,
    beginSeconds: Math.random() * 2,
    durationSeconds: Math.random() + 1,
    point,
  }))
}

export function createDecoration6Bars(): DecorationBar[] {
  return gridPoints(300, 35, 1, 40).map((point) => {
    const tall = Math.random() > 0.8
    const minimum = tall ? 35 * 0.7 : 35 * 0.2
    const maximum = tall ? 35 : 35 * 0.5
    const height = Math.trunc(Math.random() * (maximum - minimum + 1) + minimum)

    return {
      colorIndex: Math.random() > 0.5 ? 0 : 1,
      durationSeconds: Math.random() + 1.5,
      height,
      minHeight: height * Math.random(),
      point,
    }
  })
}

export function createDecoration9Fills(): boolean[] {
  return Array.from({ length: 20 }, () => Math.random() <= 0.4)
}

export function fadeColor(color: string, opacityPercent: number): string {
  const opacity = Math.min(100, Math.max(0, opacityPercent)) / 100
  const hex = color.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1]

  if (hex) {
    const normalized = hex.length === 3
      ? hex.split('').map(value => `${value}${value}`).join('')
      : hex
    const red = Number.parseInt(normalized.slice(0, 2), 16)
    const green = Number.parseInt(normalized.slice(2, 4), 16)
    const blue = Number.parseInt(normalized.slice(4, 6), 16)
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`
  }

  const rgb = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
  if (rgb)
    return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${opacity})`

  if (color.trim().toLowerCase() === 'transparent')
    return 'transparent'

  return `color-mix(in srgb, ${color} ${opacityPercent}%, transparent)`
}

export function polylineLength(points: readonly DecorationPoint[]): number {
  return points.slice(1).reduce((length, point, index) => {
    const previous = points[index]
    if (!previous)
      return length
    return length + Math.hypot(point[0] - previous[0], point[1] - previous[1])
  }, 0)
}

export function circlePoint(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
): DecorationPoint {
  return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius]
}

export function createRadarGeometry(width: number, height: number): RadarGeometry {
  const centerX = width / 2
  const centerY = height / 2
  const segment = 30
  const sectorAngle = Math.PI / 3
  const scanRadius = width / 4
  const startAngle = -Math.PI / 2
  const angleGap = sectorAngle / segment
  let lastEndPoint = circlePoint(centerX, centerY, scanRadius, startAngle)

  const scanPaths = Array.from({ length: segment }, (_, index) => {
    const endPoint = circlePoint(centerX, centerY, scanRadius, startAngle - (index + 1) * angleGap)
      .map(value => value.toFixed(5))
    const path = `M${lastEndPoint.join(',')} A${scanRadius}, ${scanRadius} 0 0 0 ${endPoint.join(',')}`
    lastEndPoint = [Number(endPoint[0]), Number(endPoint[1])]
    return path
  })

  const radiusGap = Math.max(0, width / 2 - 0.5) / 3
  const circleRadii = Array.from({ length: 3 }, (_, index) => radiusGap * (index + 1))
  const splitAngleGap = Math.PI / 6
  const outerRadius = width / 2
  const splitLines = Array.from({ length: 6 }, (_, index) => {
    const angle = splitAngleGap * (index + 1)
    const startPoint = circlePoint(centerX, centerY, outerRadius, angle)
    const endPoint = circlePoint(centerX, centerY, outerRadius, angle + Math.PI)
    return `${startPoint.join(',')} ${endPoint.join(',')}`
  })

  const arcRadius = Math.max(0, width / 2 - 1)
  const arcPaths = Array.from({ length: 4 }, (_, index) => {
    const angle = splitAngleGap * (3 * index + 1)
    const startPoint = circlePoint(centerX, centerY, arcRadius, angle)
    const endPoint = circlePoint(centerX, centerY, arcRadius, angle + splitAngleGap)
    return `M${startPoint.join(',')} A${centerX}, ${centerY} 0 0 1 ${endPoint.join(',')}`
  })

  return { arcPaths, circleRadii, scanPaths, splitLines }
}
