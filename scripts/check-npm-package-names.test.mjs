import { describe, expect, it } from 'vitest'
import {
  classifyNpmViewResult,
  createPackageNameReport,
  getPublishPackageNames,
} from './check-npm-package-names.mjs'

/***********************包名收集*********************/
describe('getPublishPackageNames', () => {
  it('会返回需要发布到 npm 的包名', () => {
    expect(getPublishPackageNames()).toEqual([
      '@luma/icons',
      '@luma/core',
      '@luma/charts',
      '@luma/datav',
      '@luma/cockpit',
      '@luma/vben-compat',
      '@luma/vite',
      'create-luma-admin',
    ])
  })
})

/***********************npm 查询结果*********************/
describe('classifyNpmViewResult', () => {
  it('会把 404 结果识别为包名未占用', () => {
    expect(classifyNpmViewResult({
      exitCode: 1,
      output: 'npm error code E404\nnpm error 404 Not Found',
    })).toBe('not-found')
  })

  it('会把成功查询结果识别为包名已占用', () => {
    expect(classifyNpmViewResult({
      exitCode: 0,
      output: '@scope/pkg\n1.0.0',
    })).toBe('taken')
  })

  it('会把非 404 失败识别为未知状态', () => {
    expect(classifyNpmViewResult({
      exitCode: 1,
      output: 'npm error code E401',
    })).toBe('unknown')
  })
})

/***********************报告生成*********************/
describe('createPackageNameReport', () => {
  it('全部未占用时返回通过状态', () => {
    const report = createPackageNameReport([
      { name: '@luma/core', status: 'not-found' },
      { name: 'create-luma-admin', status: 'not-found' },
    ])

    expect(report.ok).toBe(true)
    expect(report.lines).toContain('[not-found] @luma/core')
    expect(report.lines).toContain('[not-found] create-luma-admin')
  })

  it('存在已占用或未知状态时返回失败状态', () => {
    const report = createPackageNameReport([
      { name: '@luma/core', status: 'taken' },
      { name: 'create-luma-admin', status: 'unknown' },
    ])

    expect(report.ok).toBe(false)
    expect(report.lines).toContain('[taken] @luma/core')
    expect(report.lines).toContain('[unknown] create-luma-admin')
  })
})
