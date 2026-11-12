import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FileBarChart, Star, Clock3, TrendingUp, ShoppingCart, Boxes, Factory, Truck, Wallet, Users, Building2, Car, PhoneCall, PackageX, Sparkles, SearchX, ArrowRight, Ban,
  Target, Store, Ticket, ShoppingBag, Ship, Forklift, ScanBarcode, Route, Wrench, CircleDollarSign, Scale, Landmark, UsersRound, TowerControl,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import { SearchInput, FilterSelect } from '../../components/common/FilterToolbar'
import { useAuth } from '../../hooks/useAuth'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import { cn } from '../../utils/helpers'
import { getReportPrefs, REPORT_CATEGORIES, reportViewCounts, toggleFavoriteReport, visibleReports } from '../../services/reportService'

export const CATEGORY_ICON = { sales: ShoppingCart, inventory: Boxes, procurement: Factory, dispatch: Truck, finance: Wallet, customer: Users, supplier: Building2, fleet: Car, communication: PhoneCall, scrap: PackageX, ai: Sparkles,
  // Enterprise categories
  crm: Target, horeca: Store, service: Ticket, purchasing: ShoppingBag, import: Ship, wms: Forklift, batches: ScanBarcode, logistics: Route,
  fleetops: Wrench, ar: CircleDollarSign, ap: Scale, cash: Landmark, hr: UsersRound, operations: TowerControl,
}
const EMPTY = {}

export default function ReportsCenter() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const prefsAll = useStoredValue(STORAGE_KEYS.REPORT_PREFS, EMPTY)
  const prefs = getReportPrefs(user.id, prefsAll)
  const reports = useMemo(() => visibleReports(user), [user])
  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const fav = params.get('fav') === '1'
  const set = (k, v) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }) }
  const byId = Object.fromEntries(reports.map((r) => [r.id, r]))
  const counts = reportViewCounts(prefsAll)
  const popular = [...reports].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0) || Number(Boolean(b.popular)) - Number(Boolean(a.popular))).filter((r) => counts[r.id] || r.popular).slice(0, 6)
  const recent = prefs.recent.map((id) => byId[id]).filter(Boolean).slice(0, 6)
  const categories = REPORT_CATEGORIES.filter((c) => reports.some((r) => r.category === c.id))
  const filtered = reports.filter((r) => {
    if (category && r.category !== category) return false
    if (fav && !prefs.favorites.includes(r.id)) return false
    if (q && ![r.title, r.description].some((s) => s.toLowerCase().includes(q.toLowerCase()))) return false
    return true
  })
  const toggleFav = (r) => {
    toggleFavoriteReport(user.id, r.id)
    toast.success(prefs.favorites.includes(r.id) ? `Removed “${r.title}” from favourites` : `Added “${r.title}” to favourites`)
  }

  return (
    <>
      <PageHeader title="Reports Center" description="Every report reads the live data in this browser — filter, chart, export to CSV or print." />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <CategoryTile active={!category && !fav} onClick={() => { set('category', ''); set('fav', '') }} icon={FileBarChart} label="All reports" count={reports.length} />
        {categories.map((c) => (
          <CategoryTile key={c.id} active={category === c.id} onClick={() => set('category', category === c.id ? '' : c.id)} icon={CATEGORY_ICON[c.id] || FileBarChart} label={c.label} count={reports.filter((r) => r.category === c.id).length} />
        ))}
      </div>

      {!q && !category && !fav && (popular.length > 0 || recent.length > 0 || prefs.favorites.length > 0) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <QuickList title="Favourites" icon={Star} items={prefs.favorites.map((id) => byId[id]).filter(Boolean)} empty="Star a report to pin it here." />
          <QuickList title="Recently viewed" icon={Clock3} items={recent} empty="Reports you open appear here." />
          <QuickList title="Popular" icon={TrendingUp} items={popular} empty="No report views yet." meta={(r) => (counts[r.id] ? `${counts[r.id]} view${counts[r.id] === 1 ? '' : 's'}` : 'Suggested')} />
        </div>
      )}

      <Card className="mt-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={(v) => set('q', v)} placeholder="Search reports…" className="sm:max-w-sm flex-1" label="Search reports" />
          <FilterSelect label="Category" allLabel="All categories" value={category} onChange={(v) => set('category', v)} options={categories.map((c) => ({ value: c.id, label: c.label }))} className="sm:w-56" />
          <button type="button" onClick={() => set('fav', fav ? '' : '1')} aria-pressed={fav}
            className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm', fav ? 'border-brand/50 text-ink font-medium' : 'border-line text-muted hover:text-ink')}>
            <Star size={14} className={fav ? 'fill-current text-[var(--accent)]' : ''} aria-hidden /> Favourites only
          </button>
          <p className="text-xs text-muted sm:ml-auto">{filtered.length} of {reports.length} reports</p>
        </div>
        {filtered.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => {
              const Icon = CATEGORY_ICON[r.category] || FileBarChart
              const isFav = prefs.favorites.includes(r.id)
              return (
                <li key={r.id} className="relative flex flex-col rounded-xl border border-line bg-surface p-4 hover:border-brand/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-brand"><Icon size={17} aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-ink leading-snug">{r.title}</h3>
                      <p className="text-xs text-muted">{REPORT_CATEGORIES.find((c) => c.id === r.category)?.label}</p>
                    </div>
                    <button type="button" onClick={() => toggleFav(r)} className="relative z-[1] rounded p-1 text-muted hover:text-ink" aria-label={isFav ? `Remove ${r.title} from favourites` : `Add ${r.title} to favourites`} aria-pressed={isFav}>
                      <Star size={16} className={isFav ? 'fill-current text-[var(--accent)]' : ''} />
                    </button>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-muted">{r.description}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {r.unavailable ? <Badge tone="neutral"><Ban size={11} aria-hidden /> No source data</Badge> : <span />}
                    <Link to={`/reports/view/${r.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline after:absolute after:inset-0">Open report <ArrowRight size={14} aria-hidden /></Link>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : <EmptyState icon={SearchX} title="No reports match" description={fav ? 'You have no favourites in this view yet.' : 'Try another search or category.'} />}
      </Card>
    </>
  )
}

function CategoryTile({ active, onClick, icon: Icon, label, count }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn('flex items-center gap-3 rounded-xl border bg-surface p-3 text-left transition-colors min-w-0', active ? 'border-brand ring-2 ring-[var(--ring)]' : 'border-line hover:border-brand/50')}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-brand"><Icon size={17} aria-hidden /></span>
      <span className="min-w-0">
        <span className="block text-lg font-semibold text-ink tabular leading-none">{count}</span>
        <span className="block truncate text-xs text-muted mt-1">{label}</span>
      </span>
    </button>
  )
}

function QuickList({ title, icon, items, empty, meta }) {
  return (
    <Card>
      <CardHeader title={title} icon={icon} />
      {items.length ? (
        <ul className="space-y-1">
          {items.map((r) => (
            <li key={r.id}>
              <Link to={`/reports/view/${r.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 text-sm hover:bg-surface-2">
                <span className="truncate text-ink">{r.title}</span>
                <span className="shrink-0 text-xs text-muted">{meta ? meta(r) : REPORT_CATEGORIES.find((c) => c.id === r.category)?.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">{empty}</p>}
    </Card>
  )
}
