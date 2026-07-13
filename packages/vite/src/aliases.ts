import { resolve } from 'node:path'

export type LumaAliasTarget = 'dist' | 'source'
export type LumaAliasPackage = 'charts' | 'cockpit' | 'core' | 'icons' | 'vben-compat'

export interface LumaAliasEntry {
  find: string
  replacement: string
}

export interface CreateLumaAliasesOptions {
  packages?: LumaAliasPackage[]
  target?: LumaAliasTarget
  workspaceRoot: string
}

interface PackageEntry {
  packageName: LumaAliasPackage
  specifier: string
  source: string
  dist: string
}

const PACKAGE_ENTRIES: PackageEntry[] = [
  ...['auth', 'components', 'composables', 'dictionary', 'directives', 'layout', 'permission', 'request', 'router', 'theme', 'utils']
    .map(name => ({
      dist: `packages/core/dist/${name}.js`,
      packageName: 'core' as const,
      source: name === 'components' ? 'packages/core/src/exports/components.ts' : `packages/core/src/${name}/index.ts`,
      specifier: `@luma/core/${name}`,
    })),
  {
    dist: 'packages/core/dist/core.css',
    packageName: 'core',
    source: 'packages/core/src/source-style.css',
    specifier: '@luma/core/style.css',
  },
  {
    dist: 'packages/core/theme-chalk/index.scss',
    packageName: 'core',
    source: 'packages/core/theme-chalk/index.scss',
    specifier: '@luma/core/theme-chalk/index.scss',
  },
  {
    dist: 'packages/icons/dist/vite.js',
    packageName: 'icons',
    source: 'packages/icons/src/vite/index.ts',
    specifier: '@luma/icons/vite',
  },
  {
    dist: 'packages/icons/dist/icons.css',
    packageName: 'icons',
    source: 'packages/icons/src/source-style.css',
    specifier: '@luma/icons/style.css',
  },
  {
    dist: 'packages/charts/dist/charts.css',
    packageName: 'charts',
    source: 'packages/charts/src/source-style.css',
    specifier: '@luma/charts/style.css',
  },
  {
    dist: 'packages/cockpit/dist/designer.js',
    packageName: 'cockpit',
    source: 'packages/cockpit/src/designer/index.ts',
    specifier: '@luma/cockpit/designer',
  },
  {
    dist: 'packages/cockpit/dist/registry.js',
    packageName: 'cockpit',
    source: 'packages/cockpit/src/registry/index.ts',
    specifier: '@luma/cockpit/registry',
  },
  {
    dist: 'packages/cockpit/dist/runtime.js',
    packageName: 'cockpit',
    source: 'packages/cockpit/src/runtime/index.ts',
    specifier: '@luma/cockpit/runtime',
  },
  {
    dist: 'packages/cockpit/dist/cockpit.css',
    packageName: 'cockpit',
    source: 'packages/cockpit/src/style/index.scss',
    specifier: '@luma/cockpit/style.css',
  },
  {
    dist: 'packages/vben-compat/dist/index.js',
    packageName: 'vben-compat',
    source: 'packages/vben-compat/src/index.ts',
    specifier: '@luma/vben-compat',
  },
  {
    dist: 'packages/charts/dist/index.js',
    packageName: 'charts',
    source: 'packages/charts/src/index.ts',
    specifier: '@luma/charts',
  },
  {
    dist: 'packages/icons/dist/index.js',
    packageName: 'icons',
    source: 'packages/icons/src/index.ts',
    specifier: '@luma/icons',
  },
  {
    dist: 'packages/core/dist/index.js',
    packageName: 'core',
    source: 'packages/core/src/index.ts',
    specifier: '@luma/core',
  },
  {
    dist: 'packages/cockpit/dist/index.js',
    packageName: 'cockpit',
    source: 'packages/cockpit/src/index.ts',
    specifier: '@luma/cockpit',
  },
]

export function createLumaAliases(options: CreateLumaAliasesOptions): LumaAliasEntry[] {
  const target = options.target ?? 'source'
  const includedPackages = new Set(options.packages ?? ['charts', 'cockpit', 'core', 'icons', 'vben-compat'])

  return PACKAGE_ENTRIES
    .filter(entry => includedPackages.has(entry.packageName))
    .map(entry => ({
      find: entry.specifier,
      replacement: resolve(options.workspaceRoot, entry[target]),
    }))
    .sort((left, right) => right.find.length - left.find.length)
}
