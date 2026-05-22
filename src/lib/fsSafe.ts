import fs from 'node:fs'
import path from 'node:path'

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}

export function readText(file: string): string {
  try { return fs.readFileSync(file, 'utf8') } catch { return '' }
}

export function readJsonFile<T = Record<string, unknown>>(file: string): T {
  try { return JSON.parse(readText(file)) as T } catch { return {} as T }
}

export function writeFileSafe(file: string, content: string): void {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, content, { mode: 0o600 })
  try { fs.chmodSync(file, 0o600) } catch {}
}

export function writeJsonFile(file: string, obj: unknown): void {
  writeFileSafe(file, JSON.stringify(obj, null, 2) + '\n')
}

export function fileExists(file: string): boolean {
  return fs.existsSync(file)
}
