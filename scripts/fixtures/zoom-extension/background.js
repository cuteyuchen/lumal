// 仅在隔离的临时 Chromium profile 加载，由验收脚本调用 tabs.setZoom。
globalThis.chrome.runtime.onInstalled.addListener(() => {})
