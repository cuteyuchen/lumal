import type { CSSProperties } from 'vue'
import type { DataValueItem, DataValueKey, ScrollBoardRowKey } from './types'

export function clampPercent(value: number): number {
  if (!Number.isFinite(value))
    return 0
  return Math.min(100, Math.max(0, value))
}

export function positiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback
}

export function cssSize(value: number | string | undefined): string | undefined {
  return typeof value === 'number' ? `${value}px` : value
}

export function colorStyle(colors?: readonly [string, string], background?: string, duration?: number): CSSProperties {
  return {
    '--luma-datav-background': background,
    '--luma-datav-duration': duration === undefined ? undefined : `${Math.max(0, duration)}ms`,
    '--luma-datav-primary': colors?.[0],
    '--luma-datav-secondary': colors?.[1],
  } as CSSProperties
}

export function itemColor(item: DataValueItem, index: number): string {
  return item.color ?? `hsl(${(196 + index * 47) % 360} 82% 58%)`
}

export function resolveRowKey<T extends object>(
  row: T,
  index: number,
  rowKey: ScrollBoardRowKey<T>,
): DataValueKey {
  if (typeof rowKey === 'function')
    return rowKey(row, index)
  const value = (row as Record<PropertyKey, unknown>)[rowKey as PropertyKey]
  return typeof value === 'string' || typeof value === 'number' ? value : index
}
