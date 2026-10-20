import { describe, expect, it } from 'vitest'
import {
  applySvgGradient,
  clearIconDataUriCache,
  composeSvgIcons,
  getGradientIconDataUri,
  getIconDataUri,
  recolorSvgString,
  registerIcons,
  svgToDataUri,
  validateMonochromeSvg,
} from '../src'

describe('@lumal/icons runtime', () => {
  const svgText = '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M2 2h12v12H2z"/></svg>'

  it('可以把 SVG 文本转换成 data URI', () => {
    expect(svgToDataUri(svgText)).toContain('data:image/svg+xml')
  })

  it.each([
    svgText,
    svgText.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'),
    svgText.replace('<svg', '<svg xmlns = \'http://www.w3.org/2000/svg\''),
    svgText.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'),
    '<svg viewBox="0 0 16 16"><svg xmlns="http://www.w3.org/2000/svg"><path /></svg></svg>',
  ])('独立 SVG 图片的 Data URI 保留且仅设置一个根命名空间：%s', (source) => {
    const uri = svgToDataUri(source)
    const decoded = decodeURIComponent(uri.slice(uri.indexOf(',') + 1))
    const svgDocument = new DOMParser().parseFromString(decoded, 'image/svg+xml')

    expect(svgDocument.querySelector('parsererror')).toBeNull()
    expect(svgDocument.documentElement.namespaceURI).toBe('http://www.w3.org/2000/svg')
    expect(svgDocument.documentElement.getAttribute('viewBox')).toBe('0 0 16 16')
    expect(svgDocument.querySelector('path')?.namespaceURI).toBe('http://www.w3.org/2000/svg')
  })

  it('编码 Data URI 时保留颜色、中文和特殊字符', () => {
    const source = '<svg><title>图标 #1 &amp; 100%</title><path fill="#1677ff"/></svg>'
    const uri = svgToDataUri(source)
    const decoded = decodeURIComponent(uri.slice(uri.indexOf(',') + 1))
    const svgDocument = new DOMParser().parseFromString(decoded, 'image/svg+xml')

    expect(uri).not.toContain('#')
    expect(svgDocument.querySelector('title')?.textContent).toBe('图标 #1 & 100%')
    expect(svgDocument.querySelector('path')?.getAttribute('fill')).toBe('#1677ff')
  })

  it('可以在运行时替换 currentColor', () => {
    expect(recolorSvgString(svgText, '#1677ff')).toContain('#1677ff')
  })

  it('可以在运行时注入渐变定义', () => {
    const result = applySvgGradient(svgText, {
      id: 'lumal-gradient-test',
      from: '#1677ff',
      to: '#52c41a',
    })

    expect(result).toContain('linearGradient')
    expect(result).toContain('url(#lumal-gradient-test)')
  })

  it('可以通过已注册图标生成 data URI', () => {
    registerIcons([
      {
        key: 'app:data-uri',
        label: 'Data URI',
        source: 'local-svg',
        svgText,
      },
    ])

    expect(getIconDataUri('app:data-uri')).toContain('data:image/svg+xml')
    for (const uri of [
      getIconDataUri('app:data-uri', '#1677ff'),
      getGradientIconDataUri('app:data-uri', { from: '#1677ff', to: '#10b981' }),
    ]) {
      const decoded = decodeURIComponent(uri.slice(uri.indexOf(',') + 1))
      expect(new DOMParser().parseFromString(decoded, 'image/svg+xml').documentElement.namespaceURI)
        .toBe('http://www.w3.org/2000/svg')
    }
    clearIconDataUriCache()
    expect(getIconDataUri('app:data-uri')).toContain('data:image/svg+xml')
  })

  it('可以拒绝脚本、外部资源和固定颜色', () => {
    expect(validateMonochromeSvg('<svg><script>alert(1)</script></svg>').valid).toBe(false)
    expect(validateMonochromeSvg('<svg><path fill="#fff" /></svg>')).toEqual({
      reason: '检测到固定颜色 #fff',
      valid: false,
    })
    expect(validateMonochromeSvg('<svg><path fill="currentColor" /></svg>').valid).toBe(true)
  })

  it('可以把多个单色 SVG 合成为分层图标', () => {
    const result = composeSvgIcons([
      svgText,
      '<svg viewBox="0 0 16 16"><circle fill="currentColor" cx="8" cy="8" r="2"/></svg>',
    ])

    expect(result).toContain('<svg viewBox="0 0 16 16">')
    expect(result).toContain('data-lumal-icon-layer="0"')
    expect(result).toContain('data-lumal-icon-layer="1"')
  })
})
