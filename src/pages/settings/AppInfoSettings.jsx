import { Info, Layers, Server, ShieldAlert } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Logo from '../../components/common/Logo'
import { appConfig } from '../../config/appConfig'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import { formatDateTime } from '../../utils/formatters'

const ROWS = [
  ['Application', appConfig.name],
  ['Subtitle', appConfig.subtitle],
  ['Prototype version', appConfig.prototypeVersion],
  ['Build stage', `${appConfig.releaseName} · Phase ${appConfig.currentPhase} — ${appConfig.currentPhaseName}`],
  ['Architecture', 'Frontend-only (React + Vite)'],
  ['Persistence', 'Browser LocalStorage (session in sessionStorage unless “Remember me”)'],
  ['Backend connection', 'None'],
]

const STACK = ['React', 'Vite', 'JavaScript', 'Tailwind CSS', 'React Router', 'Lucide', 'Recharts', 'Sonner', 'Day.js']

export default function AppInfoSettings() {
  const version = useStoredValue(STORAGE_KEYS.APP_VERSION, {})
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden" padded={false}>
        <div className="flex items-center gap-4 bg-navy px-5 py-5">
          <Logo className="h-10" />
          <div className="ml-auto"><Badge tone="accent">v{appConfig.prototypeVersion} prototype</Badge></div>
        </div>
        <dl className="divide-y divide-line px-5">
          {ROWS.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-3 sm:grid-cols-[200px_minmax(0,1fr)]">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="text-sm font-medium text-ink">{v}</dd>
            </div>
          ))}
          <div className="grid gap-1 py-3 sm:grid-cols-[200px_minmax(0,1fr)]">
            <dt className="text-sm text-muted">First initialised</dt>
            <dd className="text-sm font-medium text-ink">{formatDateTime(version.initializedAt)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Technology" icon={Layers} />
          <div className="flex flex-wrap gap-1.5">{STACK.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}</div>
        </Card>
        <Card>
          <CardHeader title="Prototype limitations" icon={ShieldAlert} />
          <ul className="space-y-1.5 text-sm text-muted list-disc pl-4">
            {appConfig.prototypeNotes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </Card>
      </div>

      <Card className="flex items-start gap-3">
        <Server size={18} className="text-muted shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-muted">
          External integrations (OpenWA for WhatsApp, Jarvis) are planned for later phases. When they are added, the interface will clearly label
          real connections versus simulated prototype behaviour.
        </p>
      </Card>
      <p className="flex items-center gap-1.5 text-xs text-muted"><Info size={13} /> Support: {appConfig.supportEmail}</p>
    </div>
  )
}
