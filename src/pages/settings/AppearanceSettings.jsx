import { Check, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import Card, { CardHeader } from '../../components/common/Card'
import Toggle from '../../components/common/Toggle'
import { useTheme } from '../../hooks/useTheme'
import { useSettings } from '../../hooks/useSettings'
import { cn } from '../../utils/helpers'

const THEMES = [
  { id: 'light', label: 'Light', icon: Sun, preview: 'bg-[#F5F7FB]', bar: 'bg-[#232B5F]', card: 'bg-white' },
  { id: 'dark', label: 'Dark', icon: Moon, preview: 'bg-[#0d1122]', bar: 'bg-[#10142a]', card: 'bg-[#151a31]' },
]

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [settings, updateSettings] = useSettings()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Theme" subtitle="Saved in this browser and applied on every visit." />
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => {
            const active = theme === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => { setTheme(t.id); toast.success(`${t.label} theme applied`) }}
                className={cn('rounded-xl border p-3 text-left transition', active ? 'border-accent ring-2 ring-accent/40' : 'border-line hover:border-brand/30')}
              >
                <div className={cn('flex h-24 gap-2 rounded-lg p-2', t.preview)} aria-hidden>
                  <div className={cn('w-8 rounded-md', t.bar)} />
                  <div className="flex-1 space-y-2">
                    <div className={cn('h-4 rounded', t.card)} />
                    <div className="grid grid-cols-3 gap-2">
                      <div className={cn('h-8 rounded', t.card)} />
                      <div className={cn('h-8 rounded', t.card)} />
                      <div className="h-8 rounded bg-[#F5A623]" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-ink"><t.icon size={16} /> {t.label}</span>
                  {active && <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-navy"><Check size={13} /></span>}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Sidebar" subtitle="Applies to desktop screens. On mobile the menu opens as a drawer." />
        <div className="space-y-5">
          <Toggle
            label="Collapse sidebar"
            description="Show icons only to give pages more room."
            checked={settings.sidebarCollapsed}
            onChange={(v) => updateSettings({ sidebarCollapsed: v })}
          />
          <Toggle
            label="Start with the sidebar collapsed"
            description="Collapse the sidebar automatically when you sign in."
            checked={settings.sidebarStartCollapsed}
            onChange={(v) => updateSettings({ sidebarStartCollapsed: v })}
          />
        </div>
      </Card>
    </div>
  )
}
