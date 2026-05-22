import { codexIntegration } from './codex.js'
import { claudeCodeIntegration } from './claudeCode.js'
import { opencodeIntegration } from './opencode.js'
import type { IntegrationOptions } from './claudeCode.js'
import type { TestResult } from '../lib/httpTest.js'

export type { IntegrationOptions } from './claudeCode.js'

export interface Integration {
  id: string
  defaultModel: string
  configure: (opts: IntegrationOptions) => Promise<void>
  test: (opts: IntegrationOptions) => Promise<TestResult>
}

export const integrations = new Map<string, Integration>([
  [codexIntegration.id, codexIntegration],
  [claudeCodeIntegration.id, claudeCodeIntegration],
  [opencodeIntegration.id, opencodeIntegration],
])

export function getIntegration(id: string): Integration | undefined {
  return integrations.get(id)
}

export function allIntegrations(): Integration[] {
  return [...integrations.values()]
}
