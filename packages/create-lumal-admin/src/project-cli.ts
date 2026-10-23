#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { main } from './cli.js'

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(resolve(process.argv[1]))).href) {
  main(process.argv.slice(2), true).catch((error: unknown) => {
    console.error(`创建失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}
