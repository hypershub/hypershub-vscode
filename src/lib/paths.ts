import path from 'node:path'
import os from 'node:os'

export function isWindows(): boolean {
  return process.platform === 'win32' || process.env.HY_PLATFORM === 'win32'
}

export function homePath(...parts: string[]): string {
  return path.join(os.homedir(), ...parts)
}

/** AppData directory: Windows: %APPDATA%, macOS/Linux: ~/.config */
function appDataDir(): string {
  if (isWindows()) {
    return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
  }
  return process.env.XDG_CONFIG_HOME || homePath('.config')
}

export function appDataPath(...parts: string[]): string {
  return path.join(appDataDir(), ...parts)
}

/** Claude Code settings path: Windows: %APPDATA%/Claude/settings.json, macOS/Linux: ~/.claude/settings.json */
export function claudeSettingsPath(): string {
  return process.env.HY_CLAUDE_SETTINGS || (isWindows() ? appDataPath('Claude', 'settings.json') : homePath('.claude', 'settings.json'))
}

/** OpenCode config path: Windows: %APPDATA%/opencode/opencode.json, macOS/Linux: ~/.config/opencode/opencode.json */
export function openCodeConfigPath(): string {
  return appDataPath('opencode', 'opencode.json')
}

export function expandHome(p: string): string {
  if (p === '~') return os.homedir()
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2))
  return p
}
