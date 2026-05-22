import * as vscode from 'vscode'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { resolveCommonOptions } from '../lib/globalConfig.js'
import { fetchAvailableModels } from '../lib/models.js'
import { getIntegration } from '../integrations/index.js'
import { readIntegrationConfig } from '../lib/configReaders.js'
import type { IntegrationOptions } from '../integrations/claudeCode.js'

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

export class IntegrationConfigPanel {
  static readonly viewType = 'hypershub.integrationConfig'
  private panel: vscode.WebviewPanel
  private disposables: vscode.Disposable[] = []
  private integrationId: string
  private treeProvider: { refresh: () => void }

  private outputChannel: vscode.OutputChannel

  constructor(integrationId: string, extensionUri: vscode.Uri, treeProvider: { refresh: () => void }, outputChannel: vscode.OutputChannel) {
    this.integrationId = integrationId
    this.treeProvider = treeProvider
    this.outputChannel = outputChannel

    this.panel = vscode.window.createWebviewPanel(
      IntegrationConfigPanel.viewType,
      `HypersHub: ${integrationId}`,
      vscode.ViewColumn.One,
      { enableScripts: true, localResourceRoots: [] },
    )

    const nonce = crypto.randomUUID()
    const resolved = resolveCommonOptions()
    const cfg = readIntegrationConfig(integrationId)

    // Build model options (initially empty, fetched via message)
    const hasGlobalKey = !!resolved.key
    let modelOptions = '<option value="">' + (hasGlobalKey ? 'Loading...' : 'Configure Global Config first') + '</option>'

    // If there's a current model, we'll pre-select it after fetch via message
    const currentModel = cfg.model || ''

    let html = fs.readFileSync(path.join(extensionUri.fsPath, 'panel', 'integrationConfig.html'), 'utf8')
    html = html.replace(/\{\{nonce\}\}/g, nonce)
    html = html.replace(/\{\{integrationId\}\}/g, escapeHtml(integrationId))
    html = html.replace(/\{\{statusClass\}\}/g, cfg.exists ? 'ok' : 'warn')
    html = html.replace(/\{\{statusText\}\}/g, cfg.exists ? 'Configured' : 'Not configured')
    html = html.replace(/\{\{filePath\}\}/g, escapeHtml(Object.values(cfg.files)[0] || '-'))
    html = html.replace(/\{\{baseUrl\}\}/g, escapeHtml(cfg.baseUrl || resolved.baseUrl || '-'))
    html = html.replace(/\{\{modelOptions\}\}/g, modelOptions)

    this.panel.webview.html = html
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)
    this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this.disposables)
  }

  static createOrShow(integrationId: string, extensionUri: vscode.Uri, treeProvider: { refresh: () => void }, outputChannel: vscode.OutputChannel): IntegrationConfigPanel {
    return new IntegrationConfigPanel(integrationId, extensionUri, treeProvider, outputChannel)
  }

  private async handleMessage(msg: { command: string; data?: Record<string, unknown> }): Promise<void> {
    switch (msg.command) {
      case 'fetchModels':
        await this.doFetchModels()
        break
      case 'apply':
        await this.doApply(msg.data as { model: string })
        break
      case 'testConnection':
        await this.doTestConnection(msg.data as { model: string })
        break
    }
  }

  private async doFetchModels(): Promise<void> {
    const resolved = resolveCommonOptions()
    if (!resolved.key) {
      this.panel.webview.postMessage({ command: 'error', data: { message: 'Configure Global Config first' } })
      return
    }
    try {
      const models = await fetchAvailableModels({ apiBaseUrl: resolved.apiBaseUrl, key: resolved.key })
      const cfg = readIntegrationConfig(this.integrationId)
      this.panel.webview.postMessage({
        command: 'setModels',
        data: {
          models: models.map((m) => ({ id: m.id, provider: m.provider, displayName: m.displayName })),
          currentModel: cfg.model || '',
        },
      })
    } catch {
      this.panel.webview.postMessage({ command: 'setModels', data: { models: [], currentModel: '' } })
    }
  }

  private async doApply(data: { model: string }): Promise<void> {
    const resolved = resolveCommonOptions()
    const integration = getIntegration(this.integrationId)
    if (!integration || !data.model) return

    this.outputChannel.appendLine(`[${this.integrationId}] Apply: model=${data.model}`)

    const opts: IntegrationOptions = {
      baseUrl: resolved.baseUrl,
      apiBaseUrl: resolved.apiBaseUrl,
      key: resolved.key,
      model: data.model,
    }

    try {
      await integration.configure(opts)
      this.outputChannel.appendLine(`[${this.integrationId}] Configured successfully with model=${data.model}`)
      // Verify by reading back
      const verify = readIntegrationConfig(this.integrationId)
      this.outputChannel.appendLine(`[${this.integrationId}] Verify read: model=${verify.model}`)
      this.treeProvider.refresh()
      this.panel.webview.postMessage({ command: 'applyResult', data: { ok: true, message: 'Configuration applied' } })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.outputChannel.appendLine(`[${this.integrationId}] Apply FAILED: ${msg}`)
      this.panel.webview.postMessage({ command: 'applyResult', data: { ok: false, message: msg } })
    }
  }

  private async doTestConnection(data: { model: string }): Promise<void> {
    const resolved = resolveCommonOptions()
    const integration = getIntegration(this.integrationId)
    if (!integration) return

    const opts: IntegrationOptions = {
      baseUrl: resolved.baseUrl,
      apiBaseUrl: resolved.apiBaseUrl,
      key: resolved.key,
      model: data.model,
    }

    try {
      const result = await integration.test(opts)
      this.panel.webview.postMessage({ command: 'testResult', data: { ok: result.ok, message: result.message } })
    } catch (err) {
      this.panel.webview.postMessage({ command: 'testResult', data: { ok: false, message: err instanceof Error ? err.message : String(err) } })
    }
  }

  private dispose(): void {
    this.disposables.forEach((d) => d.dispose())
  }
}
