import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

const require = createRequire(import.meta.url)
const environment = new JSDOM()
const frames = new Map()
let sequence = 0

// 只使用 Node DOM 环境检查已发布入口，不启动浏览器或应用服务。
globalThis.DOMParser = environment.window.DOMParser
globalThis.matchMedia = environment.window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
})
globalThis.requestAnimationFrame = (callback) => {
  frames.set(++sequence, callback)
  return sequence
}
globalThis.cancelAnimationFrame = id => frames.delete(id)

try {
  for (const format of ['js', 'cjs']) {
    const iconsUrl = new URL(`../packages/icons/dist/index.${format}`, import.meta.url)
    const morphUrl = new URL(`../packages/icons/dist/morph.${format}`, import.meta.url)
    const vueUrl = new URL(`../packages/icons-vue/dist/index.${format}`, import.meta.url)
    const icons = format === 'cjs' ? require(fileURLToPath(iconsUrl)) : await import(iconsUrl.href)
    const morph = format === 'cjs' ? require(fileURLToPath(morphUrl)) : await import(morphUrl.href)
    const binding = format === 'cjs' ? require(fileURLToPath(vueUrl)) : await import(vueUrl.href)
    const source = icons.resolveIconDefinition('lumal:sidebar-collapse')
    assert.equal(source.source, 'local-svg')
    assert.match(icons.getIconDataUri(source.key), /^data:image\/svg\+xml/)

    // SSR 始终输出原 SVG；CJS 也不能同步 require 仅 ESM 的动画引擎。
    const html = await renderToString(createSSRApp({
      render: () => h(binding.LumalIcon, { name: source.key, morph: true }),
    }))
    assert.match(html, /<rect /)

    const host = environment.window.document.createElement('span')
    const controller = morph.createIconMorph(host, source, { size: 20 })
    assert.ok(host.querySelector('rect'))
    try {
      assert.equal(await controller.ready, true)
      const path = host.querySelector('path')
      const initial = path.getAttribute('d')
      assert.equal(frames.size, 0)
      assert.equal(await controller.update('lumal:sidebar-expand'), true)
      for (let tick = 0; tick < 300 && frames.size; tick++) {
        const callbacks = [...frames.values()]
        frames.clear()
        callbacks.forEach(callback => callback(tick * 16))
      }
      assert.equal(frames.size, 0)
      assert.equal(host.querySelector('path'), path)
      assert.notEqual(path.getAttribute('d'), initial)
      assert.equal(path.getAttribute('d'), (await morph.prepareIconMorph('lumal:sidebar-expand')).d)
    }
    finally {
      controller.destroy()
    }
  }
  console.log('图标 ESM/CJS 消费通过：静态资源、Vue SSR、通用 DOM 动态加载与形变终态。')
}
finally {
  environment.window.close()
}
