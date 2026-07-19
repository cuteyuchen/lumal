/**
 * 站点、演示与包外链。环境变量可覆盖默认线上地址。
 *
 * - LUMAL_DOCS_URL        文档站点根地址
 * - LUMAL_ADMIN_DEMO_URL  Admin 演示
 * - LUMAL_COCKPIT_DEMO_URL 驾驶舱演示
 * - LUMAL_DATAV_GUIDE_URL DataV 指南
 * - LUMAL_GITHUB_URL      仓库地址
 * - LUMAL_NPM_SCOPE_URL   npm scope 页
 */
function env(name: string, fallback: string): string {
  return process.env[name] || fallback
}

export const siteLinks = {
  docs: env('LUMAL_DOCS_URL', 'https://lumal-docs-cf.pages.dev'),
  adminDemo: env('LUMAL_ADMIN_DEMO_URL', 'https://lumal-admin-demo.vercel.app'),
  cockpitDemo: env('LUMAL_COCKPIT_DEMO_URL', 'https://lumal-cockpit-demo.vercel.app'),
  datavGuide: env('LUMAL_DATAV_GUIDE_URL', 'https://lumal-datav-guide.vercel.app'),
  github: env('LUMAL_GITHUB_URL', 'https://github.com/cuteyuchen/lumal'),
  npmScope: env('LUMAL_NPM_SCOPE_URL', 'https://www.npmjs.com/org/lumal'),
  editPattern: env(
    'LUMAL_DOCS_EDIT_PATTERN',
    'https://github.com/cuteyuchen/lumal/edit/master/apps/lumal-docs/src/:path',
  ),
}

/** 各发布包的文档页与 npm 地址。 */
export const packageLinks = {
  core: {
    name: '@lumal/core',
    path: 'packages/core',
    docs: '/packages/core',
    npm: env('LUMAL_NPM_CORE', 'https://www.npmjs.com/package/@lumal/core'),
  },
  icons: {
    name: '@lumal/icons',
    path: 'packages/icons',
    docs: '/packages/icons',
    npm: env('LUMAL_NPM_ICONS', 'https://www.npmjs.com/package/@lumal/icons'),
  },
  iconsVue: {
    name: '@lumal/icons-vue',
    path: 'packages/icons-vue',
    docs: '/packages/icons-vue',
    npm: env('LUMAL_NPM_ICONS_VUE', 'https://www.npmjs.com/package/@lumal/icons-vue'),
  },
  charts: {
    name: '@lumal/charts',
    path: 'packages/charts',
    docs: '/packages/charts',
    npm: env('LUMAL_NPM_CHARTS', 'https://www.npmjs.com/package/@lumal/charts'),
  },
  datav: {
    name: '@lumal/datav',
    path: 'packages/datav',
    docs: '/packages/datav',
    npm: env('LUMAL_NPM_DATAV', 'https://www.npmjs.com/package/@lumal/datav'),
  },
  cockpit: {
    name: '@lumal/cockpit',
    path: 'packages/cockpit',
    docs: '/packages/cockpit',
    npm: env('LUMAL_NPM_COCKPIT', 'https://www.npmjs.com/package/@lumal/cockpit'),
  },
  vite: {
    name: '@lumal/vite',
    path: 'packages/vite',
    docs: '/packages/vite',
    npm: env('LUMAL_NPM_VITE', 'https://www.npmjs.com/package/@lumal/vite'),
  },
  vbenCompat: {
    name: '@lumal/vben-compat',
    path: 'packages/vben-compat',
    docs: '/packages/vben-compat',
    npm: env('LUMAL_NPM_VBEN_COMPAT', 'https://www.npmjs.com/package/@lumal/vben-compat'),
  },
  createLumalAdmin: {
    name: 'create-lumal-admin',
    path: 'packages/create-lumal-admin',
    docs: '/packages/create-lumal-admin',
    npm: env('LUMAL_NPM_CREATE', 'https://www.npmjs.com/package/create-lumal-admin'),
  },
} as const
