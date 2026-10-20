import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AboutView from '../src/views/about/AboutView.vue'

vi.mock('../src/services/app-info', () => ({
  adminBuildInfo: {
    builtAt: '2026-10-19T02:03:04.000Z',
    commit: 'abc1234',
    dependencies: {
      '@lumal/core': '9.8.7-beta',
      'echarts': '6.1.0',
      'vue': '3.5.22',
      'vue-echarts': '8.3.2',
    },
    devDependencies: {
      typescript: '6.0.0',
      vite: '8.0.0',
    },
    license: 'MIT',
    mode: 'production',
    version: '9.8.7-beta',
  },
}))

function mountAboutView() {
  return mount(AboutView, {
    global: {
      stubs: { LumalIcon: true },
    },
  })
}

describe('about view', () => {
  it('展示构建快照中的版本、提交与基本信息，而不是写死发布版本', () => {
    const wrapper = mountAboutView()
    const basicInfo = wrapper.get('section[aria-label="基本信息"]')

    expect(wrapper.get('h1').text()).toBe('关于项目')
    expect(wrapper.get('[aria-label="当前框架版本"]').text()).toBe('v9.8.7-beta')
    expect(basicInfo.text()).toContain('框架版本')
    expect(basicInfo.text()).toContain('9.8.7-beta')
    expect(basicInfo.text()).toContain('abc1234')
    expect(basicInfo.text()).toContain('MIT')
    expect(basicInfo.text()).toContain('生产环境')
    expect(wrapper.findAll('h2').map(heading => heading.text())).toEqual([
      '基本信息',
      '生产环境依赖',
      '开发环境依赖',
    ])
  })

  it('以 UTC+8 展示固定构建时间，重复挂载不会替换成访问时间', () => {
    const wrapper = mountAboutView()
    const time = wrapper.get('time')

    expect(time.attributes('datetime')).toBe('2026-10-19T02:03:04.000Z')
    expect(time.text()).toContain('10:03:04')
    expect(wrapper.text()).toContain('UTC+8')
    expect(mountAboutView().get('time').text()).toBe(time.text())
  })

  it('分别展示生产与开发依赖的精确版本', () => {
    const wrapper = mountAboutView()
    const production = wrapper.get('section[aria-label="生产环境依赖"]')
    const development = wrapper.get('section[aria-label="开发环境依赖"]')

    expect(production.findAll('dt').map(item => item.text())).toEqual([
      '@lumal/core',
      'echarts',
      'vue',
      'vue-echarts',
    ])
    expect(production.findAll('dd').map(item => item.text())).toEqual([
      '9.8.7-beta',
      '6.1.0',
      '3.5.22',
      '8.3.2',
    ])
    expect(development.findAll('dt').map(item => item.text())).toEqual(['typescript', 'vite'])
    expect(development.findAll('dd').map(item => item.text())).toEqual(['6.0.0', '8.0.0'])
  })

  it('项目链接使用明确名称且在新窗口安全打开', () => {
    const links = mountAboutView().findAll('a')

    expect(links.map(link => [link.text(), link.attributes('href')])).toEqual([
      ['Lumal 文档', 'https://luma-docs-seven.vercel.app'],
      ['Lumal Admin', 'https://lumal-admin-demo.vercel.app'],
      ['cuteyuchen/lumal', 'https://github.com/cuteyuchen/lumal'],
    ])
    for (const link of links) {
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
    }
  })
})
