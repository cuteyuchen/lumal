import type { IconGradientOptions, IconGradientStop } from '../types'

const CURRENT_COLOR_PATTERN = /currentColor/g
const SVG_ATTRIBUTE_COLOR_PATTERN = /(?:fill|stroke)=["']([^"']+)["']/gi

export interface SvgValidationResult {
  reason?: string
  valid: boolean
}

export function validateMonochromeSvg(svgText: string): SvgValidationResult {
  if (!/^\s*<svg\b[\s\S]*<\/svg>\s*$/i.test(svgText)) {
    return { reason: '内容不是完整 SVG', valid: false }
  }

  if (/<script\b|\bon\w+\s*=|(?:href|src)=["']https?:/i.test(svgText)) {
    return { reason: 'SVG 包含不安全的脚本或外部资源', valid: false }
  }

  for (const match of svgText.matchAll(SVG_ATTRIBUTE_COLOR_PATTERN)) {
    const color = match[1]?.trim()
    if (color && !['currentColor', 'inherit', 'none'].includes(color) && !color.startsWith('url(#')) {
      return { reason: `检测到固定颜色 ${color}`, valid: false }
    }
  }

  return { valid: true }
}

export function composeSvgIcons(svgTexts: string[]): string {
  const validIcons = svgTexts.filter(svg => validateMonochromeSvg(svg).valid)
  if (validIcons.length === 0) {
    return ''
  }

  const firstAttributes = validIcons[0]!.match(/<svg\b([^>]*)>/i)?.[1]?.trim()
  const layers = validIcons.map((svg, index) => {
    const content = svg.replace(/^\s*<svg\b[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
    return `<g data-lumal-icon-layer="${index}">${content}</g>`
  }).join('')

  return `<svg${firstAttributes ? ` ${firstAttributes}` : ''}>${layers}</svg>`
}

/***********************SVG 编码*********************/
export function svgToDataUri(svgText: string): string {
  // HTML 内联 SVG 可省略命名空间，作为独立图片或下载文件时必须声明。
  const standaloneSvg = svgText.replace(/<svg\b[^>]*>/i, tag => (
    /\sxmlns\s*=/.test(tag) ? tag : tag.replace(/<svg\b/i, '$& xmlns="http://www.w3.org/2000/svg"')
  ))

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(standaloneSvg)}`
}

/***********************SVG 改色*********************/
export function recolorSvgString(svgText: string, color = 'currentColor'): string {
  return svgText.replace(CURRENT_COLOR_PATTERN, color)
}

/***********************SVG 渐变*********************/
function resolveGradientStops(options: IconGradientOptions): IconGradientStop[] {
  if (options.stops?.length) {
    return options.stops
  }

  return [
    { offset: '0%', color: options.from ?? 'currentColor' },
    { offset: '100%', color: options.to ?? options.from ?? 'currentColor' },
  ]
}

function createGradientMarkup(options: Required<Pick<IconGradientOptions, 'id'>> & IconGradientOptions): string {
  const isVertical = options.direction === 'vertical'
  const stops = resolveGradientStops(options)
    .map((stop) => {
      const opacity = stop.opacity == null ? '' : ` stop-opacity="${stop.opacity}"`
      return `<stop offset="${stop.offset}" stop-color="${stop.color}"${opacity}/>`
    })
    .join('')

  return `<defs><linearGradient id="${options.id}" x1="0%" y1="0%" x2="${isVertical ? '0%' : '100%'}" y2="${isVertical ? '100%' : '0%'}">${stops}</linearGradient></defs>`
}

export function applySvgGradient(svgText: string, options: IconGradientOptions): string {
  const gradientId = options.id ?? 'lumal-icon-gradient'
  const gradientMarkup = createGradientMarkup({ ...options, id: gradientId })
  const svgWithDefs = svgText.replace(/<svg([^>]*)>/, `<svg$1>${gradientMarkup}`)

  return svgWithDefs.replace(CURRENT_COLOR_PATTERN, `url(#${gradientId})`)
}
