let borderBoxInstance = 0

export function createBorderBoxInstanceId(vueId: string): string {
  borderBoxInstance += 1
  return `luma-border-box-${vueId.replace(/[^\w-]/g, '')}-${borderBoxInstance}`
}
