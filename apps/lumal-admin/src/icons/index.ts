import type { IconDefinition } from '@lumal/icons'
import { addIcon } from '@iconify/vue'
import { createComponentIconDefinitions, createIconifyIconDefinitions, getIconSvgText, registerIconGroups, registerIcons } from '@lumal/icons'
import AdminBrandIcon from './AdminBrandIcon.vue'
import { iconifyIcons } from './iconify-icons'

/***********************本地图标清单*********************/
// 应用图标集中维护；页面、菜单和选择器使用相同的注册名称。
export const localIcons: IconDefinition[] = [
  {
    key: 'app:dashboard',
    label: '控制台',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/></svg>',
  },
  {
    key: 'app:examples',
    label: '示例',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"/></svg>',
  },
  {
    key: 'app:system',
    label: '系统',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v4H4V4Zm0 6h7v10H4V10Zm9 0h7v4h-7v-4Zm0 6h7v4h-7v-4Z"/></svg>',
  },
  {
    key: 'app:user',
    label: '用户',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0H4Z"/></svg>',
  },
  {
    key: 'app:role',
    label: '角色',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 5a3 3 0 0 1 1.2 5.75A5.5 5.5 0 0 1 17.2 17H6.8a5.5 5.5 0 0 1 4-4.25A3 3 0 0 1 12 7Z"/></svg>',
  },
  {
    key: 'app:menu',
    label: '菜单',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 5h16v2H4V5Zm0 6h16v2H4v-2Zm0 6h10v2H4v-2Z"/></svg>',
  },
  {
    key: 'app:organization',
    label: '机构',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 3h4v4h-4V3ZM4 17h4v4H4v-4Zm12 0h4v4h-4v-4ZM5 9h6v3H7v3H5V9Zm8 0h6v6h-2v-3h-4V9Zm-2-1h2v10h-2V8Z"/></svg>',
  },
  {
    key: 'app:dict',
    label: '字典',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h11a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3V4a1 1 0 0 1 1-1Zm2 14a1 1 0 0 0 0 2h10v-2H7Zm1-10h7V5H8v2Zm0 4h7V9H8v2Z"/></svg>',
  },
  {
    key: 'app:form',
    label: '表单',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 5h10V6H7v2Zm0 5h10v-2H7v2Zm0 5h6v-2H7v2Z"/></svg>',
  },
  {
    key: 'app:table',
    label: '表格',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14H4V5Zm2 4h4V5H6v4Zm6 0h6V5h-6v4Zm-6 4h4v-2H6v2Zm6 0h6v-2h-6v2Zm-6 4h4v-2H6v2Zm6 0h6v-2h-6v2Z"/></svg>',
  },
  {
    key: 'app:theme',
    label: '主题',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 0 0 0 18h1.5a2.5 2.5 0 0 0 1.8-4.24l-.43-.44a1.2 1.2 0 0 1 .86-2.02H17a4 4 0 0 0 3.74-5.43A9.02 9.02 0 0 0 12 3Zm-4 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm4-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm-4 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg>',
  },
  {
    key: 'app:settings',
    label: '设置',
    source: 'local-svg',
    // 保留菜单注册名称，复用修正后的内置齿轮，避免维护两套设置图标。
    svgText: getIconSvgText('lumal:settings'),
  },
  {
    key: 'app:logout',
    label: '退出登录',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3h9Zm3-10H9a2 2 0 0 0-2 2v2h2V5h10v14H9v-2H7v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/></svg>',
  },
  {
    key: 'app:chart',
    label: '图表',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h2v16h14v2H5a2 2 0 0 1-2-2V3h2Zm5 13H8V9h2v7Zm4 0h-2V5h2v11Zm4 0h-2v-5h2v5Z"/></svg>',
  },
  {
    key: 'app:cockpit',
    label: '驾驶舱',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 1.5 5l1.6-1.1A7 7 0 0 1 5 12a7 7 0 0 1 14 0 7 7 0 0 1-1.1 3.9l1.6 1.1A9 9 0 0 0 21 12a9 9 0 0 0-9-9Zm0 5a1.5 1.5 0 0 0-1.5 1.5c0 .4.16.77.42 1.04l-1.3 3.2 3.02-1.86A1.5 1.5 0 0 0 12 8Z"/></svg>',
  },
].map((icon): IconDefinition => ({ ...icon, group: 'app', source: 'local-svg' }))

/***********************扩展来源注册*********************/
export function registerAdminIcons(): void {
  registerIconGroups([
    { key: 'lumal', label: 'Lumal 内置', order: 1 },
    { key: 'app', label: '应用 SVG', order: 2 },
    { key: 'iconify', label: 'Iconify', order: 3 },
    { key: 'element-plus', label: 'Element Plus', order: 4 },
    { key: 'component', label: 'Vue 组件', order: 5 },
  ])

  // 仅预置示例子集，演示和菜单选择不请求远程图标，也不打包完整图标集。
  const iconifyDefinitions = iconifyIcons.map(({ name, label, body }) => {
    addIcon(name, { body, width: 24, height: 24 })
    return { ...createIconifyIconDefinitions('iconify', [name])[0]!, label }
  })
  registerIcons([
    ...iconifyDefinitions,
    ...createComponentIconDefinitions('component', { brand: AdminBrandIcon }).map(icon => ({ ...icon, label: 'Lumal 品牌' })),
  ])
}

/***********************Element Plus 资源按需注册*********************/
let elementPlusIconsTask: Promise<void> | undefined

export function registerAdminElementPlusIcons(): Promise<void> {
  // 仅在打开选择器或实际菜单使用该分组时加载，避免图标全集进入登录首屏。
  elementPlusIconsTask ??= import('./element-plus-icons.json').then(({ default: icons }) => {
    registerIcons(Object.entries(icons).map(([name, svgText]): IconDefinition => ({
      key: `element-plus:${name}`,
      label: name,
      group: 'element-plus',
      source: 'local-svg',
      svgText,
    })))
  }).catch((error: unknown) => {
    elementPlusIconsTask = undefined
    throw error
  })
  return elementPlusIconsTask
}
