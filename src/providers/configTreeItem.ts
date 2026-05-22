import * as vscode from 'vscode'

export type ConfigTreeItemType = 'root' | 'integration' | 'property'

export class ConfigTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly itemType: ConfigTreeItemType,
    collapsibleState: vscode.TreeItemCollapsibleState,
    tooltip?: string,
    contextValue?: string,
    iconPath?: vscode.ThemeIcon,
  ) {
    super(label, collapsibleState)
    this.tooltip = tooltip
    this.contextValue = contextValue
    this.iconPath = iconPath
  }
}
