import type { IconDefinition } from './types'

function icon(key: string, label: string, body: string): IconDefinition {
  return {
    group: 'luma',
    key: `luma:${key}`,
    label,
    source: 'local-svg',
    svgText: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
  }
}

export const builtinIconDefinitions: IconDefinition[] = [
  icon('sun', '浅色模式', '<circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  icon('moon', '深色模式', '<path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" fill="currentColor"/>'),
  icon('monitor', '跟随系统', '<rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  icon('palette', '主题设置', '<path d="M12 3a9 9 0 0 0 0 18h1.3a2.2 2.2 0 0 0 1.56-3.76l-.38-.38a1.1 1.1 0 0 1 .78-1.86H17a4 4 0 0 0 3.72-5.47A9 9 0 0 0 12 3Z" stroke="currentColor" stroke-width="1.7"/><circle cx="7.5" cy="10" r="1.2" fill="currentColor"/><circle cx="10.5" cy="6.8" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>'),
  icon('settings', '设置', '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" stroke="currentColor" stroke-width="1.8"/><path d="m19.4 15 .1-1-.1-1 2-1.5-2-3.4-2.5 1a8 8 0 0 0-1.7-1L14.8 5h-4l-.4 3.1a8 8 0 0 0-1.7 1l-2.5-1-2 3.4 2 1.5-.1 1 .1 1-2 1.5 2 3.4 2.5-1a8 8 0 0 0 1.7 1l.4 3.1h4l.4-3.1a8 8 0 0 0 1.7-1l2.5 1 2-3.4-2-1.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'),
  icon('reset', '恢复默认', '<path d="M4 7v5h5M5.5 11A7 7 0 1 1 7 18.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  icon('plus', '新增', '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>'),
  icon('filter', '筛选', '<path d="M4 5h16l-6.2 7.1v5.2l-3.6 1.8v-7L4 5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'),
  icon('refresh', '刷新', '<path d="M20 7v5h-5M4 17v-5h5M18.5 11A7 7 0 0 0 6 7.5L4 10M5.5 13A7 7 0 0 0 18 16.5l2-2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  icon('fullscreen', '全屏', '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  icon('fullscreen-exit', '退出全屏', '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  icon('grid', '列设置', '<rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.7"/><rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.7"/>'),
  icon('close', '关闭', '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  icon('chevron-left', '上一页', '<path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
  icon('chevron-right', '下一页', '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
  icon('more', '更多', '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>'),
  icon('pin', '固定', '<path d="M9 4h6l-1 6 4 3v2H6v-2l4-3-1-6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" fill="none"/><path d="M12 14v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'),
  icon('pin-off', '取消固定', '<path d="M9 4h6l-1 6 4 3v2H6v-2l4-3-1-6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" fill="none"/><path d="M12 14v6M4 4l16 16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'),
  icon('external-link', '新窗口打开', '<path d="M14 4h6v6M20 4l-8 8M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
  icon('maximize', '内容最大化', '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M3 12h18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 3" opacity="0.45"/>'),
  icon('restore', '还原', '<path d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M3 16h3a2 2 0 0 1 2 2v3M21 16h-3a2 2 0 0 0-2 2v3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
]
