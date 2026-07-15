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
  browserDiagnostics: [async ({ page }, use) => {
    const diagnostics: BrowserDiagnostic[] = []
    const expectedHttpErrors: ExpectedHttpError[] = []

    function recordConsole(message: ConsoleMessage): void {
      if (message.type() !== 'warning' && message.type() !== 'error') {
        return
      }

      const text = message.text().trim()
      if (!ignoredBrowserDiagnostics.has(text)) {
        const location = message.location()
        diagnostics.push({
          kind: `console.${message.type()}`,
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

    await use({
      expectHttpError(path, status, count = 1) {
        expectedHttpErrors.push({ count, path, status })
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
      [...unexpected.map(formatDiagnostic), ...missing],
      '页面不应产生未声明的 console warning/error 或未捕获异常',
    ).toEqual([])
  }, { auto: true }],
})

export { expect }
