import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ViewportCanvas from '../src/views/examples/viewport/ViewportCanvas.vue'

describe('普通 px 示例不再拥有适配策略', () => {
  it('直接渲染交互内容，没有额外包装器、整画布 transform 或字号补偿', async () => {
    const wrapper = mount(ViewportCanvas)
    expect(wrapper.find('[data-viewport-mode]').exists()).toBe(false)
    expect(wrapper.attributes('style')).toBeUndefined()
    expect(wrapper.get('[data-testid="viewport-font"]').attributes('style')).toBeUndefined()
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').text()).toBe('确认 · 1')
    wrapper.unmount()
  })
})
