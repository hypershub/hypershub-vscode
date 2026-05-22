import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { DEFAULT_BASE_URL } from './constants.js'
import { normalizeApiBaseUrl, normalizeBaseUrl } from './url.js'

const ALLOWED_KEYS = new Set(['baseUrl', 'apiBaseUrl', 'apiKey', 'defaultModel'])

function envConfigDir(): string {
  return process.env.HYPERSHUB_CONFIG_DIR || process.env.HY_CONFIG_DIR || ''
}

export function configDir(): string {
  if (envConfigDir()) return envConfigDir()
  if (process.platform === 'win32' || process.env.HY_PLATFORM === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
    return path.join(appData, 'HypersHub')
  }
  const xdg = process.env.XDG_CONFIG_HOME
  if (xdg) return path.join(xdg, 'hypershub')
  return path.join(os.homedir(), '.hypershub')
}

export function configPath(): string {
  return process.env.HYPERSHUB_CONFIG_FILE || process.env.HY_CONFIG_FILE || path.join(configDir(), 'config.json')
}

export function emptyConfig(): Record<string, string> {
  return { baseUrl: DEFAULT_BASE_URL }
}

export function readGlobalConfig(): Record<string, string> {
  const file = configPath()
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    return { ...emptyConfig(), ...parsed }
  } catch {
    return emptyConfig()
  }
}

export function writeGlobalConfig(config: Record<string, string>): string {
  const file = configPath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const clean: Record<string, string> = {}
  for (const [key, value] of Object.entries(config)) {
    if (ALLOWED_KEYS.has(key) && value !== undefined && value !== null && value !== '') clean[key] = value
  }
  if (!clean.baseUrl && clean.apiBaseUrl) clean.baseUrl = normalizeBaseUrl(clean.apiBaseUrl)
  fs.writeFileSync(file, `${JSON.stringify(clean, null, 2)}\n`, { mode: 0o600 })
  try { fs.chmodSync(file, 0o600) } catch {}
  return file
}

export function saveCommonOptions(opts: { baseUrl?: string; apiBaseUrl?: string; key?: string; model?: string } = {}): Record<string, string> {
  const cfg = readGlobalConfig()
  if (opts.baseUrl || opts.apiBaseUrl) {
    const rawUrl = opts.apiBaseUrl || opts.baseUrl!
    cfg.baseUrl = normalizeBaseUrl(rawUrl)
    cfg.apiBaseUrl = normalizeApiBaseUrl(rawUrl)
  }
  if (opts.key) cfg.apiKey = opts.key
  if (opts.model) cfg.defaultModel = opts.model
  writeGlobalConfig(cfg)
  return cfg
}

export function resolveCommonOptions(flags: { url?: string; key?: string; model?: string } = {}): { config: Record<string, string>; baseUrl: string; apiBaseUrl: string; key: string; model: string } {
  const cfg = readGlobalConfig()
  const rawUrl = flags.url || process.env.HYPERSHUB_BASE_URL || process.env.HYPERSHUB_API_BASE_URL || cfg.apiBaseUrl || cfg.baseUrl || DEFAULT_BASE_URL
  const key = flags.key || process.env.HYPERSHUB_API_KEY || cfg.apiKey || ''
  const model = flags.model || process.env.HYPERSHUB_DEFAULT_MODEL || cfg.defaultModel || ''
  return {
    config: cfg,
    baseUrl: normalizeBaseUrl(rawUrl),
    apiBaseUrl: normalizeApiBaseUrl(rawUrl),
    key,
    model,
  }
}

export function redactKey(key: string | undefined | null): string {
  if (!key) return key || ''
  return /^hy-[A-Za-z0-9_-]{8,}$/.test(key) ? `${key.slice(0, 3)}****${key.slice(-4)}` : '****'
}

export function publicGlobalConfig(config: Record<string, string> = readGlobalConfig(), options: { showSecrets?: boolean } = {}): Record<string, string> {
  return {
    baseUrl: config.baseUrl || '',
    apiBaseUrl: config.apiBaseUrl || (config.baseUrl ? normalizeApiBaseUrl(config.baseUrl) : ''),
    apiKey: options.showSecrets ? (config.apiKey || '') : redactKey(config.apiKey),
    defaultModel: config.defaultModel || '',
  }
}
