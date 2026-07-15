import type { FlylineCoordinate, FlylineDurationRange } from './types'

export interface FlylinePath {
  control: FlylineCoordinate
  d: string
  end: FlylineCoordinate
  start: FlylineCoordinate
}

export function resolveCoordinate(
  coordinate: FlylineCoordinate,
  relative: boolean,
  width: number,
  height: number,
): FlylineCoordinate {
  return relative ? [coordinate[0] * width, coordinate[1] * height] : coordinate
}

export function createFlylinePath(
  start: FlylineCoordinate,
  end: FlylineCoordinate,
  curvature = 5,
  k = -0.5,
): FlylinePath {
  const middleX = (start[0] + end[0]) / 2
  const middleY = (start[1] + end[1]) / 2
  const distance = Math.hypot(start[0] - end[0], start[1] - end[1])
  const divisor = Number.isFinite(curvature) && curvature !== 0 ? curvature : 5
  const targetLength = distance / divisor
  const step = targetLength / 2
  let controlX = middleX
  let controlY = middleY

  // Keep DataV's stepping algorithm so the quadratic curve is pixel-identical.
  do {
    controlX += step
    controlY = middleY - k * middleX + k * controlX
  } while (Math.hypot(controlX - middleX, controlY - middleY) < targetLength)

  const control: FlylineCoordinate = [controlX, controlY]

  return {
    control,
    d: `M${start[0]},${start[1]} Q${control[0]},${control[1]} ${end[0]},${end[1]}`,
    end,
    start,
  }
}

export function randomDuration(range: FlylineDurationRange | undefined): number {
  const [first, second] = range ?? [20, 30]
  const minimum = Math.ceil(Math.min(first, second))
  const maximum = Math.floor(Math.max(first, second))
  return Math.floor(Math.random() * (maximum - minimum + 1) + minimum) / 10
}

export function svgId(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/[^\w-]/g, '')}`
}
