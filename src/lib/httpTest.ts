import { DEFAULT_ANTHROPIC_VERSION } from './constants.js'
import { normalizeApiBaseUrl, normalizeBaseUrl } from './url.js'

export interface TestResult {
  ok: boolean
  message: string
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    const msg = typeof data === 'string' ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new Error(`HTTP ${res.status}: ${msg}`)
  }
  return data
}

export async function testOpenAICompatible(options: { apiBaseUrl: string; key: string; model: string }): Promise<TestResult> {
  const url = `${normalizeApiBaseUrl(options.apiBaseUrl)}/responses`
  await postJson(url, { authorization: `Bearer ${options.key}` }, {
    model: options.model,
    input: 'Reply with OK only.',
    max_output_tokens: 16,
  })
  return { ok: true, message: 'OpenAI-compatible endpoint responded OK' }
}

export async function testClaudeMessages(options: { baseUrl: string; key: string; model: string }): Promise<TestResult> {
  const url = `${normalizeBaseUrl(options.baseUrl)}/v1/messages`
  await postJson(url, { 'x-api-key': options.key, 'anthropic-version': DEFAULT_ANTHROPIC_VERSION }, {
    model: options.model,
    max_tokens: 16,
    messages: [{ role: 'user', content: 'Reply with OK only.' }],
  })
  return { ok: true, message: 'Claude Messages endpoint responded OK' }
}
