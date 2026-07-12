import type { CockpitConfig } from '../types'
import { COCKPIT_SCHEMA_VERSION, DEFAULT_REGION_WIDTH } from './defaults'

/***********************配置版本迁移*********************/

export type CockpitMigration = (config: Record<string, unknown>) => Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function migrateRegionToV2(region: unknown): Record<string, unknown> {
  const source = isRecord(region) ? { ...region } : {}
  const columns = Array.isArray(source.columns) ? source.columns : []
  if (source.width === undefined)
    source.width = columns.length > 0 ? DEFAULT_REGION_WIDTH : 0
  return source
}

function migratePageToV2(page: unknown): unknown {
  if (!isRecord(page))
    return page
  return {
    ...page,
    left: migrateRegionToV2(page.left),
    right: migrateRegionToV2(page.right),
  }
}

function migrateCategoryToV2(category: unknown): unknown {
  if (!isRecord(category))
    return category
  const pages = Array.isArray(category.pages) ? category.pages.map(migratePageToV2) : category.pages
  return { ...category, pages }
}

/**
 * 按 schemaVersion 顺序注册的迁移步骤。
 * 初版仅有 version 1，暂无迁移逻辑；后续版本升级时在此追加。
 * migrations[n] 负责把 version n 的配置升级到 version n+1。
 */
const migrations: Record<number, CockpitMigration> = {
  1(config) {
    const categories = Array.isArray(config.categories)
      ? config.categories.map(migrateCategoryToV2)
      : config.categories
    return { ...config, categories, schemaVersion: 2 }
  },
}

/**
 * 将任意历史版本的配置迁移到当前 schemaVersion。
 * 未知或缺失版本按 1 处理；迁移不会抛错，交由后续 normalize 兜底。
 */
export function migrateCockpitConfig(raw: unknown): Record<string, unknown> {
  const source = (typeof raw === 'object' && raw !== null ? { ...raw } : {}) as Record<string, unknown>

  let version = typeof source.schemaVersion === 'number' && Number.isFinite(source.schemaVersion)
    ? source.schemaVersion
    : 1

  let current = source
  while (version < COCKPIT_SCHEMA_VERSION) {
    const migrate = migrations[version]
    if (!migrate)
      break
    current = migrate(current)
    version += 1
  }

  current.schemaVersion = COCKPIT_SCHEMA_VERSION
  return current
}

/** 判断配置是否需要迁移 */
export function needsMigration(config: Pick<CockpitConfig, 'schemaVersion'>): boolean {
  return config.schemaVersion !== COCKPIT_SCHEMA_VERSION
}
