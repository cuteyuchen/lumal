// @vitest-environment node
/* eslint-disable no-template-curly-in-string -- 模板插值以原文交给解析器，不在测试脚本中求值。 */
import type { TemplateChildNode } from '@vue/compiler-dom'
import type { ViewportTransformOptions } from '../src'
import { NodeTypes } from '@vue/compiler-dom'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import { transformViewportTemplate } from '../src/viewport-template'

const options: ViewportTransformOptions = { enabled: true, include: ['src/screen/**'], inlineStyles: true }
const id = '/app/src/screen/Panel.vue'
function transform(source: string, overrides: Partial<ViewportTransformOptions> = {}) {
  return transformViewportTemplate(source, id, { ...options, ...overrides })?.code ?? source
}
function styles(source: string) {
  const result: string[] = []
  function visit(nodes: TemplateChildNode[]) {
    for (const node of nodes) {
      if (node.type !== NodeTypes.ELEMENT)
        continue
      for (const property of node.props) {
        if (property.type === NodeTypes.ATTRIBUTE && property.name === 'style' && property.value)
          result.push(property.value.content)
        if (property.type === NodeTypes.DIRECTIVE && property.name === 'bind'
          && property.arg?.type === NodeTypes.SIMPLE_EXPRESSION && property.arg.content === 'style'
          && property.exp?.type === NodeTypes.SIMPLE_EXPRESSION) {
          result.push(property.exp.content)
        }
      }
      visit(node.children)
    }
  }
  visit(parse(source).descriptor.template!.ast!.children)
  return result
}

describe('模板尺寸的静态语法分析', () => {
  it('只转换静态style，不改脚本、class、aria、普通属性或业务文本', () => {
    const source = `<script setup lang="ts">
const business = '192px'
const active = true
</script>
<template>
  <div class="w-[192px] h-[96px] top-[20px]" :class="['w-[192px]', active && 'mt-[20px]']"
    aria-label="192px" data-width="192px" width="192px" :title="'192px'"
    style="width:192px;height:96px">192px {{ business }}</div>
</template>
<i18n>{"business":"192px"}</i18n>`
    const result = transform(source)
    expect(result).toBe(source.replace('style="width:192px;height:96px"', 'style="width:10vw;height:5vw"'))
    expect(transform(result)).toBe(result)
  })
  it('行内CSS与文件CSS共用属性、字体、最小尺寸、精度和像素阈值策略', () => {
    const source = '<template><div style="width:192px;left:19.2px;font-size:14px;font:14px/20px sans-serif;line-height:20px;min-width:320px;min-height:40px;border:2px solid red;padding:24px 1px" /></template>'
    expect(styles(transform(source, { excludeProperties: ['border*', 'padding*'], precision: 2 }))[0])
      .toBe('width:10vw;left:1vw;font-size:14px;font:14px/20px sans-serif;line-height:20px;min-width:320px;min-height:40px;border:2px solid red;padding:24px 1px')
    expect(styles(transform(source, { includeProperties: ['width'] }))[0]).toContain('left:19.2px')
    expect(transform(source, { includeProperties: [] })).toBe(source)
    expect(styles(transform(source, { fontSize: true, minSize: true }))[0]).toContain('line-height:1.041667vw')
  })
  it('只转换对象中静态可分析的样式值，动态属性名、变量、调用和业务值保留', () => {
    const source = `<template><div :style="{ width: '192px', top: '24px', fontSize: '14px', lineHeight: '20px', minWidth: '320px', borderWidth: '2px', padding: '24px', height: measured, left: getSize('192px'), [field]: '192px', zIndex: 192, '--size': '192px' }" /></template>`
    const result = styles(transform(source, { excludeProperties: ['border*', 'padding*'] }))[0]!
    expect(result).toContain('width: "10vw"')
    expect(result).toContain('top: "1.25vw"')
    for (const unchanged of ['fontSize: \'14px\'', 'lineHeight: \'20px\'', 'minWidth: \'320px\'', 'borderWidth: \'2px\'', 'padding: \'24px\'', 'height: measured', 'getSize(\'192px\')', '[field]: \'192px\'', 'zIndex: 192', '\'--size\': \'192px\''])
      expect(result).toContain(unchanged)
  })
  it('对象数组、CSS fallback数组、无插值模板字符串与静态style字符串可转换', () => {
    const source = '<template><div :style="[baseStyle, { width: [\'192px\', `384px`], top: `24px`, left: `${offset}px` }, \'height:96px\', active && { margin: \'24px\' }, ...extra]" /></template>'
    const result = styles(transform(source))[0]!
    expect(result).toContain('width: ["10vw", "20vw"]')
    expect(result).toContain('top: "1.25vw"')
    expect(result).toContain('"height:5vw"')
    expect(result).toContain('left: `${offset}px`')
    expect(result).toContain('active && { margin: \'24px\' }')
    expect(result).toContain('...extra')
  })
  it.each([
    'styleFromScript',
    'getStyle(\'192px\')',
    '\'width:\' + size + \'px\'',
    'active ? {width: \'192px\'} : {width: \'384px\'}',
    'active && {width: \'192px\'}',
  ])('动态表达式 %s 不求值、不遍历内部业务字符串', (expression) => {
    const source = `<template><div :style="${expression}" /></template>`
    expect(transform(source)).toBe(source)
  })
  it('已有视口变量和约束表达式不转换，CSS及对象声明忽略标记一致生效', () => {
    const source = `<template>
<div style="/* lumal-viewport-ignore-next */width:192px;height:96px;/* lumal-viewport-ignore */top:24px" />
<div :style="{ width: 'calc(192px * var(--lumal-viewport-scale))', height: 'clamp(40px,10vw,192px)', '--lumal-viewport-x-unit': '192px', /* lumal-viewport-ignore-next */ left: '192px', top: '24px' }" />
</template>`
    const result = styles(transform(source, { customProperties: true }))
    expect(result[0]).toBe('/* lumal-viewport-ignore-next */width:192px;height:96px;/* lumal-viewport-ignore */top:1.25vw')
    expect(result[1]).toContain('\'calc(192px * var(--lumal-viewport-scale))\'')
    expect(result[1]).toContain('\'clamp(40px,10vw,192px)\'')
    expect(result[1]).toContain('\'--lumal-viewport-x-unit\': \'192px\'')
    expect(result[1]).toContain('left: \'192px\'')
    expect(result[1]).toContain('top: "1.25vw"')
  })
  it('模板忽略标记跳过下一元素及子树，后续兄弟恢复转换', () => {
    const source = '<template><!-- lumal-viewport-ignore -->\n<section style="width:192px"><i style="height:96px" /></section><div style="width:192px" /></template>'
    expect(styles(transform(source))).toEqual(['width:192px', 'height:96px', 'width:10vw'])
  })
  it('静态选择器及祖先排除生效，普通属性选择器不被当作原子class', () => {
    const source = '<template><section class="runtime-canvas" style="width:192px"><i style="height:96px" /></section><div data-fixed="192px" style="width:192px" /><div data-size="192px" style="width:192px" /></template>'
    expect(styles(transform(source, { excludeSelectors: ['.runtime-canvas', '[data-fixed="192px"]'] })))
      .toEqual(['width:192px', 'height:96px', 'width:192px', 'width:10vw'])
  })
  it.each([':class="classes"', ':id="id"', ':data-fixed="fixed"', ':aria-label.prop="label"', 'v-bind="attrs"', ':[name]="value"'])('配置selector排除时动态属性 %s 保守跳过子树', (binding) => {
    const source = `<template><div ${binding} style="width:192px"><i style="height:96px" /></div></template>`
    expect(transform(source, { excludeSelectors: ['.fixed', '[data-fixed="yes"]'] })).toBe(source)
    expect(styles(transform(source))).toEqual(['width:10vw', 'height:5vw'])
  })
  it('style绑定自身不阻止可静态分析的对象在非匹配排除规则下转换', () => {
    const source = '<template><div :style="{ width: \'192px\' }" /></template>'
    expect(styles(transform(source, { excludeSelectors: ['.fixed'] }))).toEqual(['{ width: "10vw" }'])
  })
  it('正确处理HTML实体、单引号及无引号style，保留值的语义', () => {
    const source = '<template><div style=\'width:192px;content:"192px &amp; &lt;x&gt;"\' /><i style=height:96px /><div :style="{ width: &quot;192px&quot;, content: &quot;\'192px &amp; x\'&quot; }" /></template>'
    const result = transform(source)
    expect(parse(result).errors).toEqual([])
    expect(styles(result)).toEqual(['width:10vw;content:"192px & <x>"', 'height:5vw', '{ width: "10vw", content: "\'192px & x\'" }'])
  })
  it('外部或非HTML模板、非法CSS与非style绑定均不修改', () => {
    for (const source of [
      '<template src="./Panel.html" />',
      '<template lang="pug">div(style="width:192px")</template>',
      '<template><div style="width:192px;broken{" /></template>',
      '<template><div :[field]="{width: \'192px\'}" /></template>',
    ])
      expect(transform(source)).toBe(source)
  })
  it('对象值不能被当作多条CSS声明，字符串内的业务文本不扩散解析', () => {
    const source = '<template><div :style="{ width: \'192px; height:96px\', top: \'24px\' }" /></template>'
    const result = styles(transform(source))[0]!
    expect(result).toContain('width: \'192px; height:96px\'')
    expect(result).toContain('top: "1.25vw"')
  })
  it('返回高精度原文source map，不改变SFC其他块', () => {
    const source = '<script setup>const point = 192</script>\n<template><div style="width:192px" /></template>\n<style>.panel{width:192px}</style>'
    const result = transformViewportTemplate(source, id, options)!
    const map = JSON.parse(result.map)
    expect(map.sources).toEqual([id])
    expect(map.sourcesContent).toEqual([source])
    expect(map.mappings).not.toBe('')
    expect(result.code).toContain('<style>.panel{width:192px}</style>')
  })
})
