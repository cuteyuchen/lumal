/**
 * 文档站导航元数据：既驱动侧边栏分组，也是路由表的数据源。
 * order 字段保持与 DataV guide 相近的分组顺序（引导 → 边框 → 装饰 → 图表 → 其它）。
 */

export interface GuideNavItem {
  /** 路由 path 片段，同时作为组件 key。 */
  slug: string
  /** 侧边栏与页面标题。 */
  title: string
  /** 对应的 @luma/datav 组件名，引导页为 undefined。 */
  component?: string
  /** 侧边栏副标题，一句话说明。 */
  summary: string
}

export interface GuideNavGroup {
  key: string
  label: string
  items: GuideNavItem[]
}

export const navGroups: GuideNavGroup[] = [
  {
    key: 'guide',
    label: '指南',
    items: [
      { slug: 'introduction', title: '介绍', summary: '组件包定位与两套 API' },
      { slug: 'installation', title: '安装与注册', summary: '安装、全局与按需注册' },
      { slug: 'theming', title: '主题变量', summary: 'CSS 变量与深浅色映射' },
      { slug: 'embedding', title: '嵌入 Admin', summary: '以外链形式接入后台菜单' },
    ],
  },
  {
    key: 'border',
    label: '边框',
    items: [
      { slug: 'border-box', title: 'BorderBox 边框', component: 'LumaBorderBox', summary: '13 种科技感边框容器' },
    ],
  },
  {
    key: 'decoration',
    label: '装饰',
    items: [
      { slug: 'decoration', title: 'Decoration 装饰', component: 'LumaDecoration', summary: '12 种氛围装饰件' },
    ],
  },
  {
    key: 'digital',
    label: '数字与占比',
    items: [
      { slug: 'digital-flop', title: 'DigitalFlop 数字翻牌', component: 'LumaDigitalFlop', summary: '数字滚动动画' },
      { slug: 'percent-pond', title: 'PercentPond 占比池', component: 'LumaPercentPond', summary: '百分比进度池' },
      { slug: 'water-level-pond', title: 'WaterLevelPond 水位球', component: 'LumaWaterLevelPond', summary: 'SVG 波浪水位' },
    ],
  },
  {
    key: 'chart',
    label: '图表',
    items: [
      { slug: 'charts', title: 'Charts 原生 ECharts', component: 'LumaCharts', summary: '完整 EChartsOption 封装' },
      { slug: 'active-ring-chart', title: 'ActiveRingChart 活动环图', component: 'LumaActiveRingChart', summary: '自动轮播的活动扇区' },
      { slug: 'capsule-chart', title: 'CapsuleChart 胶囊图', component: 'LumaCapsuleChart', summary: '横向胶囊排行' },
      { slug: 'conical-column-chart', title: 'ConicalColumnChart 锥形柱图', component: 'LumaConicalColumnChart', summary: '锥形柱状对比' },
    ],
  },
  {
    key: 'flyline',
    label: '飞线',
    items: [
      { slug: 'flyline-chart', title: 'FlylineChart 飞线图', component: 'LumaFlylineChart', summary: '中心辐射飞线' },
      { slug: 'flyline-chart-enhanced', title: 'FlylineChartEnhanced 增强飞线', component: 'LumaFlylineChartEnhanced', summary: '任意起止点飞线' },
    ],
  },
  {
    key: 'board',
    label: '轮播表',
    items: [
      { slug: 'scroll-board', title: 'ScrollBoard 轮播表', component: 'LumaScrollBoard', summary: '表格行轮播' },
      { slug: 'scroll-ranking-board', title: 'ScrollRankingBoard 排名轮播', component: 'LumaScrollRankingBoard', summary: '排名条轮播' },
    ],
  },
  {
    key: 'container',
    label: '容器与状态',
    items: [
      { slug: 'full-screen-container', title: 'FullScreenContainer 全屏容器', component: 'LumaFullScreenContainer', summary: '等比缩放全屏适配' },
      { slug: 'loading', title: 'Loading 加载', component: 'LumaLoading', summary: '加载动画与状态' },
    ],
  },
]

export const flatNavItems: GuideNavItem[] = navGroups.flatMap(group => group.items)
