import { normalizeApiBaseUrl } from './url.js'

export interface Model {
  id: string
  provider: string
  displayName: string
  description: string
  contextWindow: number
}

export const FALLBACK_MODELS: Model[] = [
  { id: 'gpt-5.4', provider: 'OpenAI', displayName: 'GPT 5.4', description: '', contextWindow: 128000 },
  { id: 'deepseek-v4-pro', provider: 'DeepSeek', displayName: 'DeepSeek V4 Pro', description: '', contextWindow: 128000 },
]

function pickArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  const p = payload as Record<string, unknown> | undefined
  if (Array.isArray(p?.data)) return p.data as unknown[]
  if (Array.isArray(p?.models)) return p.models as unknown[]
  return []
}

function normalizeModel(item: unknown): Model | null {
  const obj = item as Record<string, unknown> | undefined
  const id = obj?.id || obj?.slug || obj?.model || obj?.name
  if (!id || typeof id !== 'string') return null
  return {
    id,
    provider: (obj?.provider as string) || (obj?.owned_by as string) || (obj?.vendor as string) || inferProvider(id),
    displayName: (obj?.display_name as string) || (obj?.displayName as string) || (obj?.name as string) || id,
    description: (obj?.description as string) || '',
    contextWindow: Number(obj?.context_window || obj?.contextWindow || obj?.max_context_window || obj?.maxContextWindow || 128000),
  }
}

export function inferProvider(id: string): string {
  const s = id.toLowerCase()
  if (s.includes('claude')) return 'Anthropic'
  if (s.includes('deepseek')) return 'DeepSeek'
  if (s.includes('gemini')) return 'Google'
  if (s.includes('gpt') || s.includes('openai')) return 'OpenAI'
  return 'HypersHub'
}

export async function fetchModelsStrict(options: { apiBaseUrl: string; key: string }): Promise<Model[]> {
  const url = `${normalizeApiBaseUrl(options.apiBaseUrl)}/models`
  const res = await fetch(url, { headers: { authorization: `Bearer ${options.key}` } })
  const text = await res.text()
  let payload: unknown
  try { payload = JSON.parse(text) } catch { payload = null }
  if (!res.ok) {
    const msg = payload ? JSON.stringify(payload).slice(0, 200) : text.slice(0, 200)
    throw new Error(`HTTP ${res.status}: ${msg}`)
  }
  const models = pickArray(payload).map(normalizeModel).filter((m): m is Model => m !== null)
  const deduped = [...new Map(models.map((m) => [m.id, m])).values()]
  if (deduped.length === 0) throw new Error('empty model list')
  return deduped
}

export async function fetchAvailableModels(options: { apiBaseUrl: string; key: string }): Promise<Model[]> {
  try {
    return await fetchModelsStrict(options)
  } catch {
    return FALLBACK_MODELS
  }
}
