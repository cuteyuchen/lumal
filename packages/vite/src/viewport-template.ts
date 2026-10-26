import type { ElementNode, TemplateChildNode } from '@vue/compiler-dom'
import type { walkIdentifiers } from '@vue/compiler-sfc'
import type { ViewportTransformOptions } from './viewport-transform'
import { NodeTypes } from '@vue/compiler-dom'
import { babelParse, MagicString, parse as parseSfc } from '@vue/compiler-sfc'
import { parse } from 'postcss'
import selectorParser from 'postcss-selector-parser'
import { createViewportCssTransformer } from './viewport-css'
import { createViewportSelectorFilter } from './viewport-selector'

type ExpressionNode = Parameters<typeof walkIdentifiers>[0]

function escapeAttribute(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('\'', '&#39;').replaceAll('<', '&lt;')
}

/** 仅修改模板 AST 中明确的 style 值，不解析脚本块或其他属性表达式。 */
export function transformViewportTemplate(code: string, id: string, options: ViewportTransformOptions): { code: string, map: string } | undefined {
  const { descriptor, errors } = parseSfc(code, { filename: id })
  const template = descriptor.template
  if (errors.length || !template?.ast || template.src || (template.lang && template.lang !== 'html'))
    return
  const transformDeclaration = createViewportCssTransformer(options)
  const excludedSelector = createViewportSelectorFilter(options.excludeSelectors, false)
  const output = new MagicString(code)
  function transformCss(value: string, property?: string) {
    try {
      const root = parse(value, { from: id })
      if (root.nodes.some(node => node.type !== 'decl' && node.type !== 'comment'))
        return value
      if (property && (root.nodes.length !== 1 || root.first?.type !== 'decl' || root.first.prop !== property))
        return value
      root.walkDecls(transformDeclaration)
      return root.toString()
    }
    catch {
      return value
    }
  }
  function transformProperty(property: string, value: string) {
    const name = property.startsWith('--') ? property : property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^ms-/, '-ms-')
    const source = `${name}:${value}`
    const transformed = transformCss(source, name)
    return transformed === source ? value : transformed.slice(name.length + 1)
  }
  function transformExpression(expression: string) {
    const text = new MagicString(expression)
    try {
      // 括号只用于让对象字面量被解析为表达式；所有偏移减去这一字符。
      const ast = babelParse(`(${expression})`, { sourceType: 'module', plugins: ['typescript'] })
      const statement = ast.program.body[0]
      if (ast.program.body.length !== 1 || statement?.type !== 'ExpressionStatement')
        return expression
      function literal(node: ExpressionNode, transform: (value: string) => string) {
        const value = node.type === 'StringLiteral'
          ? node.value
          : node.type === 'TemplateLiteral' && !node.expressions.length
            ? node.quasis[0]?.value.cooked
            : undefined
        if (value === undefined || value === null || node.start == null || node.end == null)
          return
        const result = transform(value)
        if (result !== value)
          text.overwrite(node.start - 1, node.end - 1, JSON.stringify(result))
      }
      function propertyValue(node: ExpressionNode, name: string) {
        if (node.type === 'ArrayExpression') {
          for (const element of node.elements) {
            if (element)
              propertyValue(element, name)
          }
        }
        else {
          literal(node, value => transformProperty(name, value))
        }
      }
      function style(node: ExpressionNode) {
        if (node.type === 'ArrayExpression') {
          for (const element of node.elements) {
            if (element)
              style(element)
          }
        }
        else if (node.type === 'ObjectExpression') {
          for (const property of node.properties) {
            if (property.type !== 'ObjectProperty')
              continue
            const ignored = property.leadingComments?.some(comment => /^\s*lumal-viewport-ignore-next\s*$/.test(comment.value))
              || property.trailingComments?.some(comment => /^\s*lumal-viewport-ignore\s*$/.test(comment.value))
            if (ignored)
              continue
            const name = property.key.type === 'StringLiteral'
              ? property.key.value
              : !property.computed && property.key.type === 'Identifier' ? property.key.name : undefined
            if (name !== undefined)
              propertyValue(property.value, name)
          }
        }
        else if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression' || node.type === 'TSNonNullExpression') {
          style(node.expression)
        }
        else {
          literal(node, transformCss)
        }
      }
      style(statement.expression)
      return text.toString()
    }
    catch {
      // 调用、拼接、条件、变量和无法解析的语法都不求值，留给运行时处理。
      return expression
    }
  }
  function selector(element: ElementNode) {
    let value = selectorParser.tag({ value: element.tag }).toString()
    let presence = value
    let uncertain = false
    // 静态 style 同时保留值与存在两种表示；绑定仅声明存在，不求值表达式。
    function append(token: string, presenceToken = token) {
      value += token
      presence += presenceToken
    }
    for (const property of element.props) {
      if (property.type === NodeTypes.ATTRIBUTE) {
        if (property.name === 'class') {
          for (const name of property.value?.content.split(/\s+/).filter(Boolean) ?? [])
            append(selectorParser.className({ value: name }).toString())
        }
        else if (property.name === 'id' && property.value) {
          append(selectorParser.id({ value: property.value.content }).toString())
        }
        else {
          const attribute = selectorParser.attribute({
            attribute: property.name,
            value: undefined,
            raws: {},
          })
          if (property.value) {
            attribute.operator = '='
            attribute.setValue(property.value.content, { quoteMark: '"' })
          }
          append(attribute.toString(), property.name === 'style' ? '[style]' : undefined)
        }
      }
      if (property.type === NodeTypes.DIRECTIVE && property.name === 'bind') {
        if (property.arg?.type === NodeTypes.SIMPLE_EXPRESSION && property.arg.isStatic && property.arg.content === 'style')
          append('[style]')
        else
          uncertain = true
      }
    }
    return { value, presence, uncertain }
  }
  function visit(nodes: TemplateChildNode[], ancestors = '', presenceAncestors = '') {
    let ignoreNext = false
    for (const node of nodes) {
      if (node.type === NodeTypes.COMMENT && node.content.trim() === 'lumal-viewport-ignore')
        ignoreNext = true
      if (node.type !== NodeTypes.ELEMENT)
        continue
      if (ignoreNext) {
        ignoreNext = false
        continue
      }
      const current = selector(node)
      const path = `${ancestors} ${current.value}`.trim()
      const presencePath = `${presenceAncestors} ${current.presence}`.trim()
      // 动态选择器属性可能命中排除项，无法证明安全时不猜测最终值。
      if (excludedSelector(path) || excludedSelector(presencePath) || (options.excludeSelectors?.length && current.uncertain))
        continue
      for (const property of node.props) {
        if (property.type === NodeTypes.ATTRIBUTE && property.name === 'style' && property.value) {
          const value = transformCss(property.value.content)
          if (value !== property.value.content) {
            const quote = property.value.loc.source.startsWith('\'') ? '\'' : '"'
            output.overwrite(property.value.loc.start.offset, property.value.loc.end.offset, `${quote}${escapeAttribute(value)}${quote}`)
          }
        }
        if (property.type === NodeTypes.DIRECTIVE && property.name === 'bind'
          && property.arg?.type === NodeTypes.SIMPLE_EXPRESSION && property.arg.isStatic && property.arg.content === 'style'
          && property.exp?.type === NodeTypes.SIMPLE_EXPRESSION) {
          const value = transformExpression(property.exp.content)
          if (value !== property.exp.content)
            output.overwrite(property.exp.loc.start.offset, property.exp.loc.end.offset, escapeAttribute(value))
        }
      }
      visit(node.children, path, presencePath)
    }
  }
  visit(template.ast.children)
  if (output.hasChanged())
    return { code: output.toString(), map: output.generateMap({ source: id, includeContent: true, hires: true }).toString() }
}
