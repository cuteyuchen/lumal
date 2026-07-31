import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import AppHeaderActions from '../src/components/app/AppHeaderActions.vue'
import AppSettingsDrawer from '../src/components/app/AppSettingsDrawer.vue'
import { createAdminPreferences } from '../src/services/preferences'
import { elementPlusStubs } from './helpers/element-plus-stubs'

const IconStub = defineComponent({
  name: 'LumalIcon',
  props: {
    name: String,
  },
  template: '<i class="lumal-icon-stub" :data-icon="name" />',
})

const DrawerStub = defineComponent({
  name: 'ElDrawer',
  props: {
    modelValue: Boolean,
    size: String,
    title: String,
  },
  emits: ['update:modelValue'],
  template: '<section v-if="modelValue" class="el-drawer" :data-size="size" :data-title="title"><slot name="header" /><slot /></section>',
})

const ThemeSettingsPanelStub = defineComponent({
  name: 'LumalThemeSettingsPanel',
  props: {
    preferences: Object,
  },
  emits: ['change', 'update:preferences'],
  template: `
    <button
      class="theme-panel-stub"
      type="button"
      @click="$emit('change', preferences); $emit('update:preferences', preferences)"
    >
      主题设置
    </button>
  `,
})

const DropdownStub = defineComponent({
  name: 'ElDropdown',
  inheritAttrs: false,
  props: {
    placement: String,
    popperClass: String,
    teleported: Boolean,
    trigger: String,
  },
  emits: ['command'],
  template: `
    <div class="el-dropdown-stub" v-bind="$attrs">
      <slot />
      <div class="el-dropdown-menu-stub"><slot name="dropdown" /></div>
    </div>
  `,
})

const DropdownItemStub = defineComponent({
  name: 'ElDropdownItem',
  inheritAttrs: false,
  props: {
    command: [String, Number, Object],
    divided: Boolean,
  },
  template: `
    <button
      class="el-dropdown-item-stub"
      type="button"
      :data-command="command"
      :data-divided="String(divided)"
      v-bind="$attrs"
    >
      <slot />
    </button>
  `,
})

function mountHeaderActions() {
  return mount(AppHeaderActions, {
    global: {
      directives: {
        authority: () => {},
      },
      stubs: {
        ...elementPlusStubs,
        ElDropdown: DropdownStub,
        ElDropdownItem: DropdownItemStub,
        ElDropdownMenu: defineComponent({
          name: 'ElDropdownMenu',
          template: '<div class="el-dropdown-menu"><slot /></div>',
        }),
        LumalIcon: IconStub,
      },
    },
    props: {
      cockpitUrl: 'http://localhost:5180/',
      resolvedThemeMode: 'dark' as const,
      userName: '管理员',
    },
  })
}

describe('app header actions', () => {
  it('会展示用户入口并抛出主题切换、设置打开和登出事件', async () => {
    const wrapper = mountHeaderActions()

    expect(wrapper.find('[data-action="toggle-theme"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="open-cockpit"]').attributes('href')).toBe('http://localhost:5180/')
    expect(wrapper.find('[data-action="open-cockpit"]').attributes('target')).toBe('_blank')
    expect(wrapper.find('[data-action="open-settings"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="open-settings"]').attributes('aria-label')).toBe('偏好设置')
    expect(wrapper.find('[data-action="open-profile"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="logout"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('管理员')

    await wrapper.find('[data-action="toggle-theme"]').trigger('click')
    await wrapper.find('[data-action="open-settings"]').trigger('click')
    await wrapper.find('[data-action="open-profile"]').trigger('click')
    await wrapper.find('[data-action="logout"]').trigger('click')

    expect(wrapper.emitted('toggleTheme')).toHaveLength(1)
    expect(wrapper.emitted('openSettings')).toHaveLength(1)
    expect(wrapper.emitted('openProfile')).toHaveLength(1)
    expect(wrapper.emitted('logout')).toHaveLength(1)
  })

  it('移动端账户菜单会传送到 body 并复用现有导航事件', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    const wrapper = mountHeaderActions()
    const dropdown = wrapper.findComponent(DropdownStub)
    const trigger = wrapper.find('[data-action="open-mobile-account-menu"]')

    expect(dropdown.props('placement')).toBe('bottom-end')
    expect(dropdown.props('popperClass')).toBe('lumal-admin-header-actions__mobile-dropdown')
    expect(dropdown.props('teleported')).toBe(true)
    expect(dropdown.props('trigger')).toBe('click')
    expect(trigger.attributes('aria-label')).toBe('账户与更多操作')
    expect(trigger.attributes('aria-haspopup')).toBe('menu')
    expect(wrapper.find('[data-action="open-cockpit-mobile"]').text()).toContain('驾驶舱')

    const logoutItem = wrapper.find('[data-action="logout-mobile"]')
    expect(logoutItem.attributes('data-divided')).toBe('true')
    expect(logoutItem.classes()).toContain('lumal-admin-header-actions__mobile-danger')

    dropdown.vm.$emit('command', 'cockpit')
    dropdown.vm.$emit('command', 'settings')
    dropdown.vm.$emit('command', 'profile')
    dropdown.vm.$emit('command', 'logout')

    expect(openSpy).toHaveBeenCalledWith('http://localhost:5180/', '_blank', 'noopener,noreferrer')
    expect(wrapper.emitted('openSettings')).toHaveLength(1)
    expect(wrapper.emitted('openProfile')).toHaveLength(1)
    expect(wrapper.emitted('logout')).toHaveLength(1)
    openSpy.mockRestore()
  })

  it('移动端仅显示两个 36px 入口且桌面动作保持原尺寸', async () => {
    const source = await readFile(join(process.cwd(), 'src/components/app/AppHeaderActions.vue'), 'utf8')
    const mobileStart = source.indexOf('@media (max-width: 768px)')
    const mobileStyles = source.slice(mobileStart)

    expect(mobileStart).toBeGreaterThan(-1)
    expect(source.slice(0, mobileStart)).toMatch(/:deep\(\.el-button\)\s*\{\s*width:\s*44px;\s*height:\s*44px;/)
    expect(mobileStyles).toMatch(/\.lumal-admin-header-actions__desktop-only\s*\{\s*display:\s*none;/)
    expect(mobileStyles).toMatch(/\.lumal-admin-header-actions__mobile-menu\s*\{\s*display:\s*inline-flex;/)
    expect(mobileStyles).toMatch(/:deep\(\.el-button\)\s*\{\s*width:\s*36px;\s*height:\s*36px;/)
    expect(source).toMatch(/\.lumal-admin-header-actions__mobile-trigger\s*\{[\s\S]*?width:\s*36px;[\s\S]*?height:\s*36px;/)
  })
})

describe('app settings drawer', () => {
  it('会包裹主题设置面板并透传偏好变更', async () => {
    const preferences = createAdminPreferences()
    const wrapper = mount(AppSettingsDrawer, {
      global: {
        stubs: {
          ElDrawer: DrawerStub,
          LumalThemeSettingsPanel: ThemeSettingsPanelStub,
        },
      },
      props: {
        preferences,
        visible: true,
      },
    })

    expect(wrapper.find('.el-drawer').attributes('data-title')).toBe('偏好设置')
    expect(wrapper.find('.el-drawer').attributes('data-size')).toBe('384px')
    expect(wrapper.text()).toContain('自定义偏好设置 & 实时预览')

    await wrapper.find('.theme-panel-stub').trigger('click')

    expect(wrapper.emitted('change')?.[0]).toEqual([preferences])
    expect(wrapper.emitted('update:preferences')?.[0]).toEqual([preferences])
  })
})
