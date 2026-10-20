import type { Morph } from 'morphicons/dom'
import type { IconMorphController, IconMorphOptions, IconMorphSource, PreparedIconMorph } from './types'
import { recolorSvgString, resolveAnyIconDefinition } from '../index'
import { loadIconMorphRuntime, prepareIconMorph, resolveMorphSvgText } from './runtime'

/** 接管独立图标容器的子节点；不依赖框架，也不接管按钮等父级业务事件。 */
export function createIconMorph(
  target: HTMLElement,
  initial: IconMorphSource,
  options: IconMorphOptions = {},
): IconMorphController {
  let source = initial
  let settings: IconMorphOptions = { enabled: true, spring: 'smooth', ...options }
  let generation = 0
  let dead = false
  let driver: Morph | undefined
  let svg: SVGSVGElement | undefined
  let current: PreparedIconMorph | undefined
  const media = target.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')

  function disposeDriver(): void {
    driver?.destroy()
    driver = undefined
    svg = undefined
    current = undefined
  }

  function renderStatic(): void {
    target.innerHTML = recolorSvgString(resolveMorphSvgText(source), settings.color)
    const image = target.querySelector('svg')
    if (image) {
      image.style.width = '100%'
      image.style.height = '100%'
      image.style.display = 'block'
    }
  }

  function applyAppearance(): void {
    const size = typeof settings.size === 'number' ? `${settings.size}px` : settings.size ?? '1em'
    target.style.display = 'inline-flex'
    target.style.width = size
    target.style.height = size
    target.style.color = settings.color ?? ''
    target.setAttribute('aria-hidden', 'true')
    const definition = typeof source === 'string' ? resolveAnyIconDefinition(source) : source
    target.title = settings.title ?? definition?.label ?? ''
  }

  function paintAttributes(prepared: PreparedIconMorph): void {
    if (!svg)
      return
    for (const [key, value] of Object.entries({
      'color': prepared.color,
      'stroke': prepared.color,
      'stroke-width': prepared.strokeWidth,
      'stroke-linecap': prepared.linecap,
      'stroke-linejoin': prepared.linejoin,
    })) {
      svg.setAttribute(key, String(value))
    }
  }

  async function update(next: IconMorphSource, nextOptions?: IconMorphOptions): Promise<boolean> {
    if (dead)
      return false
    const version = ++generation
    source = next
    settings = { ...settings, ...nextOptions }
    applyAppearance()
    if (!driver)
      renderStatic()
    if (settings.enabled === false || media?.matches) {
      disposeDriver()
      renderStatic()
      return false
    }
    const prepared = await prepareIconMorph(next)
    if (dead || version !== generation)
      return false
    if (!prepared) {
      disposeDriver()
      renderStatic()
      return false
    }
    try {
      const { dom } = await loadIconMorphRuntime()
      if (dead || version !== generation)
        return false
      if (!driver) {
        svg = target.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('viewBox', '0 0 24 24')
        svg.setAttribute('width', '100%')
        svg.setAttribute('height', '100%')
        svg.setAttribute('fill', 'none')
        const path = target.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'path')
        svg.append(path)
        paintAttributes(prepared)
        driver = dom.createMorph(path, prepared.icon, { reducedMotion: 'user', strokeWidth: prepared.strokeWidth })
        target.replaceChildren(svg)
      }
      else {
        paintAttributes(prepared)
        driver.strokeWidth = prepared.strokeWidth
        if (current?.shape !== prepared.shape)
          driver.morphTo(prepared.icon, settings.spring)
      }
      current = prepared
      return true
    }
    catch {
      disposeDriver()
      renderStatic()
      return false
    }
  }

  function syncMotion(): void {
    void update(source)
  }

  if (typeof media?.addEventListener === 'function')
    media.addEventListener('change', syncMotion)
  else
    media?.addListener?.(syncMotion)

  return {
    ready: update(initial),
    update,
    destroy() {
      if (dead)
        return
      dead = true
      generation++
      disposeDriver()
      renderStatic()
      if (typeof media?.removeEventListener === 'function')
        media.removeEventListener('change', syncMotion)
      else
        media?.removeListener?.(syncMotion)
    },
  }
}
