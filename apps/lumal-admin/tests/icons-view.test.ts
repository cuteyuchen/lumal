import * as ElementPlusIcons from '@element-plus/icons-vue'
import { getIcon } from '@iconify/vue'
import { getRegisteredIconDefinitions, registerStaticLocalSvgIcons, resolveIconDefinition } from '@lumal/icons'
import { LumalIcon } from '@lumal/icons-vue'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, shallowRef } from 'vue'
import { renderToString } from 'vue/server-renderer'
import AppIconGroupSelect from '../src/components/app/AppIconGroupSelect.vue'
import { localIcons, registerAdminElementPlusIcons, registerAdminIcons } from '../src/icons'
import elementPlusIconSvgs from '../src/icons/element-plus-icons.json'
import IconsMorphExamples from '../src/views/examples/components/icons/IconsMorphExamples.vue'
import IconsPickerExamples from '../src/views/examples/components/icons/IconsPickerExamples.vue'
import IconsRenderExamples from '../src/views/examples/components/icons/IconsRenderExamples.vue'
import IconsSvgTools from '../src/views/examples/components/icons/IconsSvgTools.vue'
import { elementPlusStubs } from './helpers/element-plus-stubs'

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

const stubs = {
  ...elementPlusStubs,
  Teleport: true,
  ElSlider: defineComponent({
    props: { modelValue: Number, min: Number, max: Number, step: Number },
    emits: ['update:modelValue'],
    template: '<input type="range" :min="min" :max="max" :step="step" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))">',
  }),
  ElSwitch: defineComponent({
    props: { modelValue: Boolean, disabled: Boolean },
    emits: ['update:modelValue'],
    template: '<input type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)">',
  }),
  ElRadioGroup: defineComponent({
    props: { modelValue: String },
    emits: ['update:modelValue'],
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
  }),
  ElRadioButton: defineComponent({
    props: { value: String },
    template: '<option :value="value"><slot /></option>',
  }),
}

beforeAll(async () => {
  registerAdminIcons()
  registerStaticLocalSvgIcons(localIcons)
  await registerAdminElementPlusIcons()
})

describe('admin icon examples', () => {
  it('四组状态示例保留图标组件，并支持动画开关和弹簧预设', async () => {
    const wrapper = mount(IconsMorphExamples, { global: { stubs } })
    for (const [key, from, to] of [
      ['theme', 'lumal:moon', 'lumal:sun'],
      ['sidebar', 'lumal:sidebar-collapse', 'lumal:sidebar-expand'],
      ['maximize', 'lumal:maximize', 'lumal:restore'],
      ['fullscreen', 'lumal:fullscreen', 'lumal:fullscreen-exit'],
    ]) {
      const button = wrapper.get(`[data-morph-example="${key}"]`)
      const icon = button.getComponent(LumalIcon)
      expect(icon.props()).toMatchObject({ name: from, morph: true, morphSpring: 'smooth' })
      await button.trigger('click')
      expect(button.attributes('aria-pressed')).toBe('true')
      expect(button.getComponent(LumalIcon).vm).toBe(icon.vm)
      expect(icon.props('name')).toBe(to)
    }
    await wrapper.get('[aria-label="启用形变动画"]').setValue(false)
    await wrapper.get('[aria-label="形变弹簧预设"]').setValue('bouncy')
    for (const icon of wrapper.findAllComponents(LumalIcon))
      expect(icon.props()).toMatchObject({ morph: false, morphSpring: 'bouncy' })
  })

  it('应用设置图标复用内置齿轮，避免菜单与示例图标形状不一致', () => {
    const builtin = resolveIconDefinition('lumal:settings')!
    const appIcon = localIcons.find(icon => icon.key === 'app:settings')!
    const wrapper = mount(LumalIcon, { props: { name: appIcon.key, size: 48 } })

    expect(appIcon.svgText).toBe(builtin.svgText)
    expect(wrapper.get('circle').attributes()).toMatchObject({ cx: '12', cy: '12', r: '3.5' })
  })

  it.each([
    { key: 'app:dashboard', source: 'local-svg', selector: 'svg' },
    { key: 'iconify:admin-demo:badge', source: 'iconify', selector: 'svg.iconify' },
    { key: 'iconify:lucide:search', source: 'iconify', selector: 'svg.iconify' },
    { key: 'element-plus:Edit', source: 'local-svg', selector: 'svg' },
    { key: 'component:brand', source: 'component', selector: 'img' },
  ])('$source 图标通过 LumalIcon 离线渲染', async ({ key, source, selector }) => {
    const wrapper = mount(LumalIcon, { props: { name: key, size: 32 } })
    await flushPromises()

    expect(resolveIconDefinition(key)).toMatchObject({ source })
    expect(wrapper.find(selector).exists()).toBe(true)
    expect(wrapper.classes()).toContain('lumal-icon')
  })

  it('图标库支持分组、搜索、分页和模型回写', async () => {
    const wrapper = mount(IconsPickerExamples, { global: { stubs }, props: { modelValue: 'app:dashboard' } })
    await wrapper.get('[aria-label="每页图标数量"]').setValue('12')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(12)
    await wrapper.get('.lumal-icon-picker [aria-label="图标分组"]').setValue('app')
    expect(wrapper.text()).toContain('应用 SVG')
    await wrapper.get('input[type="search"]').setValue('用户')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
    await wrapper.get('[role="option"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['app:user'])
    await wrapper.get('input[type="search"]').setValue('no-matching-icon')
    expect(wrapper.text()).toContain('未找到匹配图标')
  })

  it('图标库的 Iconify 分组预置 16 个离线图标，支持中文搜索和模型回写', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetch)
    const icons = getRegisteredIconDefinitions().filter(icon => icon.group === 'iconify')
    expect(icons).toHaveLength(16)
    for (const icon of icons) {
      expect(icon.source).toBe('iconify')
      expect(getIcon(icon.icon!)).toMatchObject({ width: 24, height: 24, body: expect.any(String) })
    }

    const wrapper = mount(IconsPickerExamples, { global: { stubs }, props: { modelValue: 'app:dashboard' } })
    await wrapper.get('.lumal-icon-picker [aria-label="图标分组"]').setValue('iconify')
    await flushPromises()
    expect(wrapper.findAll('.lumal-icon-picker__item')).toHaveLength(16)
    expect(wrapper.findAll('.lumal-icon-picker__item svg.iconify')).toHaveLength(16)
    await wrapper.get('[aria-label="搜索图标"]').setValue('邮件')
    expect(wrapper.findAll('.lumal-icon-picker__item')).toHaveLength(1)
    await wrapper.get('.lumal-icon-picker__item').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['iconify:lucide:mail'])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('图标库默认每页显示 72 个，可切换 96 个并完整显示名称', async () => {
    const wrapper = mount(IconsPickerExamples, { global: { stubs }, props: { modelValue: 'app:dashboard' } })
    const pageSize = wrapper.get<HTMLSelectElement>('[aria-label="每页图标数量"]')
    expect(pageSize.element.value).toBe('72')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(72)
    expect(wrapper.get('.lumal-icon-picker').classes()).toContain('lumal-icon-picker--show-labels')

    await pageSize.setValue('96')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(96)
    await wrapper.get('.lumal-icon-picker [aria-label="图标分组"]').setValue('element-plus')
    await wrapper.get('[aria-label="搜索图标"]').setValue('CircleCloseFilled')
    expect(wrapper.get('.lumal-icon-picker__item-label').text()).toBe('CircleCloseFilled')

    await wrapper.get('[aria-label="显示图标名称"]').setValue(false)
    expect(wrapper.find('.lumal-icon-picker__item-label').exists()).toBe(false)
    expect(wrapper.get('.lumal-icon-picker').classes()).not.toContain('lumal-icon-picker--show-labels')
  })

  it('后台使用 Element Plus 分组下拉框，Element Plus 图标通过 LumalIcon 选择并回写', async () => {
    const wrapper = mount(IconsPickerExamples, { global: { stubs }, props: { modelValue: 'app:user' } })
    const groupSelect = wrapper.getComponent(AppIconGroupSelect).getComponent(stubs.ElSelect)
    expect(groupSelect.attributes('teleported')).toBe('false')
    expect(groupSelect.text()).toContain('Element Plus')
    expect(resolveIconDefinition('element-plus:Edit')).toMatchObject({
      group: 'element-plus',
      source: 'local-svg',
      svgText: elementPlusIconSvgs.Edit,
    })

    await groupSelect.setValue('element-plus')
    await wrapper.get('input[type="search"]').setValue('Edit')
    const option = wrapper.get('[role="option"][aria-label="Edit"]')
    expect(option.getComponent(LumalIcon).props('name')).toBe('element-plus:Edit')
    expect(option.find('svg').exists()).toBe(true)
    await option.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['element-plus:Edit'])
    await wrapper.setProps({ modelValue: 'element-plus:Edit' })
    expect(wrapper.get('[aria-label="当前图标"]').text()).toContain('Element Plus')
  })

  it('预生成的 Element Plus SVG 覆盖官方全部图标并保持原始图形', async () => {
    const officialEntries = await Promise.all(Object.entries(ElementPlusIcons).map(async ([name, component]) => [
      name,
      await renderToString(createSSRApp({ render: () => h(component) })),
    ]))
    expect(elementPlusIconSvgs).toEqual(Object.fromEntries(officialEntries))
  })

  it('弹窗使用同一 Element Plus 分组控件，确认后才提交所选图标', async () => {
    const wrapper = mount(IconsPickerExamples, { global: { stubs }, props: { modelValue: 'app:user' } })
    await wrapper.findAll('button').find(button => button.text() === '弹窗选择')!.trigger('click')
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.getComponent(AppIconGroupSelect).getComponent(stubs.ElSelect).attributes('teleported')).toBe('false')
    await dialog.get('[aria-label="图标分组"]').setValue('element-plus')
    await dialog.get('input[type="search"]').setValue('Edit')
    await dialog.get('[role="option"][aria-label="Edit"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await dialog.get('.is-primary').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['element-plus:Edit'])
  })

  it('弹窗取消保留原选择，确认后同步到图标库预览', async () => {
    const Host = defineComponent({
      components: { IconsPickerExamples },
      setup: () => ({ selected: shallowRef('app:user') }),
      template: '<IconsPickerExamples v-model="selected" />',
    })
    const wrapper = mount(Host, { global: { stubs } })
    const openDialog = () => wrapper.findAll('button').find(button => button.text() === '弹窗选择')!.trigger('click')
    await openDialog()
    let dialog = wrapper.get('[role="dialog"]')
    await dialog.get('input[type="search"]').setValue('浅色模式')
    await dialog.get('[role="option"]').trigger('click')
    await dialog.get('[aria-label="关闭图标选择器"]').trigger('click')
    expect(wrapper.get('.icons-picker-examples__key').text()).toBe('app:user')

    await openDialog()
    dialog = wrapper.get('[role="dialog"]')
    await dialog.get('input[type="search"]').setValue('浅色模式')
    await dialog.get('[role="option"]').trigger('click')
    await dialog.get('.is-primary').trigger('click')
    expect(wrapper.get('.icons-picker-examples__key').text()).toBe('lumal:sun')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('复制名称提供成功和失败反馈', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = mount(IconsPickerExamples, { global: { stubs }, props: { modelValue: 'app:user' } })
    await wrapper.get('[aria-label="复制图标名称"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('app:user')
    expect(wrapper.get('.icons-picker-examples__feedback').text()).toContain('图标名称已复制')

    writeText.mockRejectedValueOnce(new Error('denied'))
    await wrapper.get('[aria-label="复制图标名称"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('.icons-picker-examples__feedback').text()).toContain('复制失败')
  })

  it('尺寸、颜色、渐变和来源切换驱动 LumalIcon 渲染', async () => {
    const wrapper = mount(IconsRenderExamples, { global: { stubs }, props: { modelValue: 'lumal:settings' } })
    await wrapper.get('[aria-label="图标尺寸"]').setValue('64')
    await wrapper.get('[aria-label="图标颜色"]').setValue('#e11d48')
    const preview = wrapper.get('[data-preview="name"] .lumal-icon')
    expect(preview.attributes('style')).toContain('--lumal-icon-size: 64px')
    expect(preview.find('svg').html()).toContain('#e11d48')
    await wrapper.get('[aria-label="SVG 渐变"]').setValue(true)
    expect(preview.find('linearGradient').exists()).toBe(true)
    await wrapper.get('[aria-label="继承父级颜色"]').setValue(true)
    expect(wrapper.get('[aria-label="图标颜色"]').attributes()).toHaveProperty('disabled')
    expect(preview.find('linearGradient').exists()).toBe(false)

    await wrapper.setProps({ modelValue: 'iconify:admin-demo:badge' })
    expect(wrapper.get('[aria-label="SVG 渐变"]').attributes()).toHaveProperty('disabled')
    expect(wrapper.find('[data-preview="svg"]').exists()).toBe(false)
    expect(wrapper.get('[data-preview="name"]').find('svg.iconify').exists()).toBe(true)
  })

  it.each(['lumal:monitor', 'element-plus:Edit'])('%s 的三种输入方式展示相同图标、不同参数及完整示例数据', (key) => {
    const wrapper = mount(IconsRenderExamples, { global: { stubs }, props: { modelValue: key } })
    const definition = resolveIconDefinition(key)!
    const nameCode = wrapper.get('[aria-label="注册名称示例代码"]').text()
    const definitionCode = wrapper.get('[aria-label="直接定义示例代码"]').text()
    const svgCode = wrapper.get('[aria-label="可信 SVG示例代码"]').text()

    expect(wrapper.get('[data-render-example="name"] figcaption').text()).toContain('name: string')
    expect(wrapper.get('[data-render-example="definition"] figcaption').text()).toContain('icon: IconDefinition')
    expect(wrapper.get('[data-render-example="svg"] figcaption').text()).toContain('icon: string')
    expect(nameCode).toContain(`name="${key}"`)
    expect(definitionCode).toContain(':icon="iconDefinition"')
    expect(definitionCode).toContain(`const iconDefinition: IconDefinition = ${JSON.stringify(definition, null, 2)}`)
    expect(svgCode).toContain(':icon="svgText"')
    expect(svgCode).toContain(`const svgText = ${JSON.stringify(definition.svgText)}`)
    expect(wrapper.find('pre svg').exists()).toBe(false)
    const shapes = wrapper.findAll('[data-preview] svg').map(svg => svg.element.innerHTML)
    expect(new Set(shapes).size).toBe(1)
    for (const code of [nameCode, definitionCode, svgCode])
      expectValidVueExample(code)
  })

  it('示例代码随图标、尺寸、颜色、渐变和颜色继承同步', async () => {
    const wrapper = mount(IconsRenderExamples, { global: { stubs }, props: { modelValue: 'lumal:monitor' } })
    await wrapper.get('[aria-label="图标尺寸"]').setValue('64')
    await wrapper.get('[aria-label="图标颜色"]').setValue('#e11d48')
    await wrapper.get('[aria-label="SVG 渐变"]').setValue(true)
    await wrapper.setProps({ modelValue: 'app:user' })
    const codeBlocks = () => wrapper.findAll('pre').map(pre => pre.text())

    for (const code of codeBlocks()) {
      expect(code).toContain(':size="64"')
      expect(code).toContain('color="#e11d48"')
      expect(code).toContain(':gradient=\'{"from":"#e11d48","to":"#10b981"}\'')
      expect(code).not.toContain('lumal:monitor')
      expectValidVueExample(code)
    }
    expect(codeBlocks()[0]).toContain('name="app:user"')

    await wrapper.get('[aria-label="继承父级颜色"]').setValue(true)
    for (const code of codeBlocks()) {
      expect(code).not.toContain('color="#e11d48"')
      expect(code).not.toContain(':gradient=')
      expect(code).toContain('style="color: var(--el-color-success)"')
      expectValidVueExample(code)
    }
  })

  it.each([
    { key: 'iconify:admin-demo:badge', definitionCode: '"source": "iconify"' },
    { key: 'component:brand', definitionCode: 'resolveIconDefinition("component:brand")' },
  ])('$key 只展示适用的输入方式和代码', async ({ key, definitionCode }) => {
    const wrapper = mount(IconsRenderExamples, { global: { stubs }, props: { modelValue: key } })
    await flushPromises()
    expect(wrapper.findAll('[data-render-example]')).toHaveLength(2)
    expect(wrapper.find('[aria-label="可信 SVG示例代码"]').exists()).toBe(false)
    expect(wrapper.get('[aria-label="直接定义示例代码"]').text()).toContain(definitionCode)
    for (const pre of wrapper.findAll('pre'))
      expectValidVueExample(pre.text())
  })

  it.each(['注册名称', '直接定义', '可信 SVG'])('%s 示例可以复制最新代码，并反馈复制失败', async (label) => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = mount(IconsRenderExamples, { global: { stubs }, props: { modelValue: 'lumal:monitor' } })
    await wrapper.get('[aria-label="图标尺寸"]').setValue('64')
    await wrapper.get(`[aria-label="复制${label}示例"]`).trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(wrapper.get(`[aria-label="${label}示例代码"]`).text())
    expect(wrapper.get('.icons-render-examples__feedback').text()).toBe(`${label}示例已复制`)

    await wrapper.get('[aria-label="图标颜色"]').setValue('#e11d48')
    expect(wrapper.get('.icons-render-examples__feedback').text()).toBe('')
    writeText.mockRejectedValueOnce(new Error('denied'))
    await wrapper.get(`[aria-label="复制${label}示例"]`).trigger('click')
    await flushPromises()
    expect(wrapper.get('.icons-render-examples__feedback').text()).toContain('复制失败')
    expect(wrapper.get(`[aria-label="复制${label}示例"]`).attributes('disabled')).toBeUndefined()
  })

  it('改色、渐变、合成和 Data URI 下载保持一致', async () => {
    const wrapper = mount(IconsSvgTools, { global: { stubs } })
    const output = () => wrapper.get<HTMLTextAreaElement>('[aria-label="SVG 输出"]').element.value
    const uri = () => wrapper.get<HTMLTextAreaElement>('[aria-label="Data URI 输出"]').element.value
    const expectMatchingOutputs = () => {
      expect(decodeURIComponent(uri().slice(uri().indexOf(',') + 1))).toBe(output())
      const svgDocument = new DOMParser().parseFromString(output(), 'image/svg+xml')
      expect(svgDocument.querySelector('parsererror')).toBeNull()
      expect(svgDocument.documentElement.namespaceURI).toBe('http://www.w3.org/2000/svg')
      expect(wrapper.get('img').attributes('src')).toBe(uri())
      expect(wrapper.get('[download]').attributes('href')).toBe(uri())
    }

    expect(wrapper.get('.icons-svg-tools__validation').text()).toContain('通过')
    await wrapper.get('[aria-label="SVG 颜色"]').setValue('#e11d48')
    expect(output()).toContain('#e11d48')
    expectMatchingOutputs()
    await wrapper.get('[aria-label="SVG 处理方式"]').setValue('gradient')
    await wrapper.get('[aria-label="渐变方向"]').setValue('vertical')
    expect(output()).toContain('<linearGradient')
    expect(output()).toContain('y2="100%"')
    expectMatchingOutputs()
    await wrapper.get('[aria-label="SVG 处理方式"]').setValue('compose')
    expect(output()).toContain('data-lumal-icon-layer="0"')
    expect(output()).toContain('data-lumal-icon-layer="1"')
    expectMatchingOutputs()
    expect(wrapper.get('[aria-label="SVG 输出"]').attributes()).toHaveProperty('readonly')
  })

  it.each([
    { button: '复制 SVG 输出', output: 'SVG 输出', message: 'SVG 输出已复制' },
    { button: '复制 Data URI', output: 'Data URI 输出', message: 'Data URI已复制' },
  ])('$button 复制当前输出并提供反馈', async ({ button, output, message }) => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = mount(IconsSvgTools, { global: { stubs } })
    await wrapper.get('[aria-label="SVG 处理方式"]').setValue('gradient')
    await wrapper.get('[aria-label="渐变结束色"]').setValue('#e11d48')
    const currentOutput = wrapper.get<HTMLTextAreaElement>(`[aria-label="${output}"]`).element.value

    await wrapper.get(`[aria-label="${button}"]`).trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(currentOutput)
    expect(wrapper.get('.icons-svg-tools__feedback').text()).toBe(message)

    writeText.mockRejectedValueOnce(new Error('denied'))
    await wrapper.get(`[aria-label="${button}"]`).trigger('click')
    await flushPromises()
    expect(wrapper.get('.icons-svg-tools__feedback').text()).toContain('复制失败')
    expect(wrapper.get(`[aria-label="${button}"]`).attributes('disabled')).toBeUndefined()
  })

  it('剪贴板 API 不可用时提供失败反馈', async () => {
    vi.stubGlobal('navigator', {})
    const wrapper = mount(IconsSvgTools, { global: { stubs } })

    await wrapper.get('[aria-label="复制 SVG 输出"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('.icons-svg-tools__feedback').text()).toContain('复制失败')
  })
})

function expectValidVueExample(source: string): void {
  const { descriptor, errors } = parse(source)
  expect(errors).toEqual([])
  expect(descriptor.scriptSetup).not.toBeNull()
  expect(descriptor.template).not.toBeNull()
  const script = compileScript(descriptor, { id: 'icon-example' })
  const template = compileTemplate({
    filename: 'IconExample.vue',
    id: 'icon-example',
    source: descriptor.template!.content,
    compilerOptions: { bindingMetadata: script.bindings },
  })
  expect(template.errors).toEqual([])
}
