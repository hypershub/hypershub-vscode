import { openCodeConfigPath } from '../lib/paths.js'
import { writeFileSafe } from '../lib/fsSafe.js'
import { normalizeApiBaseUrl } from '../lib/url.js'
import { DEFAULT_CODEX_MODEL } from '../lib/constants.js'
import { testOpenAICompatible } from '../lib/httpTest.js'
import { fetchAvailableModels } from '../lib/models.js'
import type { Model } from '../lib/models.js'
import type { TestResult } from '../lib/httpTest.js'
import type { IntegrationOptions } from './claudeCode.js'

function modelsObject(models: Model[], selectedModel: string): Record<string, { name: string; id: string }> {
  const entries = models.map((m) => [m.id, { name: m.displayName || m.id, id: m.id }] as [string, { name: string; id: string }])
  if (!entries.find(([id]) => id === selectedModel)) entries.push([selectedModel, { name: selectedModel, id: selectedModel }])
  return Object.fromEntries(entries)
}

function configJson(opts: IntegrationOptions, models: Model[]): string {
  return JSON.stringify({
    $schema: 'https://opencode.ai/config.json',
    model: `hypershub/${opts.model}`,
    provider: {
      hypershub: {
        npm: '@ai-sdk/openai-compatible',
        name: 'HypersHub',
        options: { baseURL: normalizeApiBaseUrl(opts.apiBaseUrl), apiKey: opts.key },
        models: modelsObject(models, opts.model),
      },
    },
  }, null, 2) + '\n'
}

export async function configureOpenCode(opts: IntegrationOptions): Promise<void> {
  const file = openCodeConfigPath()
  const models = await fetchAvailableModels({ apiBaseUrl: opts.apiBaseUrl, key: opts.key })
  writeFileSafe(file, configJson(opts, models))
}

export const opencodeIntegration = {
  id: 'opencode',
  defaultModel: DEFAULT_CODEX_MODEL,
  configure: configureOpenCode,
  test: testOpenAICompatible as (opts: IntegrationOptions) => Promise<TestResult>,
}
