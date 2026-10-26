/** 同一份设计尺寸可供运行时 policy 与 Vite 的 viewportWidth 使用，不依赖构建或运行时包。 */
export const viewportDesign = {
  designWidth: 1920,
  designHeight: 1080,
} as const;

export const viewportPolicy = {
  ...viewportDesign,
  mode: /* VIEWPORT_MODE */ 'contain',
  minFontSize: 12,
} as const;
