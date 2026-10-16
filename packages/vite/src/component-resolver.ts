export interface LumalComponentResolverResult {
  from: string
  name: string
  sideEffects?: string
}

export interface LumalComponentResolver {
  type: 'component'
  resolve: (name: string) => LumalComponentResolverResult | undefined
}

export interface CreateLumalComponentResolverOptions {
  customComponents?: Record<string, string>
  importStyle?: boolean
}

const COMPONENT_PACKAGES = new Map<string, string>([
  ['LumalAccessControl', '@lumal/core/permission'],
  ['LumalBreadcrumb', '@lumal/core/layout'],
  ['LumalChart', '@lumal/charts'],
  ['LumalChartPanel', '@lumal/charts'],
  ['LumalContent', '@lumal/core/layout'],
  ['LumalCrudTable', '@lumal/core/components'],
  ['LumalHeader', '@lumal/core/layout'],
  ['LumalGlobalSearch', '@lumal/core/layout'],
  ['LumalIcon', '@lumal/icons-vue'],
  ['LumalIconPicker', '@lumal/icons-vue'],
  ['LumalIconPickerDialog', '@lumal/icons-vue'],
  ['LumalInfoTable', '@lumal/core/components'],
  ['LumalLayout', '@lumal/core/layout'],
  ['LumalPage', '@lumal/core/components'],
  ['LumalPageLayout', '@lumal/core/components'],
  ['LumalPagination', '@lumal/core/components'],
  ['LumalRouterView', '@lumal/core/layout'],
  ['LumalSchemaForm', '@lumal/core/components'],
  ['LumalSchemaTable', '@lumal/core/components'],
  ['LumalSidebar', '@lumal/core/layout'],
  ['LumalTabs', '@lumal/core/layout'],
  ['LumalThemeSettingsPanel', '@lumal/core/theme'],
  ['LumalTopNav', '@lumal/core/layout'],
])

function resolveStyle(packageName: string): string | undefined {
  if (packageName.startsWith('@lumal/core')) {
    return '@lumal/core/style.css'
  }
  if (packageName === '@lumal/icons-vue' || packageName === '@lumal/charts') {
    return `${packageName}/style.css`
  }

  return undefined
}

export function createLumalComponentResolver(
  options: CreateLumalComponentResolverOptions = {},
): LumalComponentResolver {
  const components = new Map(COMPONENT_PACKAGES)

  for (const [name, packageName] of Object.entries(options.customComponents ?? {})) {
    components.set(name, packageName)
  }

  return {
    type: 'component',
    resolve(name) {
      const packageName = components.get(name)
      if (!packageName) {
        return undefined
      }

      return {
        from: packageName,
        name,
        sideEffects: options.importStyle ? resolveStyle(packageName) : undefined,
      }
    },
  }
}
