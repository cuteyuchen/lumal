import process from 'node:process'
import { pathToFileURL } from 'node:url'

const required = {
  npm: ['NPM_TOKEN'],
  vercel: ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'],
  cloudflare: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CF_PAGES_PROJECT'],
}
required.production = [
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID_ADMIN',
  'VERCEL_PROJECT_ID_COCKPIT',
  'VERCEL_PROJECT_ID_DATAV_GUIDE',
  'VERCEL_PROJECT_ID_VBEN_COMPAT',
  ...required.cloudflare,
]

/** 只输出缺失的配置名称，不输出值或整个环境。 */
export function verifyReleaseEnv(target, env = process.env) {
  if (!required[target])
    throw new Error(`未知部署目标：${target}`)
  const missing = required[target].filter(name => !env[name]?.trim())
  if (missing.length)
    throw new Error(`缺少 ${target} 发布配置：${missing.join(', ')}。请在 GitHub Actions Secrets/Variables 配置后重试`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyReleaseEnv(process.argv[2])
  console.log(`${process.argv[2]} 发布配置预检通过（未访问平台，未验证权限）`)
}
