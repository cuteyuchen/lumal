import type { PermissionCheckMode, PermissionRequirement } from './types'

/***********************权限判断*********************/
function normalizeRequirement(required: PermissionRequirement): string[] {
  if (!required) {
    return []
  }

  return Array.isArray(required) ? required : [required]
}

function matchValues(
  values: string[],
  required: PermissionRequirement,
  mode: PermissionCheckMode = 'some',
): boolean {
  const requiredValues = normalizeRequirement(required)

  if (requiredValues.length === 0) {
    return true
  }

  const valueSet = new Set(values)
  const matcher = (item: string) => valueSet.has(item)

  return mode === 'every'
    ? requiredValues.every(matcher)
    : requiredValues.some(matcher)
}

export function hasPermission(
  permissions: string[],
  required?: PermissionRequirement,
  mode: PermissionCheckMode = 'some',
): boolean {
  return matchValues(permissions, required, mode)
}

export function hasRole(
  roles: string[],
  required?: PermissionRequirement,
  mode: PermissionCheckMode = 'some',
): boolean {
  return matchValues(roles, required, mode)
}
