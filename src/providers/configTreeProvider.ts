import * as vscode from 'vscode'
import { ConfigTreeItem } from './configTreeItem.js'
import { readIntegrationConfig } from '../lib/configReaders.js'
import { publicGlobalConfig } from '../lib/globalConfig.js'

export class ConfigTreeProvider implements vscode.TreeDataProvider<ConfigTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ConfigTreeItem | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<ConfigTreeItem | undefined | void> = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: ConfigTreeItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: ConfigTreeItem): ConfigTreeItem[] {
    if (!element) return this.getRootItems()
    if (element.itemType === 'integration') return this.getIntegrationProperties(element.label)
    return []
  }

  private getRootItems(): ConfigTreeItem[] {
    const items: ConfigTreeItem[] = []

    // Global config node
    const globalItem = new ConfigTreeItem(
      'Global Config',
      'root',
      vscode.TreeItemCollapsibleState.Expanded,
      'HypersHub global configuration (click to configure)',
      undefined,
      new vscode.ThemeIcon('settings-gear'),
    )
    globalItem.id = 'global'
    globalItem.command = { command: 'hypershub.configure', title: 'Configure' }
    items.push(globalItem)

    // Integration nodes
    const integrationIds = ['claude-code', 'codex', 'opencode']
    for (const id of integrationIds) {
      const cfg = readIntegrationConfig(id)
      const icon = cfg.exists ? new vscode.ThemeIcon('check') : new vscode.ThemeIcon('circle-outline')
      const item = new ConfigTreeItem(
        id,
        'integration',
        vscode.TreeItemCollapsibleState.Collapsed,
        cfg.exists ? `Configured at ${Object.values(cfg.files)[0]}` : 'Not configured (click to configure)',
        undefined,
        icon,
      )
      item.id = id
      item.command = { command: 'hypershub.configureIntegration', title: 'Configure', arguments: [id] }
      items.push(item)
    }

    return items
  }

  private getGlobalProperties(): ConfigTreeItem[] {
    const cfg = publicGlobalConfig()
    return [
      new ConfigTreeItem(`Base URL: ${cfg.baseUrl || '(not set)'}`, 'property', vscode.TreeItemCollapsibleState.None, cfg.baseUrl),
      new ConfigTreeItem(`API Key: ${cfg.apiKey || '(not set)'}`, 'property', vscode.TreeItemCollapsibleState.None),
      new ConfigTreeItem(`Default Model: ${cfg.defaultModel || '(not set)'}`, 'property', vscode.TreeItemCollapsibleState.None, cfg.defaultModel),
    ]
  }

  private getIntegrationProperties(id: string): ConfigTreeItem[] {
    if (id === 'global') return this.getGlobalProperties()

    const cfg = readIntegrationConfig(id)
    if (!cfg.exists) {
      return [new ConfigTreeItem('Not configured', 'property', vscode.TreeItemCollapsibleState.None)]
    }

    const props: ConfigTreeItem[] = []
    const filePath = Object.values(cfg.files)[0]
    props.push(new ConfigTreeItem(`Config: ${filePath}`, 'property', vscode.TreeItemCollapsibleState.None, filePath))

    if (cfg.baseUrl) {
      props.push(new ConfigTreeItem(`URL: ${cfg.baseUrl}`, 'property', vscode.TreeItemCollapsibleState.None, cfg.baseUrl))
    }
    if (cfg.model) {
      props.push(new ConfigTreeItem(`Model: ${cfg.model}`, 'property', vscode.TreeItemCollapsibleState.None, cfg.model))
    }
    props.push(new ConfigTreeItem(`Key: ${cfg.key ? `${cfg.key.slice(0, 3)}****${cfg.key.slice(-4)}` : '(not set)'}`, 'property', vscode.TreeItemCollapsibleState.None))

    return props
  }
}
