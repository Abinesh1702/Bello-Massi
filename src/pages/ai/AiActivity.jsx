import { useMemo, useState } from 'react'
import { Activity, CheckCircle2, XCircle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import Toggle from '../../components/common/Toggle'
import { FilterSelect, SearchInput } from '../../components/common/FilterToolbar'
import { useAuth } from '../../hooks/useAuth'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { downloadCsv, csvFilename } from '../../services/csvService'
import Button from '../../components/common/Button'
import { formatDateTime } from '../../utils/formatters'
import { scopeOf } from '../../services/rbacService'

const KINDS = ['chat', 'tool', 'command', 'confirm', 'provider', 'settings', 'insight', 'forecast', 'replenishment']

/** AI audit trail: questions, tool runs, Jarvis commands, confirmations and setting changes. */
export default function AiActivity() {
  const { user } = useAuth()
  const d = usePhase6Data()
  const isAdmin = scopeOf(user) === 'ADMIN'
  const [everyone, setEveryone] = useState(false)
  const [kind, setKind] = useState('')
  const [outcome, setOutcome] = useState('')
  const [q, setQ] = useState('')
  const rows = useMemo(() => d.activity
    .filter((a) => (everyone && isAdmin ? true : a.userId === user.id))
    .filter((a) => (!kind || a.kind === kind) && (!outcome || (outcome === 'ok' ? a.ok : !a.ok)) && (!q || `${a.action} ${a.summary} ${a.userName} ${a.error}`.toLowerCase().includes(q.toLowerCase()))), [d.activity, everyone, isAdmin, user.id, kind, outcome, q])
  return (
    <>
      <PageHeader title="AI activity history" description="Audit log of every AI question, tool execution, Jarvis command, confirmation and AI setting change. Credentials are never recorded."
        actions={<Button variant="secondary" onClick={() => downloadCsv(csvFilename('ai-activity'), rows, [
          { header: 'When', value: (a) => a.at }, { header: 'User', value: (a) => a.userName }, { header: 'Role', value: (a) => a.role }, { header: 'Source', value: (a) => a.source },
          { header: 'Kind', value: (a) => a.kind }, { header: 'Action', value: (a) => a.action }, { header: 'OK', value: (a) => (a.ok ? 'yes' : 'no') }, { header: 'Summary', value: (a) => a.summary }, { header: 'Error', value: (a) => a.error },
        ])} disabled={!rows.length}>Export CSV</Button>} />
      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search actions" className="w-full sm:w-64" />
          <FilterSelect label="Kind" allLabel="All kinds" value={kind} onChange={setKind} options={KINDS.map((k) => ({ value: k, label: k }))} />
          <FilterSelect label="Outcome" allLabel="All outcomes" value={outcome} onChange={setOutcome} options={[{ value: 'ok', label: 'Succeeded' }, { value: 'fail', label: 'Failed / denied' }]} />
          {isAdmin && <Toggle label="All users" checked={everyone} onChange={setEveryone} />}
        </div>
        <DataTable rows={rows} dense pageSize={20} empty={<EmptyState compact icon={Activity} title="No AI activity" />} columns={[
          { key: 'at', header: 'When', render: (a) => <span className="whitespace-nowrap text-xs text-muted">{formatDateTime(a.at)}</span> },
          ...(everyone ? [{ key: 'u', header: 'User', render: (a) => <span className="text-xs">{a.userName}</span> }] : []),
          { key: 'k', header: 'Kind', render: (a) => <Badge tone={a.kind === 'confirm' ? 'warning' : a.source === 'jarvis' ? 'accent' : 'neutral'}>{a.source === 'jarvis' ? `jarvis · ${a.kind}` : a.kind}</Badge> },
          { key: 'a', header: 'Action', render: (a) => <div className="min-w-0"><p className="text-sm text-ink">{a.action.replace(/_/g, ' ')}</p>{(a.summary || a.error) && <p className="max-w-[420px] truncate text-xs text-muted">{a.error || a.summary}</p>}</div> },
          { key: 'ok', header: 'Result', render: (a) => (a.ok ? <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 size={13} /> OK</span> : <span className="inline-flex items-center gap-1 text-xs text-danger"><XCircle size={13} /> Failed</span>) },
          { key: 'ms', header: 'Time', align: 'right', hideBelow: 'md', render: (a) => (a.durationMs === null || a.durationMs === undefined ? '—' : `${a.durationMs} ms`) },
        ]} />
      </Card>
    </>
  )
}
