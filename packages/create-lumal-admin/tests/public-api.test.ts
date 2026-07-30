import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createLumalAdminProject } from '../src'

interface GeneratedPackageJson {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

describe('create-lumal-admin public API', () => {
  it('生成的独立项目包含图标与 Sass 编译依赖', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'lumal-create-public-'))
    const targetDir = join(tempDir, 'demo-admin')

    try {
      await createLumalAdminProject({
        name: 'demo-admin',
        targetDir,
      })

      const packageJson = JSON.parse(
        await readFile(join(targetDir, 'package.json'), 'utf8'),
      ) as GeneratedPackageJson

      expect(packageJson.dependencies['@iconify/vue']).toBe('^5.0.0')
      expect(packageJson.devDependencies['sass-embedded']).toBe('^1.95.1')
    }
    finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })
})
