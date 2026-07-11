import { resolve } from 'node:path'

export type LumaAliasTarget = 'dist' | 'source'
export type LumaAliasPackage = 'charts' | 'core' | 'icons' | 'vben-compat'

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
    dist: 'packages/icons/dist/vite.js',
    packageName: 'icons',
    source: 'packages/icons/src/vite/index.ts',
    specifier: '@luma/icons/vite',
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
]

export function createLumaAliases(options: CreateLumaAliasesOptions): LumaAliasEntry[] {
  const target = options.target ?? 'source'
  const includedPackages = new Set(options.packages ?? ['charts', 'core', 'icons', 'vben-compat'])

  return PACKAGE_ENTRIES
    .filter(entry => includedPackages.has(entry.packageName))
    .map(entry => ({
      find: entry.specifier,
      replacement: resolve(options.workspaceRoot, entry[target]),
    }))
    .sort((left, right) => right.find.length - left.find.length)
}
