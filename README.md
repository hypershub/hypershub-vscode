# HypersHub VS Code Extension

[![Version](https://img.shields.io/vscode-marketplace/v/hypershub.hypershub-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=hypershub.hypershub-vscode)
[![Installs](https://img.shields.io/vscode-marketplace/i/hypershub.hypershub-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=hypershub.hypershub-vscode)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Configure Codex, Claude Code, and OpenCode for HypersHub through a graphical interface — no terminal needed.

<img src="media/1.global-config.png" alt="Global Configuration" width="600" />

<img src="media/2.model-config.png" alt="Integration Configuration" width="600" />

## Features

- **Global Configuration** — Manage Base URL and API Key with auto-fetched model list
- **Codex** — Select a model → Apply → writes `~/.codex/config.toml` automatically
- **Claude Code** — Select a model → Apply → syncs `~/.claude/settings.json` automatically
- **OpenCode** — Select a model → Apply → writes `~/.config/opencode/opencode.json` automatically
- **Connection Test** — Prompted automatically after Apply, or run manually
- **Status Overview** — TreeView shows configuration status at a glance

## Installation

```bash
code --install-extension hypershub.hypershub-vscode
```

Or search **HypersHub** in the VS Code extensions marketplace.

## Usage

1. Click the HypersHub icon in the Activity Bar
2. Open **Global Config**, enter your Base URL and API Key
3. Click an integration (Codex / Claude Code / OpenCode), select a model, and click **Apply**
4. Optionally test the connection when prompted

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
