import { DEFAULT_API_BASE_URL, DEFAULT_BASE_URL } from './constants.js'

export function normalizeApiBaseUrl(url?: string): string {
  const trimmed = String(url || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`
}

export function normalizeBaseUrl(url?: string): string {
  const trimmed = String(url || DEFAULT_BASE_URL).replace(/\/+$/, '')
  return trimmed.endsWith('/v1') ? trimmed.slice(0, -3) : trimmed
}
