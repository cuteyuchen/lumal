import type {
  CreateLumalAdminProjectOptions,
  CreateLumalAdminProjectResult,
} from './scaffold.js'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createLumalAdminProject as createScaffoldProject } from './scaffold.js'

interface GeneratedPackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  [key: string]: unknown
}

const requiredDependencies = {
  '@iconify/vue': '^5.0.0',
}

const requiredDevDependencies = {
  'sass-embedded': '^1.95.1',
}

function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  )
}

async function completeGeneratedPackage(targetDir: string): Promise<void> {
  const packageJsonPath = join(targetDir, 'package.json')
  const packageJson = JSON.parse(
    await readFile(packageJsonPath, 'utf8'),
  ) as GeneratedPackageJson

  packageJson.dependencies = sortRecord({
    ...packageJson.dependencies,
    ...requiredDependencies,
  })
  packageJson.devDependencies = sortRecord({
    ...packageJson.devDependencies,
    ...requiredDevDependencies,
  })

  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
}

export async function createLumalAdminProject(
  options: CreateLumalAdminProjectOptions,
): Promise<CreateLumalAdminProjectResult> {
  const result = await createScaffoldProject(options)
  await completeGeneratedPackage(result.targetDir)
  return result
}
