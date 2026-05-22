import * as vscode from 'vscode'
import { ConfigTreeProvider } from './providers/configTreeProvider.js'
import { GlobalConfigPanel } from './panel/globalConfigPanel.js'
import { IntegrationConfigPanel } from './panel/integrationConfigPanel.js'

let outputChannel: vscode.OutputChannel
let statusBarItem: vscode.StatusBarItem | undefined

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel('HypersHub')
  context.subscriptions.push(outputChannel)

  // TreeView provider
  const treeProvider = new ConfigTreeProvider()
  context.subscriptions.push(
    vscode.window.createTreeView('hypershubConfig', { treeDataProvider: treeProvider }),
  )

  // Status bar
  const enableStatusBar = vscode.workspace.getConfiguration('hypershub').get('enableStatusBar', true)
  if (enableStatusBar) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10)
    statusBarItem.command = 'hypershub.configure'
    statusBarItem.text = '$(plug) HypersHub'
    statusBarItem.tooltip = 'Configure HypersHub integrations'
    statusBarItem.show()
    context.subscriptions.push(statusBarItem)
  }

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('hypershub.configure', () =>
      GlobalConfigPanel.createOrShow(context.extensionUri, treeProvider),
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('hypershub.configureIntegration', (integrationId: string) =>
      IntegrationConfigPanel.createOrShow(integrationId, context.extensionUri, treeProvider, outputChannel),
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('hypershub.refreshStatus', () =>
      treeProvider.refresh(),
    ),
  )
}

export function deactivate(): void {
  // Cleanup handled by context.subscriptions
}
