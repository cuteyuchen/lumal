export interface LumaComponentResolverResult {
  from: string
  name: string
  sideEffects?: string
}

export interface LumaComponentResolver {
  type: 'component'
  resolve: (name: string) => LumaComponentResolverResult | undefined
}

export interface CreateLumaComponentResolverOptions {
  customComponents?: Record<string, string>
  importStyle?: boolean
}

const COMPONENT_PACKAGES = new Map<string, string>([
  ['LumaChart', '@luma/charts'],
  ['LumaChartPanel', '@luma/charts'],
  ['LumaContent', '@luma/core/layout'],
  ['LumaCrudTable', '@luma/core/components'],
  ['LumaHeader', '@luma/core/layout'],
  ['LumaIcon', '@luma/icons'],
  ['LumaIconPicker', '@luma/icons'],
  ['LumaIconPickerDialog', '@luma/icons'],
  ['LumaInfoTable', '@luma/core/components'],
  ['LumaLayout', '@luma/core/layout'],
  ['LumaPage', '@luma/core/components'],
  ['LumaPageLayout', '@luma/core/components'],
  ['LumaPagination', '@luma/core/components'],
  ['LumaRouterView', '@luma/core/layout'],
  ['LumaSchemaForm', '@luma/core/components'],
  ['LumaSchemaTable', '@luma/core/components'],
  ['LumaSidebar', '@luma/core/layout'],
  ['LumaTabs', '@luma/core/layout'],
  ['LumaTopNav', '@luma/core/layout'],
])

function resolveStyle(packageName: string): string | undefined {
  if (packageName.startsWith('@luma/core')) {
    return '@luma/core/style.css'
  }
  if (packageName === '@luma/icons' || packageName === '@luma/charts') {
    return `${packageName}/style.css`
  }

  return undefined
}

export function createLumaComponentResolver(
  options: CreateLumaComponentResolverOptions = {},
): LumaComponentResolver {
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
