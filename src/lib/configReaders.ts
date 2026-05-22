import { homePath, claudeSettingsPath, openCodeConfigPath } from './paths.js'
import { readText, readJsonFile, fileExists } from './fsSafe.js'

export interface IntegrationConfig {
  id: string
  files: Record<string, string>
  exists: boolean
  model: string | null
  baseUrl: string | null
  key: string | null
}

export interface CodexConfig extends IntegrationConfig {
  catalogExists: boolean
  provider: string | null
  catalogModels: string[]
}

export interface OpenCodeConfig extends IntegrationConfig {
  catalogModels: string[]
}

export interface ClaudeCodeConfig extends IntegrationConfig {
  settingsExists: boolean
  settingsModels: Record<string, string>
}

export function readCodexConfig(): CodexConfig {
  const configFile = homePath('.codex', 'config.toml')
  const catalogFile = homePath('.codex', 'model-catalogs', 'all-models.json')
  const text = readText(configFile)
  let catalogModels: string[] = []
  try {
    const catalog = JSON.parse(readText(catalogFile))
    catalogModels = Array.isArray(catalog.models) ? catalog.models.map((m: Record<string, string>) => m.slug).filter(Boolean) : []
  } catch {}
  return {
    id: 'codex',
    files: { configFile, catalogFile },
    exists: fileExists(configFile),
    catalogExists: fileExists(catalogFile),
    model: matchValue(text, /^model\s*=\s*"([^"]+)"/m),
    provider: matchValue(text, /^model_provider\s*=\s*"([^"]+)"/m),
    baseUrl: matchValue(text, /^base_url\s*=\s*"([^"]+)"/m),
    key: matchValue(text, /^experimental_bearer_token\s*=\s*"([^"]+)"/m),
    catalogModels,
  }
}

export function readOpenCodeConfig(): OpenCodeConfig {
  const file = openCodeConfigPath()
  try {
    const cfg = JSON.parse(readText(file)) as Record<string, unknown>
    const provider = (cfg.provider as Record<string, Record<string, unknown>> | undefined)?.hypershub
    return {
      id: 'opencode',
      files: { configFile: file },
      exists: fileExists(file),
      model: typeof cfg.model === 'string' ? cfg.model.replace(/^hypershub\//, '') : null,
      baseUrl: (provider?.options as Record<string, string> | undefined)?.baseURL || null,
      key: (provider?.options as Record<string, string> | undefined)?.apiKey || null,
      catalogModels: provider?.models ? Object.keys(provider.models as Record<string, unknown>) : [],
    }
  } catch {
    return { id: 'opencode', files: { configFile: file }, exists: fileExists(file), model: null, baseUrl: null, key: null, catalogModels: [] }
  }
}

export function readClaudeCodeConfig(): ClaudeCodeConfig {
  const settingsFile = claudeSettingsPath()
  const settings = readJsonFile<{ env?: Record<string, string> }>(settingsFile)
  const env = settings.env || {}
  return {
    id: 'claude-code',
    files: { settingsFile },
    exists: fileExists(settingsFile) && Object.keys(env).length > 0,
    settingsExists: fileExists(settingsFile),
    model: env.ANTHROPIC_DEFAULT_SONNET_MODEL || null,
    baseUrl: env.ANTHROPIC_BASE_URL || null,
    key: env.HYPERSHUB_API_KEY || env.ANTHROPIC_AUTH_TOKEN || null,
    settingsModels: Object.fromEntries(Object.entries(env).filter(([k]) => k.includes('DEFAULT') && k.includes('MODEL'))),
  }
}

export function readIntegrationConfig(target: string): IntegrationConfig {
  if (target === 'codex') return readCodexConfig()
  if (target === 'opencode') return readOpenCodeConfig()
  if (target === 'claude-code') return readClaudeCodeConfig()
  throw new Error(`Unknown config target: ${target}`)
}

function matchValue(text: string, re: RegExp): string | null {
  const m = text.match(re)
  return m ? m[1] : null
}
