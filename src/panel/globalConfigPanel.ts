import * as vscode from 'vscode'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { resolveCommonOptions, saveCommonOptions } from '../lib/globalConfig.js'
import { fetchAvailableModels } from '../lib/models.js'

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

export class GlobalConfigPanel {
  static readonly viewType = 'hypershub.globalConfig'
  private panel: vscode.WebviewPanel
  private disposables: vscode.Disposable[] = []

  constructor(extensionUri: vscode.Uri, private treeProvider: { refresh: () => void }) {
    this.panel = vscode.window.createWebviewPanel(
      GlobalConfigPanel.viewType,
      'HypersHub Global Configuration',
      vscode.ViewColumn.One,
      { enableScripts: true, localResourceRoots: [] },
    )

    const nonce = crypto.randomUUID()
    const cfg = resolveCommonOptions()

    // Pre-fetch models
    let modelCount = 'Enter URL and API Key to fetch models'
    let modelListHtml = '<div class="model-item" style="color:var(--vscode-descriptionForeground)">Enter URL and API Key to fetch models</div>'

    if (cfg.baseUrl && cfg.key) {
      modelCount = 'Fetching models...'
      modelListHtml = '<div class="model-item" style="color:var(--vscode-descriptionForeground)">Fetching...</div>'
      const apiBaseUrl = cfg.baseUrl.endsWith('/v1') ? cfg.baseUrl : `${cfg.baseUrl.replace(/\/+$/, '')}/v1`
      fetchAvailableModels({ apiBaseUrl, key: cfg.key }).then(models => {
        const items = models.map(m =>
          `<div class="model-item"><span class="model-name">${escapeHtml(m.id)}</span><span class="model-provider">${escapeHtml(m.provider)}</span></div>`
        ).join('')
        this.panel.webview.postMessage({ command: 'setModels', data: { modelsHtml: items, count: models.length } })
      }).catch(() => {})
    }

    let html = fs.readFileSync(path.join(extensionUri.fsPath, 'panel', 'globalConfig.html'), 'utf8')
    html = html.replace(/\{\{baseUrl\}\}/g, escapeHtml(cfg.baseUrl || ''))
    html = html.replace(/\{\{apiKey\}\}/g, escapeHtml(cfg.key || ''))
    html = html.replace(/\{\{modelCount\}\}/g, modelCount)
    html = html.replace(/\{\{modelListHtml\}\}/g, modelListHtml)
    html = html.replace(/\{\{nonce\}\}/g, nonce)

    this.panel.webview.html = html
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)
    this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this.disposables)
  }

  static createOrShow(extensionUri: vscode.Uri, treeProvider: { refresh: () => void }): GlobalConfigPanel {
    return new GlobalConfigPanel(extensionUri, treeProvider)
  }

  private async handleMessage(msg: { command: string; data?: Record<string, unknown> }): Promise<void> {
    if (msg.command === 'save') {
      const data = msg.data as { baseUrl: string; apiKey: string }
      if (!data.baseUrl || !data.apiKey) {
        this.panel.webview.postMessage({ command: 'saveResult', data: { ok: false, message: 'All fields required' } })
        return
      }
      saveCommonOptions({ baseUrl: data.baseUrl, key: data.apiKey })
      this.treeProvider.refresh()

      // Fetch and return models
      const apiBaseUrl = data.baseUrl.endsWith('/v1') ? data.baseUrl : `${data.baseUrl.replace(/\/+$/, '')}/v1`
      try {
        const models = await fetchAvailableModels({ apiBaseUrl, key: data.apiKey })
        const items = models.map(m =>
          `<div class="model-item"><span class="model-name">${escapeHtml(m.id)}</span><span class="model-provider">${escapeHtml(m.provider)}</span></div>`
        ).join('')
        this.panel.webview.postMessage({
          command: 'saveResult',
          data: { ok: true, message: 'Saved successfully', modelsHtml: items, count: models.length },
        })
      } catch {
        this.panel.webview.postMessage({ command: 'saveResult', data: { ok: true, message: 'Saved (models unavailable)' } })
      }
    }
  }

  private dispose(): void {
    this.disposables.forEach((d) => d.dispose())
  }
}
