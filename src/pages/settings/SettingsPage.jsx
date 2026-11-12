import { useSearchParams } from 'react-router-dom'
import { UserCircle2, Palette, Database, Info } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Tabs from '../../components/common/Tabs'
import ProfileSettings from './ProfileSettings'
import AppearanceSettings from './AppearanceSettings'
import DemoEnvironmentSettings from './DemoEnvironmentSettings'
import AppInfoSettings from './AppInfoSettings'

const TABS = [
  { id: 'profile', label: 'My Profile', icon: UserCircle2, component: ProfileSettings },
  { id: 'appearance', label: 'Appearance', icon: Palette, component: AppearanceSettings },
  { id: 'demo', label: 'Demo Environment', icon: Database, component: DemoEnvironmentSettings },
  { id: 'about', label: 'Application Info', icon: Info, component: AppInfoSettings },
]

export default function SettingsPage({ defaultTab = 'appearance' }) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const active = TABS.find((t) => t.id === requested) ? requested : defaultTab
  const Current = TABS.find((t) => t.id === active).component

  return (
    <>
      <PageHeader title={active === 'profile' ? 'My Profile' : 'Settings'} description="Manage your profile, appearance and the local demo environment." />
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Tabs tabs={TABS} value={active} onChange={(id) => setParams({ tab: id }, { replace: true })} orientation="vertical" className="pb-1" />
        <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} className="min-w-0">
          <Current />
        </div>
      </div>
    </>
  )
}
