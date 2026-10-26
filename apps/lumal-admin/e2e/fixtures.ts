import type { ConsoleMessage } from '@playwright/test'
import { STATUS_CODES } from 'node:http'
import { test as base, expect } from '@playwright/test'

const ignoredBrowserDiagnostics = new Set([
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded',
])

interface BrowserDiagnostic {
  kind: 'console.error' | 'console.warning' | 'pageerror'
  source?: string
  text: string
}

interface ExpectedHttpError {
  count: number
  path: string
  status: number
}

interface BrowserDiagnostics {
  expectHttpError: (path: string, status: number, count?: number) => void
  allowConsoleWarning: (text: string) => void
}

interface BrowserDiagnosticsFixtures {
  browserDiagnostics: BrowserDiagnostics
}

function formatDiagnostic(diagnostic: BrowserDiagnostic): string {
  const source = diagnostic.source ? ` (${diagnostic.source})` : ''
  return `[${diagnostic.kind}] ${diagnostic.text}${source}`
}

function resolveRequestPath(source?: string): string {
  if (!source) {
    return ''
  }

  try {
    const url = new URL(source)
    return `${url.pathname}${url.search}`
  }
  catch {
    return source
  }
}

export const test = base.extend<BrowserDiagnosticsFixtures>({
  browserDiagnostics: [async ({ page }, use, testInfo) => {
    const diagnostics: BrowserDiagnostic[] = []
    const sourceRequests: string[] = []
    const expectedHttpErrors: ExpectedHttpError[] = []
    const allowedWarnings = new Set<string>()

    function recordConsole(message: ConsoleMessage): void {
      const type = message.type()
      if (type !== 'warning' && type !== 'error') {
        return
      }

      const text = message.text().trim()
      if (type === 'warning' && allowedWarnings.has(text))
        return
      if (!ignoredBrowserDiagnostics.has(text)) {
        const location = message.location()
        diagnostics.push({
          kind: `console.${type}`,
          source: location.url || undefined,
          text,
        })
      }
    }

    function recordPageError(error: Error): void {
      const text = error.message.trim()
      if (!ignoredBrowserDiagnostics.has(text)) {
        diagnostics.push({ kind: 'pageerror', text: error.stack ?? text })
      }
    }

    page.on('console', recordConsole)
    page.on('pageerror', recordPageError)
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname
      if (testInfo.config.metadata.productionPreview && /^\/(?:@vite\/|@id\/|src\/|packages\/)/.test(path))
        sourceRequests.push(path)
    })

    await use({
      expectHttpError(path, status, count = 1) {
        expectedHttpErrors.push({ count, path, status })
      },
      allowConsoleWarning(text) {
        allowedWarnings.add(text)
      },
    })

    page.off('console', recordConsole)
    page.off('pageerror', recordPageError)

    const unexpected = diagnostics.filter((diagnostic) => {
      if (diagnostic.kind !== 'console.error') {
        return true
      }

      const expected = expectedHttpErrors.find(item => (
        item.count > 0
        && item.path === resolveRequestPath(diagnostic.source)
        && diagnostic.text === `Failed to load resource: the server responded with a status of ${item.status} (${STATUS_CODES[item.status]})`
      ))

      if (!expected) {
        return true
      }

      expected.count -= 1
      return false
    })
    const missing = expectedHttpErrors
      .filter(item => item.count > 0)
      .map(item => `[missing console.error x${item.count}] HTTP ${item.status} ${item.path}`)

    expect(
      [...unexpected.map(formatDiagnostic), ...missing, ...sourceRequests.map(path => `[production source request] ${path}`)],
      '页面不应产生未声明的 console warning/error 或未捕获异常',
    ).toEqual([])
  }, { auto: true }],
})

export { expect }
