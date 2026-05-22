# HypersHub VS Code Extension

[![Version](https://img.shields.io/vscode-marketplace/v/hypershub.hypershub-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=hypershub.hypershub-vscode)
[![Installs](https://img.shields.io/vscode-marketplace/i/hypershub.hypershub-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=hypershub.hypershub-vscode)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

在 VS Code 中图形化管理 HypersHub 集成配置，无需打开终端即可完成 Codex、Claude Code、OpenCode 的接入、模型切换与连通性测试。

## Features

- **Global Configuration** — 管理 Base URL 和 API Key，自动拉取模型列表
- **Codex** — 选择模型 → Apply → 自动写入 `~/.codex/config.toml`
- **Claude Code** — 选择模型 → Apply → 自动同步 `~/.claude/settings.json`
- **OpenCode** — 选择模型 → Apply → 自动写入 `~/.config/opencode/opencode.json`
- **Connection Test** — Apply 后自动询问是否测试，或手动测试
- **Status Overview** — TreeView 中直观显示各集成配置状态

## Installation

在 VS Code 中安装：

```bash
code --install-extension hypershub.hypershub-vscode
```

或直接在扩展商店搜索 **HypersHub**。

## Usage

1. 安装后在 Activity Bar 中点击 HypersHub 图标
2. 点击 **Global Config** 进入全局配置，输入 Base URL 和 API Key
3. 点击对应的集成项（Codex / Claude Code / OpenCode），选择模型后 Apply
4. Apply 后可选测试连通性

## Requirements

- VS Code 1.85+
- Node.js 20+

## Links

- [GitHub](https://github.com/hypershub/hypershub-vscode)
- [Marketplace](https://marketplace.visualstudio.com/items?itemName=hypershub.hypershub-vscode)
- [HypersHub SDK](https://github.com/hypershub/typescript-sdk)
- [HypersHub CLI](https://github.com/hypershub/hypershub-cli)

## License

MIT
