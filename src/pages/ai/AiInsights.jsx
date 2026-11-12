import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Lightbulb, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import EmptyState from '../../components/common/EmptyState'
import { FilterSelect } from '../../components/common/FilterToolbar'
import InsightCard from '../../components/ai/InsightCard'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { refreshInsights, visibleInsights } from '../../services/ai/insightService'
import { INSIGHT_STATUS, INSIGHT_TYPES, SEVERITY_META } from '../../config/aiConfig'

export default function AiInsights() {
  const { user } = useAuth()
  const d = usePhase6Data()
  const canManage = usePermission('ai.insights.manage')
  const [tab, setTab] = useState(INSIGHT_STATUS.NEW)
  const [severity, setSeverity] = useState('')
  const [type, setType] = useState('')
  const [busy, setBusy] = useState(false)
  const all = useMemo(() => visibleInsights(user, d.insights), [user, d.insights])
  const list = all.filter((i) => (tab === 'ALL' || i.status === tab) && (!severity || i.severity === severity) && (!type || i.type === type))
  const refresh = () => {
    setBusy(true)
    const r = refreshInsights()
    setBusy(false)
    if (!r.ok) toast.error(r.error)
    else toast.success(`Insights refreshed · ${r.count} active`)
  }
  const count = (s) => all.filter((i) => i.status === s).length
  return (
    <>
      <PageHeader title="AI Insights" description="Automatically detected business signals. Each insight comes from an explicit rule over your data, shows its supporting numbers and only appears if your role can see the underlying module."
        actions={<Button icon={RefreshCw} loading={busy} onClick={refresh}>Refresh insights</Button>} />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[
        { id: INSIGHT_STATUS.NEW, label: `New (${count('NEW')})` }, { id: INSIGHT_STATUS.REVIEWED, label: `Reviewed (${count('REVIEWED')})` },
        { id: INSIGHT_STATUS.RESOLVED, label: `Resolved (${count('RESOLVED')})` }, { id: 'ALL', label: `All (${all.length})` },
      ]} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <FilterSelect label="Severity" allLabel="All severities" value={severity} onChange={setSeverity} options={Object.keys(SEVERITY_META).map((k) => ({ value: k, label: SEVERITY_META[k].label }))} />
        <FilterSelect label="Type" allLabel="All types" value={type} onChange={setType} options={Object.entries(INSIGHT_TYPES).map(([value, label]) => ({ value, label }))} />
      </div>
      {list.length ? <div className="grid gap-4 lg:grid-cols-2">{list.map((i) => <InsightCard key={i.id} insight={i} canManage={canManage} />)}</div>
        : <Card><EmptyState icon={Lightbulb} title="No insights here" description="Refresh to re-check the latest data." /></Card>}
    </>
  )
}
