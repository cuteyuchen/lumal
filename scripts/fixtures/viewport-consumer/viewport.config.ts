export const design = { designWidth: 1920, designHeight: 1080 } as const

// 构建转换与运行时画布共享设计尺寸，但使用不同文件范围承担缩放责任。
export const viewportPolicy = { ...design, mode: 'contain', minFontSize: 12 } as const
