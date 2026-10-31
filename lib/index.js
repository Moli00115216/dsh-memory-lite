// dsh-memory-lite — 最小可用的跨会话记忆
// 只依赖 systemPrompt + tools，避开 fish-memory 用到的 sessions/sessionTitle/llm 等服务。
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { loadHostDeps } from './hostdeps.mjs'

export const name = 'memory-lite'
export const inject = ['systemPrompt', 'tools']

const HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const DIR = join(HOME, 'memory-lite')
const FILE = join(DIR, 'memories.json')
const MAX_ITEMS = 200
const MAX_INJECT_CHARS = 2200

const hostDeps = await loadHostDeps()
const defineTool = hostDeps.defineTool

function ensureDir() {
  mkdirSync(DIR, { recursive: true })
}

function load() {
  try {
    const raw = JSON.parse(readFileSync(FILE, 'utf8'))
    if (!raw || !Array.isArray(raw.items)) return { version: 1, items: [] }
    return { version: 1, items: raw.items.filter((x) => x && typeof x.text === 'string') }
  } catch {
    return { version: 1, items: [] }
  }
}

function save(data) {
  ensureDir()
  const tmp = FILE + '.tmp'
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, FILE)
}

function normalizeText(value) {
  const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim()
  return text.length > 2000 ? text.slice(0, 2000) : text
}

function render() {
  const data = load()
  if (!data.items.length) return ''
  const items = data.items
    .slice()
    .sort((a, b) => {
      const ai = Number(a.importance) || 0
      const bi = Number(b.importance) || 0
      if (bi !== ai) return bi - ai
      return String(b.at || '').localeCompare(String(a.at || ''))
    })
  const lines = []
  let used = 0
  for (const item of items) {
    const date = String(item.at || '').slice(0, 10)
    const key = item.key ? ` [${item.key}]` : ''
    const line = `- ${date}${key} ${item.text}`
    if (used + line.length > MAX_INJECT_CHARS) break
    lines.push(line)
    used += line.length + 1
  }
  if (!lines.length) return ''
  return [
    '【memory-lite 长期记忆】',
    '下面是你自己记下的事，按重要度/时间排序；只当参考，不要逐条复述。',
    ...lines,
  ].join('\n')
}

export function apply(ctx) {
  ctx.effect(() => ctx.systemPrompt.context({
    name: 'memory-lite:memories',
    order: 255,
    text: () => render(),
  }), 'dsh-memory-lite: prompt context')

  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'remember',
    description:
      '把一件值得跨会话记住的事写进本地长期记忆。只记对你重要的：约定、偏好、状态、发生过的关键事件。'
      + '一条只写一件事；日常琐事不要记。写的时候安静地写，不要在回复里汇报“记下了”。',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '要记住的事，一句话说清。用“我/ta/名字”，不要写“用户”。',
        },
        key: {
          type: 'string',
          description: '可选。会变化的事实用一个稳定的键，例如“账号.B站”“约定.记忆规范”；同一个键只保留最新一条。',
        },
        importance: {
          type: 'number',
          description: '0 到 1；约定/关系/核心状态用 0.8~1，普通事件 0.5。',
        },
      },
      required: ['text'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          message: { type: 'string' },
        },
        required: ['ok'],
        additionalProperties: false,
      },
      render(_args, value) {
        return [{ type: 'text', text: value && value.ok ? '✓' : '✗ ' + String(value?.message || '没记住') }]
      },
    },
    async execute(args) {
      const text = normalizeText(args?.text)
      if (!text) return { ok: false, message: '内容为空' }
      const key = String(args?.key || '').trim().slice(0, 80)
      const importance = Math.max(0, Math.min(1, Number(args?.importance ?? 0.5) || 0.5))
      const data = load()
      const at = new Date().toISOString()
      const existing = data.items.find((item) => (key ? item.key === key : item.text === text))
      if (existing) {
        existing.text = text
        existing.key = key || existing.key || ''
        existing.importance = importance
        existing.at = at
      } else {
        data.items.push({ id: randomUUID(), text, key, importance, at })
      }
      if (data.items.length > MAX_ITEMS) data.items = data.items.slice(-MAX_ITEMS)
      save(data)
      return { ok: true, message: '记住' }
    },
  })), 'dsh-memory-lite: remember tool')
}
