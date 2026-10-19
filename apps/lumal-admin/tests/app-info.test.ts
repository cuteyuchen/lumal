// @vitest-environment node

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAdminBuildInfo } from '../build/app-info'

const git = vi.hoisted(() => vi.fn())
vi.mock('node:child_process', () => ({
  default: { execFileSync: git },
  execFileSync: git,
}))

function installedVersion(name: string): string {
  return JSON.parse(readFileSync(join(process.cwd(), 'node_modules', name, 'package.json'), 'utf8')).version
}

describe('admin build info', () => {
  beforeEach(() => {
    git.mockReset()
    git.mockReturnValueOnce('8e54553\n').mockReturnValueOnce('')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T02:03:04Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('使用框架包和依赖的精确安装版本，并生成固定构建时间', () => {
    const info = createAdminBuildInfo('production')

    expect(info).toMatchObject({
      builtAt: '2026-10-19T02:03:04.000Z',
      commit: '8e54553',
      license: 'MIT',
      mode: 'production',
      version: installedVersion('@lumal/core'),
    })
    expect(info.version).not.toBe('0.0.0')
    expect(info.dependencies).toMatchObject({
      '@lumal/core': installedVersion('@lumal/core'),
      'echarts': installedVersion('echarts'),
      'vue': installedVersion('vue'),
      'vue-echarts': installedVersion('vue-echarts'),
    })
    expect(info.devDependencies.vite).toBe(installedVersion('vite'))
    expect(Object.keys(info.dependencies)).toEqual(Object.keys(info.dependencies).sort())
    expect(Object.values(info.dependencies).some(version => /^[~^]/.test(version))).toBe(false)
  })

  it('未提交的已跟踪文件变更会标记 dirty，避免误认为是原始提交产物', () => {
    git.mockReset()
    git.mockReturnValueOnce('8e54553\n').mockReturnValueOnce(' M src/App.vue\n')

    expect(createAdminBuildInfo('development').commit).toBe('8e54553-dirty')
  })

  it('没有 Git 信息时仍可生成版本与构建时间', () => {
    git.mockReset()
    git.mockImplementation(() => {
      throw new Error('not a git repository')
    })

    expect(createAdminBuildInfo('production')).toMatchObject({
      builtAt: '2026-10-19T02:03:04.000Z',
      commit: '未记录',
      version: installedVersion('@lumal/core'),
    })
  })
})
