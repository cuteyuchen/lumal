/***********************浏览器下载*********************/
/**
 * 触发浏览器下载一个 Blob。仅在浏览器环境可用。
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 把文本或二进制内容包装为 Blob 后下载。
 */
export function downloadFile(
  content: BlobPart,
  filename: string,
  mimeType = 'application/octet-stream',
): void {
  downloadBlob(new Blob([content], { type: `${mimeType};charset=utf-8` }), filename)
}
