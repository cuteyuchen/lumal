/***********************主题色预设*********************/
export interface ThemeColorPreset {
  label: string
  value: string
  /** 自定义色占位项，选中后应展示取色器。 */
  custom?: boolean
}

/**
 * 主题色预设列表。最后一项为自定义占位，业务可按需裁剪或替换。
 * 不绑定任何业务主题，仅提供通用可选色板。
 */
export const themeColorPresets: ThemeColorPreset[] = [
  { label: '默认蓝', value: '#1677ff' },
  { label: '紫罗兰', value: '#6f59f6' },
  { label: '樱花粉', value: '#ef6b9a' },
  { label: '柠檬黄', value: '#d8b400' },
  { label: '天蓝色', value: '#2aa7ff' },
  { label: '浅绿色', value: '#4dbb74' },
  { label: '锌色灰', value: '#8a94a6' },
  { label: '深绿色', value: '#0f766e' },
  { label: '深蓝色', value: '#1d4ed8' },
  { label: '橙黄色', value: '#f08c00' },
  { label: '玫瑰红', value: '#e11d48' },
  { label: '中性色', value: '#5b6472' },
  { label: '石板灰', value: '#475569' },
  { label: '中灰色', value: '#6b7280' },
  { label: '自定义', value: '__custom__', custom: true },
]
