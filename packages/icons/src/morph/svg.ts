interface SvgPaint {
  fill: string
  stroke: string
  width: number
  linecap: string
  linejoin: string
}

export interface MorphSvg {
  svgText: string
  color: string
  filled: boolean
  strokeWidth: number
  linecap: string
  linejoin: string
}

const geometryTags = new Set(['path', 'line', 'circle', 'ellipse', 'rect', 'polyline', 'polygon'])
const numericAttributes = new Set(['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height'])
const allowedAttributes = new Set([
  'xmlns',
  'viewBox',
  'width',
  'height',
  'version',
  'id',
  'role',
  'focusable',
  'preserveAspectRatio',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'fill-rule',
  'd',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'points',
])

/** 仅判定官方单路径渲染器能否保真转换，不承担 SVG 安全净化。 */
export function readMorphSvg(svgText: string): MorphSvg | undefined {
  if (typeof DOMParser === 'undefined')
    return undefined
  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = document.documentElement
  if (root.localName !== 'svg' || document.querySelector('parsererror'))
    return undefined
  const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
  if (!viewBox || viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2]! <= 0 || viewBox[3]! <= 0)
    return undefined
  const aspect = root.getAttribute('preserveAspectRatio')
  if (aspect && aspect.trim() !== 'xMidYMid meet' && aspect.trim() !== 'xMidYMid')
    return undefined

  const colors = new Set<string>()
  const strokes: SvgPaint[] = []
  let filled = false
  let geometryCount = 0
  function visit(element: Element, parent: SvgPaint): boolean {
    const tag = element.localName
    if (!geometryTags.has(tag) && !['svg', 'g', 'title', 'desc'].includes(tag))
      return false
    if (tag === 'svg' && element !== root)
      return false
    // 样式、变换、透明度、虚线和引用均交还静态渲染，防止细节在转换中丢失。
    if ([...element.attributes].some(attribute => !allowedAttributes.has(attribute.name) && !/^(?:aria-|data-)/.test(attribute.name)))
      return false
    if (tag === 'title' || tag === 'desc')
      return element.children.length === 0
    const paint = { ...parent }
    for (const key of ['fill', 'stroke'] as const) {
      const value = element.getAttribute(key)?.trim()
      if (value && value !== 'inherit')
        paint[key] = value
    }
    if (element.hasAttribute('stroke-width'))
      paint.width = Number(element.getAttribute('stroke-width'))
    paint.linecap = element.getAttribute('stroke-linecap') ?? parent.linecap
    paint.linejoin = element.getAttribute('stroke-linejoin') ?? parent.linejoin
    if (!Number.isFinite(paint.width) || paint.width <= 0)
      return false
    if (geometryTags.has(tag)) {
      geometryCount++
      if ([...element.attributes].some(attribute => numericAttributes.has(attribute.name) && !Number.isFinite(Number(attribute.value))))
        return false
      for (const key of ['fill', 'stroke'] as const) {
        if (paint[key] === 'none')
          continue
        if (/url\s*\(/i.test(paint[key]))
          return false
        colors.add(paint[key])
      }
      if (paint.fill !== 'none')
        filled = true
      if (paint.stroke !== 'none')
        strokes.push(paint)
      if (paint.fill === 'none' && paint.stroke === 'none')
        return false
      // 显式传递 SVG 默认值和继承值，避免适配器把未声明 fill 的图形误判为纯描边。
      element.setAttribute('fill', paint.fill)
      element.setAttribute('stroke', paint.stroke)
    }
    return [...element.children].every(child => visit(child, paint))
  }
  if (!visit(root, { fill: 'black', stroke: 'none', width: 1, linecap: 'butt', linejoin: 'miter' })
    || !geometryCount || colors.size !== 1) {
    return undefined
  }
  const stroke = strokes[0]
  if (strokes.some(paint => paint.width !== stroke!.width || paint.linecap !== stroke!.linecap || paint.linejoin !== stroke!.linejoin))
    return undefined
  // 填充归一化按圆角轮廓描边；非圆角的混合图形不能无损转换。
  if (filled && strokes.some(paint => paint.linecap !== 'round' || paint.linejoin !== 'round'))
    return undefined
  return {
    svgText: root.outerHTML,
    filled,
    color: [...colors][0]!,
    strokeWidth: (stroke?.width ?? 2) * Math.min(24 / viewBox[2]!, 24 / viewBox[3]!),
    linecap: stroke?.linecap ?? 'round',
    linejoin: stroke?.linejoin ?? 'round',
  }
}
