import type {
  CockpitConfig,
  CockpitConfigIssue,
  CockpitRegionConfig,
} from '../types'
import {
  DEFAULT_REGION_WIDTH,
  MAX_REGION_WIDTH,
  MIN_CENTER_WIDTH,
  MIN_REGION_WIDTH,
} from './defaults'

/***********************配置校验*********************/

const BASE_CANVAS_WIDTH = 1920
const BODY_COLUMN_GAPS = 24

export interface CockpitValidationResult {
  valid: boolean
  issues: CockpitConfigIssue[]
}

interface IdTracker {
  seen: Set<string>
  addIssueOnDuplicate: (id: string, path: string[], scope: string) => void
}

function createScopedTracker(issues: CockpitConfigIssue[]): IdTracker {
  const seen = new Set<string>()
  return {
    seen,
    addIssueOnDuplicate(id, path, scope) {
      const key = `${scope}:${id}`
      if (seen.has(key)) {
        issues.push({
          level: 'error',
          message: `${scope} 存在重复 id：${id}`,
          path,
        })
      }
      seen.add(key)
    },
  }
}

function regionColumnCount(region: CockpitRegionConfig | undefined): number {
  return region?.columns?.length ?? 0
}

function resolveRegionWidthForValidation(region: CockpitRegionConfig | undefined): number {
  const count = regionColumnCount(region)
  if (count <= 0)
    return 0
  const width = region?.width
  return typeof width === 'number' && Number.isFinite(width) && width > 0
    ? width
    : DEFAULT_REGION_WIDTH
}

function validateRegionWidth(
  issues: CockpitConfigIssue[],
  region: CockpitRegionConfig | undefined,
  path: string[],
): void {
  const columnCount = regionColumnCount(region)
  const width = region?.width
  if (columnCount <= 0) {
    if (width !== undefined && width !== 0)
      issues.push({ level: 'warning', message: '空区域宽度将归一化为 0。', path })
    return
  }
  if (width !== undefined && (!(width > 0) || width < MIN_REGION_WIDTH || width > MAX_REGION_WIDTH)) {
    issues.push({
      level: 'warning',
      message: `区域宽度超出 ${MIN_REGION_WIDTH}-${MAX_REGION_WIDTH} 范围，将归一化为安全值。`,
      path,
    })
  }
}

/**
 * 校验标准化后的配置。返回是否可保存以及问题清单。
 * error 级别问题会阻止保存；warning 级别仅提示。
 */
export function validateCockpitConfig(config: CockpitConfig): CockpitValidationResult {
  const issues: CockpitConfigIssue[] = []
  const tracker = createScopedTracker(issues)
  // 模块实例 id 建议整个驾驶舱内唯一
  const widgetTracker = createScopedTracker(issues)

  if (!Array.isArray(config.categories) || config.categories.length === 0) {
    issues.push({ level: 'error', message: '驾驶舱至少需要一个分类。' })
  }

  config.categories?.forEach((category) => {
    const categoryPath = [category.id]
    tracker.addIssueOnDuplicate(category.id, categoryPath, '分类')

    if (!Array.isArray(category.pages) || category.pages.length === 0) {
      issues.push({ level: 'error', message: `分类「${category.label}」至少需要一个页面。`, path: categoryPath })
    }

    const pageTracker = createScopedTracker(issues)
    category.pages?.forEach((page) => {
      const pagePath = [...categoryPath, page.id]
      pageTracker.addIssueOnDuplicate(page.id, pagePath, '页面')

      validateRegionWidth(issues, page.left, [...pagePath, 'left'])
      validateRegionWidth(issues, page.right, [...pagePath, 'right'])
      const sideWidthTotal = resolveRegionWidthForValidation(page.left) + resolveRegionWidthForValidation(page.right)
      const maxSideTotal = BASE_CANVAS_WIDTH - MIN_CENTER_WIDTH - BODY_COLUMN_GAPS
      if (sideWidthTotal > maxSideTotal) {
        issues.push({
          level: 'warning',
          message: '左右区域总宽度过大，将压缩以保留中央区域最小宽度。',
          path: pagePath,
        })
      }

      ;([['left', page.left], ['right', page.right]] as const).forEach(([side, region]) => {
        const columnTracker = createScopedTracker(issues)
        region?.columns?.forEach((column) => {
          const columnPath = [...pagePath, `${side}:${column.id}`]
          columnTracker.addIssueOnDuplicate(column.id, columnPath, '列')
          if (!(column.width > 0))
            issues.push({ level: 'warning', message: '列宽权重非法，将回退为安全默认值。', path: columnPath })

          const containerTracker = createScopedTracker(issues)
          column.containers?.forEach((container) => {
            const containerPath = [...columnPath, container.id]
            containerTracker.addIssueOnDuplicate(container.id, containerPath, '容器')
            if (!(container.height > 0))
              issues.push({ level: 'warning', message: '容器高度权重非法，将回退为安全默认值。', path: containerPath })

            const visibleWidgets = container.widgets?.filter(widget => widget.visible !== false) ?? []
            if (container.mode === 'single' && visibleWidgets.length > 1) {
              issues.push({
                level: 'error',
                message: 'single 模式只允许一个可见模块。',
                path: containerPath,
              })
            }
            if (container.mode === 'tabs' && container.activeWidgetId) {
              const activeExists = visibleWidgets.some(widget => widget.id === container.activeWidgetId)
              if (!activeExists) {
                issues.push({
                  level: 'warning',
                  message: 'tabs 默认激活模块不存在，将回退到第一个可见模块。',
                  path: containerPath,
                })
              }
            }

            container.widgets?.forEach((widget) => {
              widgetTracker.addIssueOnDuplicate(widget.id, [...containerPath, widget.id], '模块实例')
            })
          })
        })
      })
    })
  })

  return {
    valid: !issues.some(issue => issue.level === 'error'),
    issues,
  }
}
