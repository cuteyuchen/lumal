import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseSfc } from '@vue/compiler-sfc'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skillRoot = join(root, 'skills/lumal')
const markdownFiles = readdirSync(skillRoot, { recursive: true })
  .filter(file => file.endsWith('.md'))
const packages = new Map(readdirSync(join(root, 'packages')).map((directory) => {
  const manifest = JSON.parse(readFileSync(join(root, 'packages', directory, 'package.json'), 'utf8')) as {
    name: string
    exports: Record<string, unknown>
  }
  return [manifest.name, manifest] as const
}))

describe('lumal Skill 分发契约', () => {
  it('入口可以通过 YAML 元信息发现', () => {
    const entry = readFileSync(join(skillRoot, 'SKILL.md'), 'utf8')
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(entry)
    expect(frontmatter).not.toBeNull()
    const metadata = parseYaml(frontmatter![1]) as { name: unknown, description: unknown }
    expect(metadata.name).toBe('lumal')
    expect(metadata.description).toBeTypeOf('string')
    expect(String(metadata.description).trim().length).toBeGreaterThan(0)
  })

  it.each(markdownFiles)('%s 的相对链接可随整个 Skill 独立分发', (file) => {
    const content = readFileSync(join(skillRoot, file), 'utf8')
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const href = match[1]
      if (href.startsWith('#') || /^[a-z][\w+.-]*:/i.test(href))
        continue
      const target = resolve(dirname(join(skillRoot, file)), decodeURIComponent(href.split(/[?#]/)[0]))
      const inside = relative(skillRoot, target)
      expect(isAbsolute(inside) || inside === '..' || inside.startsWith(`..${sep}`), href).toBe(false)
      expect(statSync(target).isFile(), `${file}: ${href}`).toBe(true)
    }
  })

  it.each(markdownFiles)('%s 的代码示例只从 Lumal 公开 exports 导入', (file) => {
    const content = readFileSync(join(skillRoot, file), 'utf8')
    for (const match of content.matchAll(/```(ts|typescript|vue)\r?\n([\s\S]*?)\r?\n```/g)) {
      let scripts = [match[2]]
      if (match[1] === 'vue') {
        // Vue 示例可以是完整 SFC，也可以是只有组件标签的模板接线片段。
        const code = /<(?:script|template)(?:\s|>)/.test(match[2])
          ? match[2]
          : `<template>\n${match[2]}\n</template>`
        const { descriptor, errors } = parseSfc(code)
        expect(errors, file).toEqual([])
        scripts = [descriptor.script, descriptor.scriptSetup].flatMap(block => block ? [block.content] : [])
      }
      for (const script of scripts) {
        const source = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
        for (const statement of source.statements) {
          if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
            continue
          const specifier = statement.moduleSpecifier.text
          if (!specifier.startsWith('@lumal/'))
            continue
          const [scope, name, ...path] = specifier.split('/')
          const manifest = packages.get(`${scope}/${name}`)
          expect(manifest, `${file}: ${specifier}`).toBeDefined()
          const subpath = path.length ? `./${path.join('/')}` : '.'
          expect(Object.hasOwn(manifest!.exports, subpath), `${file}: ${specifier}`).toBe(true)
        }
      }
    }
  })
})
