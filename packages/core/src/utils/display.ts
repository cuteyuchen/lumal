/**
 * 判断可读取文本的二进制响应是否实际包含 JSON 错误信息。
 * 返回 true 表示内容不是 JSON，可按 Blob 文件处理。
 */
export async function isBlobResponse(data: { text: () => Promise<string> }): Promise<boolean> {
  try {
    JSON.parse(await data.text())
    return false
  }
  catch {
    return true
  }
}

/** 手机号展示脱敏：保留前三位与后四位。 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length <= 7) {
    return phone
  }

  return `${phone.slice(0, 3)}${'*'.repeat(Math.min(4, phone.length - 7))}${phone.slice(-4)}`
}
