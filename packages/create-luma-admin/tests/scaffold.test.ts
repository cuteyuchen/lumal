import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createLumaAdminProject } from '../src/scaffold'

/***********************测试目录*********************/
async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'luma-create-'))
}

describe('createLumaAdminProject', () => {
  it('会生成使用公开包入口的最小 Luma Admin 应用', async () => {
    const tempDir = await createTempDir()
    const targetDir = join(tempDir, 'demo-admin')

    try {
      const result = await createLumaAdminProject({
        name: 'demo-admin',
        targetDir,
      })

      const packageJson = await readFile(join(targetDir, 'package.json'), 'utf8')
      const mainTs = await readFile(join(targetDir, 'src/main.ts'), 'utf8')
      const appVue = await readFile(join(targetDir, 'src/App.vue'), 'utf8')
      const requestExample = await readFile(join(targetDir, 'src/composables/useMockRequestExample.ts'), 'utf8')
      const requestPanel = await readFile(join(targetDir, 'src/components/request/RequestExamplePanel.vue'), 'utf8')
      const stylesScss = await readFile(join(targetDir, 'src/styles.scss'), 'utf8')

      expect(result.createdFiles).toEqual([
        'index.html',
        'package.json',
        'src/App.vue',
        'src/components/request/RequestExamplePanel.vue',
        'src/composables/useMockRequestExample.ts',
        'src/main.ts',
        'src/styles.scss',
        'tsconfig.json',
        'vite.config.ts',
      ])
      expect(packageJson).toContain('"name": "demo-admin"')
      expect(packageJson).toContain('"@luma/core"')
      expect(packageJson).toContain('"element-plus"')
      expect(mainTs).toContain('import { createLumaAdmin } from \'@luma/core\'')
      expect(mainTs).toContain('import \'@luma/core/theme-chalk/index.scss\'')
      expect(appVue).toContain('<script setup lang="ts">')
      expect(appVue).toContain('/***********************页面状态*********************/')
      expect(appVue).toContain('LumaLayout')
      expect(appVue).toContain('LumaCrudTable')
      expect(appVue).toContain('RequestExamplePanel')
      expect(requestExample).toContain('createRequestClient')
      expect(requestExample).toContain('getToken')
      expect(requestExample).toContain('onResponse')
      expect(requestPanel).toContain('<style scoped lang="scss">')
      expect(stylesScss).toContain('.luma-admin-template')
    }
    finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('目标目录非空时会拒绝覆盖已有文件', async () => {
    const tempDir = await createTempDir()

    try {
      await createLumaAdminProject({
        name: 'demo-admin',
        targetDir: tempDir,
      })

      await expect(createLumaAdminProject({
        name: 'demo-admin',
        targetDir: tempDir,
      })).rejects.toThrow('目标目录不是空目录')
    }
    finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })
})
