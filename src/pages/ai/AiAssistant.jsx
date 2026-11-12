import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Bot, History, Lightbulb, MessageSquarePlus, Mic, PanelLeft, PanelRight, Pencil, Search, Send, Settings2, ShieldCheck, Sparkles, Trash2, User } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import AiResponse from '../../components/ai/AiResponse'
import { DemoAiBadge, PrivacyNote, ProviderStatusBadge, SeverityBadge } from '../../components/ai/AiBadges'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { ask, confirmMessageProposal, createConversation, deleteConversation, renameConversation, runToolAction } from '../../services/ai/aiChatService'
import { getProviderStatus } from '../../services/ai/aiProviderService'
import { toolsForRole } from '../../services/ai/aiToolRegistry'
import { visibleInsights } from '../../services/ai/insightService'
import { EXAMPLE_QUESTIONS } from '../../services/ai/aiIntentService'
import { AI_STATUS, PROVIDER_META } from '../../config/aiConfig'
import { getRoleLabel } from '../../config/roles'
import { cn } from '../../utils/helpers'
import { formatRelative } from '../../utils/formatters'

function ConversationList({ conversations, activeId, onSelect, onNew, onRename, onDelete }) {
  const [q, setQ] = useState('')
  const list = conversations.filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 p-3">
        <Button fullWidth icon={MessageSquarePlus} onClick={onNew}>New conversation</Button>
        <Input icon={Search} placeholder="Search conversations" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search conversations" />
      </div>
      <nav aria-label="Conversations" className="min-h-0 flex-1 overflow-y-auto scroll-thin px-2 pb-3">
        {!list.length && <p className="px-2 py-6 text-center text-xs text-muted">{conversations.length ? 'No match.' : 'No conversations yet. Ask your first question.'}</p>}
        <ul className="space-y-0.5">
          {list.map((c) => (
            <li key={c.id} className={cn('group flex items-center gap-1 rounded-lg pr-1', c.id === activeId ? 'bg-brand/10' : 'hover:bg-surface-2')}>
              <button type="button" onClick={() => onSelect(c.id)} aria-current={c.id === activeId ? 'true' : undefined} className="min-w-0 flex-1 px-2.5 py-2 text-left">
                <span className="block truncate text-sm font-medium text-ink">{c.title}</span>
                <span className="block text-[11px] text-muted">{formatRelative(c.updatedAt)} · {c.messageCount || 0} msgs</span>
              </button>
              <button type="button" onClick={() => onRename(c)} className="rounded p-1 text-muted opacity-70 hover:bg-surface hover:text-ink group-hover:opacity-100" aria-label={`Rename ${c.title}`}><Pencil size={13} /></button>
              <button type="button" onClick={() => onDelete(c)} className="rounded p-1 text-muted opacity-70 hover:bg-surface hover:text-danger group-hover:opacity-100" aria-label={`Delete ${c.title}`}><Trash2 size={13} /></button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function ContextPanel({ user, settings, insights }) {
  const status = getProviderStatus(settings)
  const tools = toolsForRole(user)
  const canSettings = usePermission('ai.settings.manage')
  return (
    <div className="space-y-4 p-4">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">AI provider</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">{PROVIDER_META[settings.provider]?.short || settings.provider}</span>
          <ProviderStatusBadge status={status} />
        </div>
        <p className="mt-1 text-xs text-muted">{status === AI_STATUS.CONNECTED ? `Model: ${settings.modelInfo?.model || settings.model || 'server default'}` : status === AI_STATUS.DEMO ? 'Rule-based answers computed in this browser. No model is called.' : 'Not connected — the demo engine answers meanwhile.'}</p>
        {canSettings && <Link to="/ai/settings" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"><Settings2 size={12} /> AI settings</Link>}
      </section>
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your data access</p>
        <p className="mt-1 text-xs text-muted">Answers use only data your role ({getRoleLabel(user.role)}) can open in the app.</p>
        <ul className="mt-2 space-y-1">
          {tools.filter((t) => !['navigate_to_page', 'get_notifications'].includes(t.name)).map((t) => (
            <li key={t.name} className="flex items-center justify-between gap-2 text-xs"><span className="text-ink">{t.label}</span>{t.kind === 'write' ? <span className="text-[10px] font-medium text-warning">confirm</span> : <span className="text-[10px] text-muted">read</span>}</li>
          ))}
        </ul>
      </section>
      <PrivacyNote>{settings.provider === 'DEMO' ? 'Nothing leaves this browser.' : settings.dataSharing === 'NONE' ? 'Only your question is sent to the provider.' : 'The provider receives your question plus a short, permission-filtered summary — never the full database.'}</PrivacyNote>
      {insights.length > 0 && (
        <section>
          <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Open insights</p><Link to="/ai/insights" className="text-xs text-brand hover:underline">All</Link></div>
          <ul className="mt-2 space-y-2">
            {insights.slice(0, 4).map((i) => <li key={i.id} className="text-xs"><SeverityBadge severity={i.severity} /> <span className="ml-1 text-ink">{i.title}</span></li>)}
          </ul>
        </section>
      )}
      <Link to="/ai/activity" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"><History size={12} /> AI activity history</Link>
    </div>
  )
}

export default function AiAssistant() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const d = usePhase6Data()
  const canUse = usePermission('ai.assistant.use')
  const canInsights = usePermission('ai.insights.view')
  const conversations = useMemo(() => d.conversations.filter((c) => c.userId === user.id).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)), [d.conversations, user.id])
  const activeId = params.get('c') && conversations.some((c) => c.id === params.get('c')) ? params.get('c') : null
  const messages = useMemo(() => (activeId ? d.messages.filter((m) => m.conversationId === activeId && m.userId === user.id).sort((a, b) => (a.at > b.at ? 1 : -1)) : []), [d.messages, activeId, user.id])
  const insights = useMemo(() => (canInsights ? visibleInsights(user, d.insights).filter((i) => i.status === 'NEW') : []), [canInsights, user, d.insights])
  const [text, setText] = useState(params.get('q') || '')
  const [pending, setPending] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [showList, setShowList] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages.length, pending])

  const select = (id) => { setParams(id ? { c: id } : {}); setShowList(false) }

  const send = async (raw) => {
    const q = String(raw ?? text).trim()
    if (!q || pending) return
    if (!canUse) { toast.error('Your role can view but not use the assistant.'); return }
    setText('')
    setPending(q)
    const res = await ask(activeId, q)
    setPending(null)
    if (!res.ok) { toast.error(res.error); setText(q); return }
    if (res.conversationId !== activeId) setParams({ c: res.conversationId })
    inputRef.current?.focus()
  }

  const onAction = async (a) => {
    if (a.type === 'navigate') { navigate(a.path); return }
    if (a.type === 'tool') {
      let convId = activeId
      if (!convId) { const c = createConversation('Actions'); if (!c.ok) return toast.error(c.error); convId = c.record.id; setParams({ c: convId }) }
      const r = await runToolAction(convId, a.tool, a.args)
      if (!r.ok) toast.error(r.error)
    }
    return undefined
  }

  const resolve = (m) => async (confirm, reason) => {
    setBusyId(m.id)
    const r = confirmMessageProposal(m.id, { confirm, reason })
    setBusyId(null)
    if (!r.ok) { toast.error(r.error); return }
    if (confirm) toast.success(r.text)
    if (r.navigate && confirm && m.proposal?.kind === 'handoff') navigate(r.navigate)
  }

  const newConversation = () => {
    const c = createConversation()
    if (!c.ok) return toast.error(c.error)
    select(c.record.id)
    inputRef.current?.focus()
    return undefined
  }

  const list = <ConversationList conversations={conversations} activeId={activeId} onSelect={select} onNew={newConversation} onRename={(c) => setRenaming({ ...c, draft: c.title })} onDelete={setDeleting} />
  const context = <ContextPanel user={user} settings={d.aiSettings} insights={insights} />

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 lg:-my-8">
      <div className="flex h-[calc(100vh-4rem)] min-h-[560px] border-b border-line bg-canvas">
        <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block" aria-label="Conversation list">{list}</aside>

        <section className="flex min-w-0 flex-1 flex-col" aria-label="Chat workspace">
          <header className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
            <Button variant="ghost" size="sm" className="lg:hidden" icon={PanelLeft} onClick={() => setShowList(true)} aria-label="Show conversations" />
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-accent"><Sparkles size={18} aria-hidden /></div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-ink">AI Assistant</h1>
              <p className="truncate text-xs text-muted">{activeId ? conversations.find((c) => c.id === activeId)?.title : 'Ask about orders, stock, deliveries, vehicles, sales and forecasts'}</p>
            </div>
            {d.aiSettings.provider === 'DEMO' && <span className="hidden sm:inline-flex"><DemoAiBadge /></span>}
            <span className="hidden sm:inline-flex"><Button variant="secondary" size="sm" icon={Mic} to="/ai/jarvis">Jarvis</Button></span>
            <Button variant="ghost" size="sm" className="sm:hidden" icon={Mic} to="/ai/jarvis" aria-label="Open Jarvis" />
            <Button variant="ghost" size="sm" className="xl:hidden" icon={PanelRight} onClick={() => setShowContext(true)} aria-label="Show context panel" />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-4 py-5" aria-live="polite">
            {!messages.length && !pending ? (
              <div className="mx-auto max-w-2xl">
                <EmptyState icon={Bot} title={`How can I help, ${user.name.split(' ')[0]}?`} description="Answers are computed from the Bellomassi data your role can see. Actions that change data always ask you to confirm first." />
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {EXAMPLE_QUESTIONS.slice(0, 10).map((q) => (
                    <button key={q} type="button" onClick={() => send(q)} disabled={!canUse} className="flex items-start gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-left text-sm text-ink hover:border-brand/40 hover:bg-surface-2 disabled:opacity-60">
                      <Lightbulb size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden /> {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ol className="mx-auto max-w-3xl space-y-5">
                {messages.map((m) => (
                  <li key={m.id} className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                    <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full', m.role === 'user' ? 'bg-surface-2 text-muted' : 'bg-brand text-accent')} aria-hidden>{m.role === 'user' ? <User size={15} /> : <Sparkles size={15} />}</span>
                    <div className={cn('min-w-0 rounded-2xl px-4 py-3', m.role === 'user' ? 'max-w-[85%] bg-brand text-white' : 'flex-1 border border-line bg-surface shadow-card')} data-testid={m.role === 'assistant' ? 'ai-answer' : 'ai-question'}>
                      {m.role === 'user' ? <p className="whitespace-pre-line text-sm">{m.content}</p> : <AiResponse message={m} onAction={onAction} onSuggestion={send} onResolve={resolve(m)} busy={busyId === m.id} />}
                    </div>
                  </li>
                ))}
                {pending && (
                  <>
                    <li className="flex flex-row-reverse gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-muted" aria-hidden><User size={15} /></span><div className="max-w-[85%] rounded-2xl bg-brand px-4 py-3 text-sm text-white">{pending}</div></li>
                    <li className="flex gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-accent" aria-hidden><Sparkles size={15} /></span><div className="rounded-2xl border border-line bg-surface px-4 py-3 text-muted"><span className="ai-dots inline-flex gap-1" aria-label="Thinking"><span /><span /><span /></span></div></li>
                  </>
                )}
                <li ref={endRef} aria-hidden />
              </ol>
            )}
          </div>

          <form className="border-t border-line bg-surface px-4 py-3" onSubmit={(e) => { e.preventDefault(); send() }}>
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <label htmlFor="ai-input" className="sr-only">Ask the AI assistant</label>
              <textarea
                id="ai-input" ref={inputRef} rows={1} value={text} onChange={(e) => setText(e.target.value)} disabled={!canUse}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={canUse ? 'Ask a question…' : 'Your role cannot use the assistant'} maxLength={1000}
                className="max-h-40 min-h-[42px] flex-1 resize-y rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand/40 focus:outline-none"
              />
              <Button type="submit" icon={Send} loading={Boolean(pending)} disabled={!text.trim() || !canUse} aria-label="Send">Send</Button>
            </div>
            <p className="mx-auto mt-1.5 flex max-w-3xl items-center gap-1 text-[11px] text-muted"><ShieldCheck size={12} aria-hidden /> Enter to send · Shift+Enter for a new line · permission-filtered answers · write actions need your confirmation · {d.aiSettings.provider === 'DEMO' ? 'Demo AI (rule-based)' : PROVIDER_META[d.aiSettings.provider]?.short}</p>
          </form>
        </section>

        <aside className="hidden w-72 shrink-0 overflow-y-auto scroll-thin border-l border-line bg-surface xl:block" aria-label="Context">{context}</aside>
      </div>

      <Modal open={showList} onClose={() => setShowList(false)} title="Conversations" size="sm">{list}</Modal>
      <Modal open={showContext} onClose={() => setShowContext(false)} title="Context" size="sm">{context}</Modal>
      <Modal open={Boolean(renaming)} onClose={() => setRenaming(null)} title="Rename conversation" size="sm"
        footer={<><Button variant="secondary" onClick={() => setRenaming(null)}>Cancel</Button><Button onClick={() => { const r = renameConversation(renaming.id, renaming.draft); if (!r.ok) return toast.error(r.error); setRenaming(null); return toast.success('Renamed') }}>Save</Button></>}>
        <Input label="Title" value={renaming?.draft || ''} onChange={(e) => setRenaming((x) => ({ ...x, draft: e.target.value }))} maxLength={80} data-autofocus />
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} tone="danger" title="Delete conversation?" description={`“${deleting?.title}” and its messages will be removed from this browser.`} confirmLabel="Delete"
        onConfirm={() => { const r = deleteConversation(deleting.id); setDeleting(null); if (!r.ok) return toast.error(r.error); if (deleting.id === activeId) select(null); return toast.success('Conversation deleted') }} />
    </div>
  )
}
