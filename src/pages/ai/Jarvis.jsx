import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AudioLines, Info, Server, SlidersHorizontal } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Select from '../../components/common/Select'
import Toggle from '../../components/common/Toggle'
import Input from '../../components/common/Input'
import JarvisConsole from '../../components/ai/JarvisConsole'
import { DemoAiBadge, InfoNote, ProviderStatusBadge } from '../../components/ai/AiBadges'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { usePermission } from '../../hooks/usePermission'
import { saveJarvisSettings } from '../../services/ai/aiModelService'
import { getProviderStatus, openJarvisSpeechAvailable } from '../../services/ai/aiProviderService'
import { listVoices, speechSupport } from '../../services/ai/speechService'
import { AI_PROVIDERS, AI_STATUS, PROVIDER_META, SPEECH_LANGUAGES } from '../../config/aiConfig'

const useVoices = () => {
  const [voices, setVoices] = useState(() => listVoices())
  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
    if (!synth) return undefined
    const update = () => setVoices(listVoices())
    synth.addEventListener?.('voiceschanged', update)
    const t = setTimeout(update, 300)
    return () => { synth.removeEventListener?.('voiceschanged', update); clearTimeout(t) }
  }, [])
  return voices
}

export default function Jarvis() {
  const d = usePhase6Data()
  const s = d.jarvisSettings
  const canUse = usePermission('jarvis.use')
  const voices = useVoices()
  const support = speechSupport()
  const ojSpeech = openJarvisSpeechAvailable(d.aiSettings)
  const status = getProviderStatus(d.aiSettings)
  const save = (patch) => {
    const r = saveJarvisSettings(patch)
    if (!r.ok) toast.error(r.error)
  }
  const langVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith(s.language.split('-')[0]))

  return (
    <>
      <PageHeader title="Jarvis" description="Voice and text command assistant. Reads only what your role may see; anything that changes data asks you to confirm first.">
        {d.aiSettings.provider === AI_PROVIDERS.DEMO && <DemoAiBadge />}
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <JarvisConsole />
        <div className="space-y-6">
          <Card>
            <CardHeader title="Voice settings" icon={SlidersHorizontal} subtitle="Saved for this browser" />
            <div className="space-y-4">
              <Select label="Language" value={s.language} onChange={(e) => save({ language: e.target.value, voiceURI: '' })} options={SPEECH_LANGUAGES} disabled={!canUse} />
              <Select label="Voice" value={s.voiceURI} onChange={(e) => save({ voiceURI: e.target.value })} disabled={!canUse || !support.synthesis || s.ttsEngine === 'openjarvis'}
                options={[{ value: '', label: support.synthesis ? 'Browser default' : 'Not supported in this browser' }, ...(langVoices.length ? langVoices : voices).map((v) => ({ value: v.voiceURI, label: `${v.name} (${v.lang})` }))]}
                hint={s.ttsEngine === 'openjarvis' ? 'The OpenJarvis server chooses its own voice.' : `${voices.length} voice(s) available in this browser.`} />
              <div>
                <label htmlFor="jv-rate" className="flex justify-between text-sm font-medium text-ink"><span>Speech speed</span><span className="tabular text-muted">{Number(s.rate).toFixed(1)}×</span></label>
                <input id="jv-rate" type="range" min="0.5" max="2" step="0.1" value={s.rate} onChange={(e) => save({ rate: Number(e.target.value) })} className="mt-2 w-full accent-[var(--brand)]" disabled={!canUse} />
              </div>
              <div>
                <label htmlFor="jv-vol" className="flex justify-between text-sm font-medium text-ink"><span>Volume</span><span className="tabular text-muted">{Math.round(Number(s.volume) * 100)}%</span></label>
                <input id="jv-vol" type="range" min="0" max="1" step="0.05" value={s.volume} onChange={(e) => save({ volume: Number(e.target.value) })} className="mt-2 w-full accent-[var(--brand)]" disabled={!canUse} />
              </div>
              <Toggle label="Speak responses" description="Read answers aloud after each command" checked={s.speakResponses} onChange={(v) => save({ speakResponses: v })} disabled={!canUse} />
              <Toggle label="Navigate automatically" description="“Open inventory” and “show …” commands open the page" checked={s.autoNavigate} onChange={(v) => save({ autoNavigate: v })} disabled={!canUse} />
              <Toggle label="Continuous listening" description="Keep listening until you press Stop" checked={s.continuous} onChange={(v) => save({ continuous: v })} disabled={!canUse} />
              <Input label="Wake word" value={s.wakeWord} onChange={(e) => /^[a-z]{0,20}$/i.test(e.target.value) && save({ wakeWord: e.target.value || 'jarvis' })} hint="Optional prefix, removed before the command is understood." disabled={!canUse} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Speech engines" icon={AudioLines} />
            <div className="space-y-4">
              <Select label="Speech-to-text" value={s.sttEngine} onChange={(e) => save({ sttEngine: e.target.value })} disabled={!canUse}
                options={[{ value: 'browser', label: `Browser Web Speech API${support.recognition ? '' : ' (unsupported here)'}` }, { value: 'openjarvis', label: `OpenJarvis /v1/speech/transcribe${ojSpeech ? '' : ' (not connected)'}` }]} />
              <Select label="Text-to-speech" value={s.ttsEngine} onChange={(e) => save({ ttsEngine: e.target.value })} disabled={!canUse}
                options={[{ value: 'browser', label: `Browser speech synthesis${support.synthesis ? '' : ' (unsupported here)'}` }, { value: 'openjarvis', label: `OpenJarvis /v1/speech/synthesize${ojSpeech ? '' : ' (not connected)'}` }]} />
              {(s.sttEngine === 'openjarvis' || s.ttsEngine === 'openjarvis') && !ojSpeech && <InfoNote>OpenJarvis speech is selected but OpenJarvis is not connected, so the browser engine is used.</InfoNote>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Floating Jarvis button" icon={Info} />
            <div className="space-y-4">
              <Toggle label="Show floating button" description="A small mic button on every page (hidden on Jarvis and the Assistant)" checked={s.floatingButton} onChange={(v) => save({ floatingButton: v })} disabled={!canUse} />
              <Select label="Position" value={s.floatingPosition} onChange={(e) => save({ floatingPosition: e.target.value })} options={[{ value: 'bottom-right', label: 'Bottom right' }, { value: 'bottom-left', label: 'Bottom left' }]} disabled={!canUse || !s.floatingButton} />
            </div>
          </Card>
          <Card>
            <CardHeader title="AI provider" icon={Server} />
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between gap-2"><span className="text-ink">{PROVIDER_META[d.aiSettings.provider]?.label}</span><ProviderStatusBadge status={status} /></p>
              {status !== AI_STATUS.CONNECTED && <p className="text-xs text-muted">Commands are understood by the demo intent engine. Connect OpenJarvis or Ollama in AI settings for model-written answers and OpenJarvis speech.</p>}
              <Link to="/ai/settings" className="text-xs font-medium text-brand hover:underline">Open AI settings</Link>
            </div>
          </Card>
          <InfoNote>Browser limits: voice input needs Chrome, Edge or Safari over HTTPS (or localhost) and microphone permission; Firefox has no speech recognition. Text commands work everywhere.</InfoNote>
        </div>
      </div>
    </>
  )
}
