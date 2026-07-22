import { resolve } from 'node:path'

export type LumalAliasTarget = 'dist' | 'source'
export type LumalAliasPackage = 'charts' | 'cockpit' | 'core' | 'datav' | 'icons' | 'icons-vue' | 'vben-compat'

export interface LumalAliasEntry {
  find: string
  replacement: string
}

export interface CreateLumalAliasesOptions {
  packages?: LumalAliasPackage[]
  target?: LumalAliasTarget
  workspaceRoot: string
}

interface PackageEntry {
  packageName: LumalAliasPackage
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
      specifier: `@lumal/core/${name}`,
    })),
  {
    dist: 'packages/core/dist/core.css',
    packageName: 'core',
    source: 'packages/core/src/source-style.css',
    specifier: '@lumal/core/style.css',
  },
  {
    dist: 'packages/core/theme-chalk/index.scss',
    packageName: 'core',
    source: 'packages/core/theme-chalk/index.scss',
    specifier: '@lumal/core/theme-chalk/index.scss',
  },
  {
    dist: 'packages/icons/dist/vite.js',
    packageName: 'icons',
    source: 'packages/icons/src/vite/index.ts',
    specifier: '@lumal/icons/vite',
  },
  {
    dist: 'packages/icons-vue/dist/icons-vue.css',
    packageName: 'icons-vue',
    source: 'packages/icons-vue/src/source-style.css',
    specifier: '@lumal/icons-vue/style.css',
  },
  {
    dist: 'packages/charts/dist/charts.css',
    packageName: 'charts',
    source: 'packages/charts/src/source-style.css',
    specifier: '@lumal/charts/style.css',
  },
  {
    dist: 'packages/datav/dist/datav.css',
    packageName: 'datav',
    source: 'packages/datav/src/source-style.css',
    specifier: '@lumal/datav/style.css',
  },
  {
    dist: 'packages/cockpit/dist/designer.js',
    packageName: 'cockpit',
    source: 'packages/cockpit/src/designer/index.ts',
    specifier: '@lumal/cockpit/designer',
  },
  {
    dist: 'packages/cockpit/dist/registry.js',
    packageName: 'cockpit',
    source: 'packages/cockpit/src/registry/index.ts',
    specifier: '@lumal/cockpit/registry',
  },
  {
    dist: 'packages/cockpit/dist/runtime.js',
    packageName: 'cockpit',
    source: 'packages/cockpit/src/runtime/index.ts',
    specifier: '@lumal/cockpit/runtime',
  },
  {
    dist: 'packages/cockpit/dist/cockpit.css',
    packageName: 'cockpit',
    source: 'packages/cockpit/src/source-style.scss',
    specifier: '@lumal/cockpit/style.css',
  },
  {
    dist: 'packages/vben-compat/dist/index.js',
    packageName: 'vben-compat',
    source: 'packages/vben-compat/src/index.ts',
    specifier: '@lumal/vben-compat',
  },
  {
    dist: 'packages/charts/dist/index.js',
    packageName: 'charts',
    source: 'packages/charts/src/index.ts',
    specifier: '@lumal/charts',
  },
  {
    dist: 'packages/datav/dist/index.js',
    packageName: 'datav',
    source: 'packages/datav/src/index.ts',
    specifier: '@lumal/datav',
  },
  {
    dist: 'packages/icons/dist/index.js',
    packageName: 'icons',
    source: 'packages/icons/src/index.ts',
    specifier: '@lumal/icons',
  },
  {
    dist: 'packages/icons-vue/dist/index.js',
    packageName: 'icons-vue',
    source: 'packages/icons-vue/src/index.ts',
    specifier: '@lumal/icons-vue',
  },
  {
    dist: 'packages/core/dist/index.js',
    packageName: 'core',
    source: 'packages/core/src/index.ts',
    specifier: '@lumal/core',
  },
  {
    dist: 'packages/cockpit/dist/index.js',
    packageName: 'cockpit',
    source: 'packages/cockpit/src/index.ts',
    specifier: '@lumal/cockpit',
  },
]

export function createLumalAliases(options: CreateLumalAliasesOptions): LumalAliasEntry[] {
  const target = options.target ?? 'source'
  const includedPackages = new Set(options.packages ?? ['charts', 'cockpit', 'core', 'datav', 'icons', 'icons-vue', 'vben-compat'])

  return PACKAGE_ENTRIES
    .filter(entry => includedPackages.has(entry.packageName))
    .map(entry => ({
      find: entry.specifier,
      replacement: resolve(options.workspaceRoot, entry[target]),
    }))
    .sort((left, right) => right.find.length - left.find.length)
}
