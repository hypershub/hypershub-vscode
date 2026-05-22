import { claudeSettingsPath } from '../lib/paths.js'
import { readJsonFile, writeJsonFile } from '../lib/fsSafe.js'
import { normalizeBaseUrl } from '../lib/url.js'
import { DEFAULT_CLAUDE_MODEL } from '../lib/constants.js'
import { testClaudeMessages } from '../lib/httpTest.js'
import type { TestResult } from '../lib/httpTest.js'

export interface IntegrationOptions {
  baseUrl: string
  apiBaseUrl: string
  key: string
  model: string
}

function claudeSettingsFilePath(): string {
  return claudeSettingsPath()
}

export async function syncClaudeSettings(opts: IntegrationOptions): Promise<void> {
  const file = claudeSettingsFilePath()
  const settings = readJsonFile<{ env?: Record<string, string>; experimental?: Record<string, unknown> }>(file)
  const env = { ...(settings.env || {}) }
  const url = normalizeBaseUrl(opts.baseUrl)

  env.HYPERSHUB_API_KEY = opts.key
  env.ANTHROPIC_BASE_URL = url
  env.ANTHROPIC_AUTH_TOKEN = opts.key
  env.ANTHROPIC_API_KEY = ''

  if (opts.model) {
    env.ANTHROPIC_DEFAULT_SONNET_MODEL = opts.model
    env.ANTHROPIC_DEFAULT_OPUS_MODEL = opts.model
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL = opts.model
    env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME = opts.model
    env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME = opts.model
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME = opts.model
  }

  settings.env = env
  settings.experimental = { ...(settings.experimental || {}), disableModelValidation: true }
  writeJsonFile(file, settings)
}

export const claudeCodeIntegration = {
  id: 'claude-code',
  defaultModel: DEFAULT_CLAUDE_MODEL,
  configure: syncClaudeSettings,
  test: testClaudeMessages as (opts: IntegrationOptions) => Promise<TestResult>,
}
