/**
 * AI chat orchestration shared by the Assistant and Jarvis.
 *
 *  1. The demo intent engine maps the question to a permission-checked tool (or a hand-off / help).
 *  2. The tool runs on data the user may see and returns structured blocks (KPIs, table, chart…).
 *  3. If a real provider is CONNECTED, it is asked to phrase the answer using only the tool result
 *     (data sharing "summaries") or only the question ("none"). Otherwise the demo text is used.
 *  4. Write actions come back as a confirmation card and run only after the user confirms.
 * Conversations and messages are private to their user.
 */
import dayjs from 'dayjs'
import storage from '../storageService'
import { getCurrentUser } from '../authService'
import { can } from '../../config/permissions'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { AI_MESSAGE_LIMIT, DATA_SHARING, PROVIDER_META } from '../../config/aiConfig'
import { canAccessPath } from '../../config/navigation'
import { uid } from '../../utils/helpers'
import { logActivity } from '../activityService'
import { logAiActivity } from './aiActivityService'
import { getAiSettings, providerActive, providerChat } from './aiProviderService'
import { parseIntent, EXAMPLE_QUESTIONS, JARVIS_EXAMPLES, extractOrderNumber } from './aiIntentService'
import { executeTool, toolsForRole } from './aiToolRegistry'
import { getDataBundle } from './dataBundle'

const deny = (error) => ({ ok: false, error })

/* ---------------- conversations ---------------- */

export const getConversations = (user = getCurrentUser()) =>
  (storage.getItem(K.AI_CONVERSATIONS, []) || []).filter((c) => c.userId === user?.id).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

export const getMessages = (conversationId, user = getCurrentUser()) => {
  const conv = (storage.getItem(K.AI_CONVERSATIONS, []) || []).find((c) => c.id === conversationId)
  if (!conv || conv.userId !== user?.id) return []
  return (storage.getItem(K.AI_MESSAGES, []) || []).filter((m) => m.conversationId === conversationId).sort((a, b) => (a.at > b.at ? 1 : -1))
}

export const createConversation = (title = 'New conversation') => {
  const user = getCurrentUser()
  if (!can(user, 'ai.assistant.use')) return deny('You cannot use the AI assistant.')
  const conv = { id: uid('conv'), userId: user.id, title: String(title).slice(0, 80) || 'New conversation', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messageCount: 0 }
  const res = storage.updateItem(K.AI_CONVERSATIONS, (list) => [conv, ...(list || [])], [])
  return res.ok === false ? deny(res.error) : { ok: true, record: conv }
}

export const renameConversation = (id, title) => {
  const user = getCurrentUser()
  const t = String(title || '').trim()
  if (!t) return { ok: false, errors: { title: 'Enter a title.' }, error: 'Enter a title.' }
  const list = storage.getItem(K.AI_CONVERSATIONS, []) || []
  const c = list.find((x) => x.id === id)
  if (!c || c.userId !== user?.id) return deny('Conversation not found.')
  storage.setItem(K.AI_CONVERSATIONS, list.map((x) => (x.id === id ? { ...x, title: t.slice(0, 80) } : x)))
  return { ok: true }
}

export const deleteConversation = (id) => {
  const user = getCurrentUser()
  const list = storage.getItem(K.AI_CONVERSATIONS, []) || []
  const c = list.find((x) => x.id === id)
  if (!c || c.userId !== user?.id) return deny('Conversation not found.')
  const res = storage.transaction([
    [K.AI_CONVERSATIONS, list.filter((x) => x.id !== id)],
    [K.AI_MESSAGES, (storage.getItem(K.AI_MESSAGES, []) || []).filter((m) => m.conversationId !== id)],
  ])
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'chat', action: 'delete_conversation', args: { id, title: c.title } })
  return { ok: true }
}

const appendMessages = (conversationId, msgs) => {
  const all = storage.getItem(K.AI_MESSAGES, []) || []
  const next = [...all, ...msgs]
  // Keep the newest messages if the global cap is reached (oldest conversations lose history first).
  const trimmed = next.length > AI_MESSAGE_LIMIT ? next.slice(next.length - AI_MESSAGE_LIMIT) : next
  const convs = (storage.getItem(K.AI_CONVERSATIONS, []) || []).map((c) => (c.id === conversationId ? { ...c, updatedAt: new Date().toISOString(), messageCount: (c.messageCount || 0) + msgs.length, title: c.title === 'New conversation' && msgs[0]?.role === 'user' ? msgs[0].content.slice(0, 60) : c.title } : c))
  return storage.transaction([[K.AI_MESSAGES, trimmed], [K.AI_CONVERSATIONS, convs]])
}

const updateMessage = (id, patch) => storage.updateItem(K.AI_MESSAGES, (list) => (list || []).map((m) => (m.id === id ? { ...m, ...patch } : m)), [])

/* ---------------- answering ---------------- */

const engineMeta = (provider = null, model = null) => {
  if (!provider) return { engine: 'demo', label: 'Demo AI · rule-based answer from your permitted data', demo: true }
  return { engine: 'provider', provider, model, label: `${PROVIDER_META[provider]?.short || provider}${model ? ` · ${model}` : ''}`, demo: false }
}

const helpPayload = (user, source) => {
  const tools = toolsForRole(user)
  return {
    text: `I can answer questions about the Bellomassi data your role can see, open pages, and prepare actions for you to confirm. I never change data without your explicit confirmation.`,
    blocks: {
      table: { columns: [{ key: 'label', label: 'What I can do' }, { key: 'kind', label: 'Type' }], rows: tools.map((t) => ({ id: t.name, label: `${t.label} — ${t.description}`, kind: t.kind === 'write' ? 'Needs confirmation' : 'Read-only' })) },
      suggestions: (source === 'jarvis' ? JARVIS_EXAMPLES : EXAMPLE_QUESTIONS).slice(0, 8),
      sources: [],
    },
  }
}

const SYSTEM_PROMPT = (user) => [
  'You are the Bellomassi business assistant inside an order-to-delivery platform for a frozen food distributor in India.',
  `The user is ${user.name} with role ${user.role}. Answer only from the CONTEXT provided; it is already filtered to what this user may see.`,
  'If the CONTEXT does not contain the answer, say so plainly. Never invent numbers, customers, orders, forecasts or accuracy figures.',
  'Forecasts in the context are statistical projections, not trained ML predictions — say so if you mention them. Mention when data comes from the demo baseline.',
  'You cannot perform actions. Any change (approvals, stock, invoices, emails, dispatch) is done by the user in the app after confirmation.',
  'Be concise: 2–5 sentences; show amounts exactly as formatted in the CONTEXT (organisation currency).',
].join(' ')

const compactContext = (result, rows) => {
  const c = { title: result.title, summary: result.text, kpis: result.kpis, warnings: result.warnings, sources: result.sources }
  if (result.context !== undefined) c.data = Array.isArray(result.context) ? result.context.slice(0, rows) : result.context
  else if (result.table) c.data = result.table.rows.slice(0, rows).map(({ _path: _p, id: _i, ...r }) => r)
  return JSON.stringify(c).slice(0, 6000)
}

const askProvider = async (user, question, result, history) => {
  const s = getAiSettings()
  if (!providerActive(s)) return null
  const share = s.dataSharing !== DATA_SHARING.NONE
  const msgs = [
    { role: 'system', content: SYSTEM_PROMPT(user) },
    ...history.slice(-6).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content).slice(0, 800) })),
    { role: 'user', content: share && result ? `${question}\n\nCONTEXT (permission-filtered JSON):\n${compactContext(result, s.maxContextRows || 15)}` : question },
  ]
  const started = Date.now()
  const r = await providerChat(msgs)
  logAiActivity({ kind: 'provider', action: 'provider_chat', args: { provider: s.provider, model: s.model, sharedContext: share && Boolean(result) }, ok: r.ok, error: r.ok ? '' : r.error, durationMs: Date.now() - started })
  return r.ok ? { text: r.content, provider: s.provider, model: r.model } : { failed: r.error }
}

/**
 * Core: produce an assistant payload for a user message (no persistence).
 * Returns { text, blocks, meta, navigate, proposal }.
 */
export const respond = async (text, { user, history = [], source = 'assistant', wakeWord } = {}) => {
  const bundle = getDataBundle()
  const intent = parseIntent(text, { role: user.role, hubs: bundle.hubs.filter((h) => h.status === 'Active'), products: bundle.products, wakeWord })
  if (intent.kind === 'help') return { ...helpPayload(user, source), meta: { ...engineMeta(), intent: 'help' } }
  if (intent.kind === 'smalltalk') return { text: `Hello ${user.name.split(' ')[0]}. Ask me about orders, stock, deliveries, vehicles, sales or forecasts — or say “help”.`, blocks: { suggestions: (source === 'jarvis' ? JARVIS_EXAMPLES : EXAMPLE_QUESTIONS).slice(0, 4) }, meta: { ...engineMeta(), intent: 'smalltalk' } }

  if (intent.kind === 'handoff') {
    let path = intent.path
    let affected = []
    if (intent.orderNumber) {
      const o = bundle.orders.find((x) => x.orderNumber === intent.orderNumber)
      if (o) { path = `/orders/${o.id}`; affected = [`${o.orderNumber} · ${o.customerName}`] }
    }
    if (!canAccessPath(path.split('?')[0], user)) {
      logAiActivity({ kind: 'command', action: 'handoff_denied', args: { label: intent.label, path }, ok: false, error: 'Permission denied', source })
      return { text: `${intent.label} is not available to your role.`, blocks: { warnings: [`${intent.label} requires a role with access to ${path.split('?')[0]}.`] }, meta: { ...engineMeta(), intent: 'handoff' } }
    }
    logAiActivity({ kind: 'command', action: 'handoff_proposed', args: { label: intent.label, path }, source })
    return {
      text: `${intent.why} I won't do this automatically.`,
      proposal: { kind: 'handoff', label: intent.label, summary: `Open the ${intent.label.toLowerCase()} screen so you can review and complete it yourself.`, affected, path, status: 'pending' },
      blocks: { warnings: ['This action changes data. It needs your confirmation and is completed on its own screen.'] },
      meta: { ...engineMeta(), intent: 'handoff' },
    }
  }

  if (intent.kind === 'unknown') {
    const pr = await askProvider(user, intent.raw || text, null, history)
    if (pr?.text) return { text: pr.text, blocks: { warnings: ['Answered by the AI provider without application data — no matching Bellomassi tool for this question.'], sources: [] }, meta: { ...engineMeta(pr.provider, pr.model), intent: 'unknown' } }
    return {
      text: "I couldn't match that to something I can look up. Try one of these, or say “help” to see everything I can do.",
      blocks: { suggestions: (source === 'jarvis' ? JARVIS_EXAMPLES : EXAMPLE_QUESTIONS).slice(0, 6), warnings: pr?.failed ? [`AI provider unavailable: ${pr.failed}`] : [] },
      meta: { ...engineMeta(), intent: 'unknown' },
    }
  }

  const res = executeTool(intent.tool, intent.args, { user, source })
  if (!res.ok) {
    return { text: res.error, blocks: { warnings: res.denied ? ['Access is limited by your role. Nothing outside your permissions was read.'] : [] }, meta: { ...engineMeta(), intent: intent.tool, tool: intent.tool, denied: Boolean(res.denied) } }
  }
  if (res.needsConfirmation) {
    return {
      text: `Here is what I would do. Please review and confirm.`,
      proposal: { kind: 'tool', ...res.proposal, status: 'pending' },
      blocks: { warnings: ['Nothing has changed yet.'] },
      meta: { ...engineMeta(), intent: intent.tool, tool: intent.tool },
    }
  }
  const blocks = { kpis: res.kpis, table: res.table, chart: res.chart, actions: res.actions, warnings: res.warnings, sources: res.sources, confidence: res.confidence, title: res.title }
  const pr = await askProvider(user, intent.raw || text, res, history)
  if (pr?.text) return { text: pr.text, blocks: { ...blocks, dataSummary: res.text }, meta: { ...engineMeta(pr.provider, pr.model), intent: intent.tool, tool: intent.tool }, navigate: res.navigate }
  if (pr?.failed) blocks.warnings = [...(blocks.warnings || []), `AI provider unavailable (${pr.failed}). Answered by the demo engine.`]
  return { text: res.text, blocks, meta: { ...engineMeta(), intent: intent.tool, tool: intent.tool }, navigate: res.navigate }
}

/** Assistant: persist the exchange in a conversation. */
export const ask = async (conversationId, text) => {
  const user = getCurrentUser()
  if (!can(user, 'ai.assistant.use')) return deny('You cannot use the AI assistant.')
  const q = String(text || '').trim()
  if (!q) return { ok: false, errors: { text: 'Type a question.' }, error: 'Type a question.' }
  if (q.length > 1000) return { ok: false, errors: { text: 'Keep questions under 1,000 characters.' }, error: 'Question too long.' }
  let convId = conversationId
  if (!convId || !getConversations(user).some((c) => c.id === convId)) {
    const c = createConversation()
    if (!c.ok) return c
    convId = c.record.id
  }
  const started = Date.now()
  const history = getMessages(convId, user)
  const userMsg = { id: uid('msg'), conversationId: convId, userId: user.id, role: 'user', content: q, at: new Date().toISOString() }
  let payload
  try {
    payload = await respond(q, { user, history, source: 'assistant' })
  } catch (e) {
    payload = { text: `Something went wrong while answering: ${e?.message || 'unknown error'}.`, blocks: { warnings: ['The error was logged. Nothing was changed.'] }, meta: { ...engineMeta(), intent: 'error' } }
  }
  const botMsg = { id: uid('msg'), conversationId: convId, userId: user.id, role: 'assistant', content: payload.text, blocks: payload.blocks || {}, proposal: payload.proposal || null, meta: payload.meta, navigate: payload.navigate || null, at: dayjs().add(1, 'millisecond').toISOString() }
  const res = appendMessages(convId, [userMsg, botMsg])
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'chat', action: payload.meta?.tool || payload.meta?.intent || 'chat', args: { question: q.slice(0, 200) }, ok: true, durationMs: Date.now() - started, summary: payload.meta?.label })
  return { ok: true, conversationId: convId, message: botMsg }
}

/** Run a tool chosen from an action button (e.g. “Create Replenishment Draft”) and append the result. */
export const runToolAction = async (conversationId, toolName, args = {}, { source = 'assistant' } = {}) => {
  const user = getCurrentUser()
  if (!can(user, source === 'jarvis' ? 'jarvis.use' : 'ai.assistant.use')) return deny('You cannot use the AI assistant.')
  const res = executeTool(toolName, args, { user, source })
  const base = { id: uid(source === 'jarvis' ? 'jv' : 'msg'), userId: user.id, role: 'assistant', at: new Date().toISOString() }
  const payload = !res.ok
    ? { content: res.error, blocks: { warnings: res.denied ? ['Access is limited by your role.'] : [] }, meta: { ...engineMeta(), intent: toolName } }
    : res.needsConfirmation
      ? { content: 'Here is what I would do. Please review and confirm.', proposal: { kind: 'tool', ...res.proposal, status: 'pending' }, blocks: { warnings: ['Nothing has changed yet.'] }, meta: { ...engineMeta(), intent: toolName, tool: toolName } }
      : { content: res.text, blocks: { kpis: res.kpis, table: res.table, chart: res.chart, actions: res.actions, warnings: res.warnings, sources: res.sources, confidence: res.confidence, title: res.title }, meta: { ...engineMeta(), intent: toolName, tool: toolName }, navigate: res.navigate }
  if (source === 'jarvis') {
    const entry = { ...base, text: payload.content, ...payload }
    appendJarvis([entry])
    return { ok: true, entry }
  }
  const msg = { ...base, conversationId, ...payload }
  const r = appendMessages(conversationId, [msg])
  return r.ok ? { ok: true, message: msg } : deny(r.error)
}

/**
 * Confirm or cancel a pending proposal (assistant message or Jarvis entry).
 * Tool proposals execute the write tool with confirmed: true; hand-offs return the path to open.
 */
export const resolveProposal = (proposal, { confirm, reason = '', source = 'assistant' }) => {
  const user = getCurrentUser()
  if (!proposal || proposal.status !== 'pending') return deny('This action was already handled.')
  if (!confirm) {
    logAiActivity({ kind: 'confirm', action: `${proposal.tool || proposal.label}_cancelled`, args: proposal.args || { path: proposal.path }, source, summary: 'Cancelled by user' })
    return { ok: true, status: 'cancelled', text: 'Cancelled. Nothing was changed.' }
  }
  if (proposal.kind === 'handoff') {
    logAiActivity({ kind: 'confirm', action: 'handoff_confirmed', args: { label: proposal.label, path: proposal.path }, source })
    logActivity({ type: 'ai', message: `opened ${proposal.label.toLowerCase()} via ${source === 'jarvis' ? 'Jarvis' : 'AI assistant'}`, entityType: 'ai', entityId: proposal.path })
    return { ok: true, status: 'confirmed', text: `Opening the ${proposal.label.toLowerCase()} screen. Complete and confirm the change there.`, navigate: proposal.path }
  }
  const args = proposal.needsReason ? { ...proposal.args, reason: reason || proposal.args.reason } : proposal.args
  if (proposal.needsReason && !String(args.reason || '').trim()) return { ok: false, errors: { reason: 'A reason is required.' }, error: 'A reason is required.' }
  const res = executeTool(proposal.tool, args, { user, confirmed: true, source })
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'ai', message: `${res.title} (confirmed via ${source === 'jarvis' ? 'Jarvis' : 'AI assistant'})`, entityType: 'ai', entityId: proposal.tool })
  return { ok: true, status: 'confirmed', text: res.text, result: res, navigate: res.navigate }
}

export const confirmMessageProposal = (messageId, { confirm, reason } = {}) => {
  const user = getCurrentUser()
  const msg = (storage.getItem(K.AI_MESSAGES, []) || []).find((m) => m.id === messageId)
  if (!msg || msg.userId !== user?.id) return deny('Message not found.')
  const r = resolveProposal(msg.proposal, { confirm, reason, source: 'assistant' })
  if (!r.ok) return r
  updateMessage(messageId, { proposal: { ...msg.proposal, status: r.status, resolvedAt: new Date().toISOString(), reason: reason || undefined } })
  const follow = { id: uid('msg'), conversationId: msg.conversationId, userId: user.id, role: 'assistant', content: r.text, blocks: r.result ? { actions: r.result.actions, warnings: r.result.warnings, sources: r.result.sources } : {}, meta: { ...engineMeta(), intent: 'confirmation' }, at: new Date().toISOString() }
  appendMessages(msg.conversationId, [follow])
  return { ok: true, ...r }
}

/* ---------------- Jarvis history ---------------- */

export const getJarvisHistory = (user = getCurrentUser()) => (storage.getItem(K.JARVIS_HISTORY, []) || []).filter((h) => h.userId === user?.id).sort((a, b) => (a.at > b.at ? 1 : -1))

const appendJarvis = (entries) => storage.updateItem(K.JARVIS_HISTORY, (list) => [...(list || []), ...entries].slice(-600), [])

export const jarvisCommand = async (text, { inputMode = 'text', wakeWord = 'jarvis' } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'jarvis.use')) return deny('You cannot use Jarvis.')
  const q = String(text || '').trim()
  if (!q) return { ok: false, error: 'Say or type a command.' }
  if (q.length > 500) return { ok: false, error: 'Keep commands under 500 characters.' }
  const started = Date.now()
  const history = getJarvisHistory(user).map((h) => ({ role: h.role, content: h.text }))
  const payload = await respond(q, { user, history, source: 'jarvis', wakeWord })
  const u = { id: uid('jv'), userId: user.id, role: 'user', text: q, inputMode, at: new Date().toISOString() }
  const a = { id: uid('jv'), userId: user.id, role: 'assistant', text: payload.text, blocks: payload.blocks || {}, proposal: payload.proposal || null, meta: payload.meta, navigate: payload.navigate || null, at: dayjs().add(1, 'millisecond').toISOString() }
  appendJarvis([u, a])
  logAiActivity({ kind: 'command', action: payload.meta?.tool || payload.meta?.intent || 'command', args: { command: q.slice(0, 200), inputMode }, durationMs: Date.now() - started, source: 'jarvis', summary: payload.meta?.label })
  return { ok: true, entry: a }
}

export const confirmJarvisProposal = (entryId, { confirm, reason } = {}) => {
  const user = getCurrentUser()
  const entry = (storage.getItem(K.JARVIS_HISTORY, []) || []).find((h) => h.id === entryId)
  if (!entry || entry.userId !== user?.id) return deny('Command not found.')
  const r = resolveProposal(entry.proposal, { confirm, reason, source: 'jarvis' })
  if (!r.ok) return r
  storage.updateItem(K.JARVIS_HISTORY, (list) => (list || []).map((h) => (h.id === entryId ? { ...h, proposal: { ...h.proposal, status: r.status } } : h)), [])
  appendJarvis([{ id: uid('jv'), userId: user.id, role: 'assistant', text: r.text, blocks: r.result ? { actions: r.result.actions } : {}, meta: { ...engineMeta(), intent: 'confirmation' }, at: new Date().toISOString() }])
  return { ok: true, ...r }
}

export const clearJarvisHistory = () => {
  const user = getCurrentUser()
  storage.updateItem(K.JARVIS_HISTORY, (list) => (list || []).filter((h) => h.userId !== user?.id), [])
  logAiActivity({ kind: 'command', action: 'clear_jarvis_history', source: 'jarvis' })
  return { ok: true }
}

export { extractOrderNumber }
