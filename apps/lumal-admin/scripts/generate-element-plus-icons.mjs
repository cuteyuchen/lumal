import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import * as icons from '@element-plus/icons-vue'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

// 仅在资源生成时使用官方 Vue 组件；Admin 运行时读取可信 SVG，不打包完整组件库。
const entries = await Promise.all(Object.entries(icons).map(async ([name, component]) => [
  name,
  await renderToString(createSSRApp({ render: () => h(component) })),
]))
const destination = new URL('../src/icons/element-plus-icons.json', import.meta.url)
await writeFile(destination, `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`)
// 衍生资源随应用发布时一并保留官方 MIT 许可。
await mkdir(new URL('../public/', import.meta.url), { recursive: true })
await copyFile(
  new URL('../node_modules/@element-plus/icons-vue/LICENSE', import.meta.url),
  new URL('../public/element-plus-icons-LICENSE.txt', import.meta.url),
)
console.log(`已生成 ${entries.length} 个 Element Plus SVG 图标。`)
