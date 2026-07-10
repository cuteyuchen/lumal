import { describe, expect, it } from 'vitest'
import { normalizeSchemaFormItems, resolveSchemaFormInitialModel } from '../src/components/schema-form'

describe('schema form normalize', () => {
  it('会过滤隐藏渲染字段但保留隐藏字段默认值', () => {
    const schemas = normalizeSchemaFormItems([
      {
        field: 'id',
        label: 'ID',
        component: 'hidden',
        defaultValue: '1001',
      },
      {
        field: 'name',
        label: '名称',
        component: 'input',
        defaultValue: 'Luma',
      },
    ])

    const model = resolveSchemaFormInitialModel(schemas)

    expect(schemas).toHaveLength(2)
    expect(schemas[0]?.renderable).toBe(false)
    expect(schemas[1]?.renderable).toBe(true)
    expect(model).toEqual({
      id: '1001',
      name: 'Luma',
    })
  })

  it('会为未声明 component 的字段使用 input，并保留传入模型优先级', () => {
    const schemas = normalizeSchemaFormItems([
      {
        field: 'keyword',
        label: '关键词',
        defaultValue: '默认关键词',
      },
    ])

    const model = resolveSchemaFormInitialModel(schemas, {
      keyword: '用户输入',
    })

    expect(schemas[0]?.component).toBe('input')
    expect(model).toEqual({
      keyword: '用户输入',
    })
  })

  it('会归一化布局、状态函数和组件透传配置', () => {
    const schemas = normalizeSchemaFormItems([
      {
        component: 'number',
        componentProps: {
          min: 1,
        },
        defaultValue: 1,
        disabled: context => context.mode === 'view',
        field: 'sort',
        label: '排序',
        readonly: context => context.model.locked === true,
        span: 2,
      },
      {
        component: 'switch',
        field: 'enabled',
        label: '启用',
        props: {
          activeText: '启用',
        },
      },
    ], {
      mode: 'view',
      model: {
        locked: true,
      },
    })

    expect(schemas[0]).toMatchObject({
      component: 'number',
      componentProps: {
        min: 1,
      },
      disabled: true,
      readonly: true,
      span: 2,
    })
    expect(schemas[1]).toMatchObject({
      component: 'switch',
      componentProps: {
        activeText: '启用',
      },
    })
  })
})
