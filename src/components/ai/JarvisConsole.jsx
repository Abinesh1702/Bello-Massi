import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Keyboard, Mic, MicOff, Pause, Play, Send, Square, Trash2, Volume2, VolumeX } from 'lucide-react'
import Button from '../common/Button'
import Badge from '../common/Badge'
import AiResponse from './AiResponse'
import { ProviderStatusBadge } from './AiBadges'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { clearJarvisHistory, confirmJarvisProposal, jarvisCommand, runToolAction } from '../../services/ai/aiChatService'
import { getProviderStatus, openJarvisSpeechAvailable } from '../../services/ai/aiProviderService'
import { createSpeaker, speechSupport, startRecognition } from '../../services/ai/speechService'
import { JARVIS_EXAMPLES } from '../../services/ai/aiIntentService'
import { cn } from '../../utils/helpers'

const STATUS_LABEL = { idle: 'Ready', listening: 'Listening…', processing: 'Processing…', speaking: 'Speaking…', paused: 'Paused' }

export function JarvisOrb({ status, size = 160 }) {
  return <div className="jarvis-orb shrink-0" data-state={status === 'paused' ? 'idle' : status} style={{ width: size, height: size }} aria-hidden />
}

export function Waveform({ active, bars = 11 }) {
  return <div className="jarvis-wave" data-active={active ? 'true' : 'false'} aria-hidden>{Array.from({ length: bars }, (_, i) => <span key={i} />)}</div>
}

/** Shared Jarvis engine + UI. compact = floating panel. */
export default function JarvisConsole({ compact = false, onNavigate }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const d = usePhase6Data()
  const canUse = usePermission('jarvis.use')
  const s = d.jarvisSettings
  const support = useMemo(() => speechSupport(), [])
  const sttEngine = s.sttEngine === 'openjarvis' && openJarvisSpeechAvailable(d.aiSettings) ? 'openjarvis' : 'browser'
  const ttsEngine = s.ttsEngine === 'openjarvis' && openJarvisSpeechAvailable(d.aiSettings) ? 'openjarvis' : 'browser'
  const voiceAvailable = sttEngine === 'openjarvis' ? support.mediaRecorder : support.recognition
  const [status, setStatus] = useState('idle')
  const [live, setLive] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [muted, setMuted] = useState(!s.speakResponses)
  const recRef = useRef(null)
  const endRef = useRef(null)
  const [lastSpoken, setLastSpoken] = useState('')
  const history = useMemo(() => d.jarvisHistory.filter((h) => h.userId === user.id).sort((a, b) => (a.at > b.at ? 1 : -1)), [d.jarvisHistory, user.id])
  const shown = compact ? history.slice(-6) : history

  const speaker = useMemo(() => createSpeaker({ engine: ttsEngine, voiceURI: s.voiceURI, rate: Number(s.rate), volume: Number(s.volume), pitch: Number(s.pitch), language: s.language }, {
    onStart: () => setStatus('speaking'),
    onEnd: () => setStatus((x) => (x === 'speaking' || x === 'paused' ? 'idle' : x)),
    onPause: () => setStatus('paused'),
    onResume: () => setStatus('speaking'),
    onError: (m) => { setError(m); setStatus('idle') },
  }), [ttsEngine, s.voiceURI, s.rate, s.volume, s.pitch, s.language])

  useEffect(() => () => { recRef.current?.abort(); speaker.stop() }, [speaker])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [history.length, live])

  const speak = useCallback((t) => {
    setLastSpoken(t)
    if (!muted && t) speaker.speak(t)
  }, [muted, speaker])

  const go = (path) => { navigate(path); onNavigate?.(path) }

  const submit = useCallback(async (raw, inputMode = 'text') => {
    const q = String(raw || '').trim()
    if (!q) return
    if (!canUse) { toast.error('Your role cannot use Jarvis.'); return }
    setError('')
    setLive('')
    setStatus('processing')
    const res = await jarvisCommand(q, { inputMode, wakeWord: s.wakeWord })
    if (!res.ok) { setStatus('idle'); setError(res.error); return }
    setStatus('idle')
    const e = res.entry
    speak(e.proposal ? `${e.text} ${e.proposal.summary} Please confirm on screen.` : e.text)
    if (e.navigate && s.autoNavigate && !e.proposal && e.meta?.tool !== 'get_dashboard_summary') go(e.navigate)
  }, [canUse, s.wakeWord, s.autoNavigate, speak]) // eslint-disable-line react-hooks/exhaustive-deps

  const startListening = () => {
    if (!canUse) return
    if (!voiceAvailable) { setError('Voice input is not supported in this browser. Type your command instead.'); return }
    speaker.stop()
    setError('')
    setLive('')
    recRef.current = startRecognition({ engine: sttEngine, language: s.language, continuous: s.continuous }, {
      onStart: () => setStatus('listening'),
      onPartial: (t) => setLive(t),
      onFinal: (t) => { setLive(t); submit(t, 'voice') },
      onError: (m) => { setError(m); setStatus('idle') },
      onEnd: () => setStatus((x) => (x === 'listening' ? 'idle' : x)),
    })
  }
  const stopListening = () => { recRef.current?.stop(); setStatus((x) => (x === 'listening' ? 'idle' : x)) }
  const toggleListening = () => (status === 'listening' ? stopListening() : startListening())

  // Keyboard: Alt+M toggles the microphone, Escape stops listening / speaking (page mode only).
  useEffect(() => {
    if (compact) return undefined
    const onKey = (e) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); toggleListening() }
      if (e.key === 'Escape') { recRef.current?.abort(); speaker.stop() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // re-bind each render so the handler sees current state

  const onAction = async (a) => {
    if (a.type === 'navigate') return go(a.path)
    if (a.type === 'tool') {
      const r = await runToolAction(null, a.tool, a.args, { source: 'jarvis' })
      if (!r.ok) toast.error(r.error)
    }
    return undefined
  }
  const resolve = (entry) => async (confirm, reason) => {
    setBusyId(entry.id)
    const r = confirmJarvisProposal(entry.id, { confirm, reason })
    setBusyId(null)
    if (!r.ok) { toast.error(r.error); return }
    speak(r.text)
    if (confirm) toast.success(r.text)
    if (confirm && r.navigate) go(r.navigate)
  }

  const providerStatus = getProviderStatus(d.aiSettings)
  const active = status === 'listening' || status === 'speaking'

  return (
    <div className={cn('flex flex-col', compact ? 'h-full' : 'gap-4')}>
      <div className={cn('flex items-center gap-4', compact ? 'border-b border-line px-4 py-3' : 'flex-col rounded-2xl border border-line bg-surface p-6 text-center shadow-card sm:flex-row sm:text-left')}>
        <JarvisOrb status={status} size={compact ? 44 : 132} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className={cn('flex flex-wrap items-center gap-2', !compact && 'justify-center sm:justify-start')}>
            <span className="text-sm font-semibold text-ink" role="status" aria-live="polite" data-testid="jarvis-status">{STATUS_LABEL[status]}</span>
            {!compact && <Waveform active={active} />}
          </div>
          {!compact && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
              <Badge tone={voiceAvailable ? 'success' : 'neutral'}>{voiceAvailable ? `Voice input · ${sttEngine === 'openjarvis' ? 'OpenJarvis' : 'browser'}` : 'Voice input unsupported'}</Badge>
              <Badge tone={support.synthesis || ttsEngine === 'openjarvis' ? 'success' : 'neutral'}>{support.synthesis || ttsEngine === 'openjarvis' ? `Voice output · ${ttsEngine === 'openjarvis' ? 'OpenJarvis' : 'browser'}` : 'Voice output unsupported'}</Badge>
              <span className="inline-flex items-center gap-1 text-muted">AI provider <ProviderStatusBadge status={providerStatus} /></span>
            </div>
          )}
          {live && <p className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm italic text-ink" data-testid="jarvis-live">“{live}”</p>}
          {error && <p className="text-xs text-danger" role="alert">{error}</p>}
        </div>
        {!compact && (
          <div className="flex flex-col items-center gap-2">
            <Button size="lg" icon={status === 'listening' ? MicOff : Mic} onClick={toggleListening} disabled={!canUse || status === 'processing'} aria-pressed={status === 'listening'} variant={status === 'listening' ? 'danger' : 'primary'}>
              {status === 'listening' ? 'Stop listening' : 'Start listening'}
            </Button>
            <span className="text-[11px] text-muted">Alt + M · Esc to stop</span>
          </div>
        )}
      </div>

      <div className={cn('min-h-0 flex-1 overflow-y-auto scroll-thin', compact ? 'px-4 py-3' : 'max-h-[56vh] rounded-2xl border border-line bg-surface p-4 shadow-card')} aria-live="polite">
        {!shown.length ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">Say “Jarvis, …” or type a command. Try:</p>
            <div className="flex flex-wrap gap-1.5">{JARVIS_EXAMPLES.slice(0, compact ? 4 : 11).map((x) => <button key={x} type="button" onClick={() => submit(x)} disabled={!canUse} className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-ink hover:border-brand/40">{x}</button>)}</div>
          </div>
        ) : (
          <ol className="space-y-3">
            {shown.map((h) => (
              <li key={h.id} className={cn('flex', h.role === 'user' && 'justify-end')}>
                {h.role === 'user'
                  ? <p className="max-w-[85%] rounded-2xl bg-brand px-3 py-2 text-sm text-white">{h.inputMode === 'voice' && <Mic size={12} className="mr-1 inline" aria-label="Voice" />}{h.text}</p>
                  : <div className="w-full rounded-2xl border border-line bg-surface-2/50 px-3 py-2" data-testid="jarvis-answer"><AiResponse message={{ ...h, content: h.text }} compact={compact} onAction={onAction} onSuggestion={(x) => submit(x)} onResolve={resolve(h)} busy={busyId === h.id} /></div>}
              </li>
            ))}
            {status === 'processing' && <li className="text-muted"><span className="ai-dots inline-flex gap-1" aria-label="Processing"><span /><span /><span /></span></li>}
            <li ref={endRef} aria-hidden />
          </ol>
        )}
      </div>

      <form className={cn('flex items-center gap-2', compact ? 'border-t border-line px-3 py-2.5' : '')} onSubmit={(e) => { e.preventDefault(); const t = text; setText(''); submit(t) }}>
        {compact && <Button size="sm" variant={status === 'listening' ? 'danger' : 'secondary'} icon={status === 'listening' ? MicOff : Mic} onClick={toggleListening} disabled={!canUse || !voiceAvailable} aria-label={status === 'listening' ? 'Stop listening' : 'Start listening'} aria-pressed={status === 'listening'} title={voiceAvailable ? 'Voice command' : 'Voice input unsupported in this browser'} />}
        <label htmlFor={compact ? 'jarvis-input-compact' : 'jarvis-input'} className="sr-only">Type a command for Jarvis</label>
        <div className="relative flex-1">
          {!compact && <Keyboard size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />}
          <input id={compact ? 'jarvis-input-compact' : 'jarvis-input'} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} disabled={!canUse} placeholder="Type a command, e.g. “show pending dispatches”"
            className={cn('h-10 w-full rounded-xl border border-line bg-surface text-sm text-ink placeholder:text-muted focus:border-brand/40 focus:outline-none', compact ? 'px-3' : 'pl-9 pr-3')} />
        </div>
        <Button type="submit" size={compact ? 'sm' : 'md'} icon={Send} disabled={!text.trim() || !canUse || status === 'processing'} aria-label="Send command">{compact ? '' : 'Send'}</Button>
      </form>

      {!compact && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Voice playback controls">
          <Button size="sm" variant="secondary" icon={Play} onClick={() => lastSpoken && speaker.speak(lastSpoken)} disabled={!lastSpoken}>Play last</Button>
          <Button size="sm" variant="secondary" icon={Pause} onClick={() => speaker.pause()} disabled={status !== 'speaking'}>Pause</Button>
          <Button size="sm" variant="secondary" icon={Play} onClick={() => speaker.resume()} disabled={status !== 'paused'}>Resume</Button>
          <Button size="sm" variant="secondary" icon={Square} onClick={() => speaker.stop()} disabled={status !== 'speaking' && status !== 'paused'}>Stop</Button>
          <Button size="sm" variant="ghost" icon={muted ? VolumeX : Volume2} onClick={() => { setMuted((m) => !m); speaker.stop() }} aria-pressed={!muted}>{muted ? 'Voice replies off' : 'Voice replies on'}</Button>
          <span className="flex-1" />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => { clearJarvisHistory(); toast.success('Jarvis history cleared') }} disabled={!history.length}>Clear history</Button>
        </div>
      )}
    </div>
  )
}
