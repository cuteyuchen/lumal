import { access, chmod, readFile } from 'node:fs/promises'

// 版本在生成时直接读取随 tarball 发布的 package.json，不再替换编译产物中的字符串。
const manifest = JSON.parse(await readFile('package.json', 'utf8'))
const template = JSON.parse(await readFile('templates/base/package.json', 'utf8'))
if (!manifest.version || !template.dependencies['@lumal/core'])
  throw new Error('脚手架版本或公共模板资源缺失')
await access('templates/modes/http/src/app/services/data-source.ts')
await chmod('dist/cli.js', 0o755)
await chmod('dist/project-cli.js', 0o755)
await access('templates/common/package.json')
await access('templates/blank/src/App.vue')
await access('templates/screen/src/screen/ScreenView.vue')
console.log(`create-lumal-admin ${manifest.version} 模板资源校验通过`)
