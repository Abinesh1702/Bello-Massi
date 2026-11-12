import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Archive, CheckCircle2, CheckSquare, Download, Eye, FileSpreadsheet, FileText, FileType2, Files, FolderDown, Layers, Lock,
  RefreshCw, ShieldAlert, SquareX, XCircle, ArrowDownAZ, ArrowUpAZ, Loader2,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import { FilterSelect, SearchInput } from '../../components/common/FilterToolbar'
import DocumentViewer from '../../components/projectDocuments/DocumentViewer'
import { FileTypeIcon, fileTypeShort } from '../../components/projectDocuments/DocumentIcons'
import { useAuth } from '../../hooks/useAuth'
import { CATALOG_GENERATED_AT } from '../../data/projectDocuments'
import {
  ACCESS_LABELS, TYPE_FILTERS, buildZip, canAccessDocument, canViewRestricted, checkAvailability, downloadDocument,
  formatBytes, getCategories, getDocuments, saveBlob,
} from '../../services/projectDocumentsService'
import { cn } from '../../utils/helpers'

const PAGE_SIZE = 25
const SORTS = [
  { value: 'name', label: 'Name' },
  { value: 'updated', label: 'Updated date' },
  { value: 'type', label: 'File type' },
  { value: 'size', label: 'File size' },
  { value: 'category', label: 'Category' },
]
const STATUS_FILTERS = [
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'shareable', label: 'Shareable' },
]
const totalSize = (docs) => docs.reduce((n, d) => n + (d.size || 0) + (d.assets || []).reduce((m, a) => m + (a.size || 0), 0), 0)

function SummaryCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tones = { brand: 'bg-brand/10 text-brand', success: 'bg-success/10 text-success', danger: 'bg-danger/10 text-danger', info: 'bg-info/10 text-info', accent: 'bg-accent/15 text-accent-ink', neutral: 'bg-surface-3 text-ink-2' }
  return (
    <Card padded={false} className="flex items-center gap-3 p-4">
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tones[tone])}><Icon size={19} aria-hidden /></span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-xl font-semibold leading-tight text-ink tabular">{value}</p>
        {hint && <p className="truncate text-[11px] text-muted">{hint}</p>}
      </div>
    </Card>
  )
}

/**
 * Project Documents — the documentation library. Lists every file of the documentation package with open / preview and
 * download, multi-select download, category ZIPs and a Download-all ZIP built in the browser from the actual files.
 */
export default function ProjectDocumentsPage() {
  const { user } = useAuth()
  const docs = useMemo(() => getDocuments(), [])
  const categories = useMemo(() => getCategories(), [])
  const restrictedOk = canViewRestricted(user)

  const [runtime, setRuntime] = useState({})
  const [checking, setChecking] = useState(true)
  const [filters, setFilters] = useState({ query: '', category: '', type: '', status: '', sort: 'name', dir: 'asc' })
  const { query, category, type, status, sort, dir } = filters
  const [page, setPage] = useState(0)
  // Any filter / sort change goes back to the first page.
  const setFilter = (key) => (value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(0) }
  const setQuery = setFilter('query')
  const setCategory = setFilter('category')
  const setType = setFilter('type')
  const setStatus = setFilter('status')
  const setSort = setFilter('sort')
  const setDir = setFilter('dir')
  const [selected, setSelected] = useState(() => new Set())
  const [viewing, setViewing] = useState(null)
  const [rowBusy, setRowBusy] = useState(null)
  const [zipJob, setZipJob] = useState(null) // { title, progress, result }
  const [confirmAll, setConfirmAll] = useState(false)

  const availability = useCallback((d) => {
    if (!d.available) return { available: false, reason: 'Listed in the documentation index but missing from the package' }
    return runtime[d.id] || { available: true, pending: true }
  }, [runtime])
  const isUsable = useCallback((d) => availability(d).available && canAccessDocument(user, d), [availability, user])

  const recheck = useCallback(async () => {
    setChecking(true)
    setRuntime({})
    const acc = {}
    let flush = 0
    await checkAvailability(docs, (id, r) => {
      acc[id] = r
      flush += 1
      if (flush % 40 === 0) setRuntime({ ...acc })
    })
    setRuntime({ ...acc })
    setChecking(false)
  }, [docs])
  useEffect(() => { recheck() }, [recheck])

  const counts = useMemo(() => {
    const avail = docs.filter((d) => availability(d).available)
    return {
      total: docs.length, available: avail.length, missing: docs.length - avail.length,
      pdf: docs.filter((d) => d.fileType === 'pdf').length, word: docs.filter((d) => d.fileType === 'docx').length,
      excel: docs.filter((d) => d.fileType === 'xlsx').length, other: docs.filter((d) => !['pdf', 'docx', 'xlsx'].includes(d.fileType)).length,
      docIds: new Set(docs.map((d) => d.docId).filter((x) => x && x.startsWith('BM-'))).size,
    }
  }, [docs, availability])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const tf = TYPE_FILTERS.find((t) => t.id === type)
    const list = docs.filter((d) => {
      if (category && d.categoryId !== category) return false
      if (tf && !(tf.test ? tf.test(d) : d.fileType === tf.id)) return false
      if (status === 'available' && !availability(d).available) return false
      if (status === 'unavailable' && availability(d).available) return false
      if (status === 'restricted' && d.access !== 'restricted') return false
      if (status === 'shareable' && d.access !== 'shareable') return false
      if (q && ![d.title, d.fileName, d.docId, d.category, d.description].some((s) => String(s || '').toLowerCase().includes(q))) return false
      return true
    })
    const key = {
      name: (d) => d.title.toLowerCase() + d.fileName.toLowerCase(),
      updated: (d) => `${d.updatedAt || ''}${d.title}`,
      type: (d) => `${d.fileType}${d.title}`,
      size: (d) => d.size,
      category: (d) => `${d.categoryId}${d.title}`,
    }[sort]
    list.sort((a, b) => { const x = key(a); const y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * (dir === 'asc' ? 1 : -1) })
    return list
  }, [docs, query, category, type, status, sort, dir, availability])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)
  const activeFilters = [query, category, type, status].filter(Boolean).length

  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const selectVisible = () => setSelected((s) => { const n = new Set(s); filtered.filter(isUsable).forEach((d) => n.add(d.id)); return n })
  const selectAllAvailable = () => setSelected(new Set(docs.filter(isUsable).map((d) => d.id)))
  const clearSelection = () => setSelected(new Set())
  const selectedDocs = docs.filter((d) => selected.has(d.id))

  const openDoc = (d) => {
    if (!canAccessDocument(user, d)) { toast.error('Restricted document', { description: 'You need the restricted-documents permission to open it.' }); return }
    if (!availability(d).available) { toast.error('Document unavailable', { description: availability(d).reason }); return }
    setViewing(d)
  }
  const openPath = (path) => {
    const d = docs.find((x) => x.filePath === path)
    if (d) openDoc(d)
    else toast.info('That link points to a file that is not a catalogued document.')
  }

  const downloadOne = async (d) => {
    setRowBusy(d.id)
    try {
      await downloadDocument(user, d)
      toast.success(`Downloaded ${d.fileName}`)
    } catch (e) {
      toast.error(`Could not download ${d.fileName}`, { description: e.message })
      if (/not found|empty/i.test(e.message)) setRuntime((r) => ({ ...r, [d.id]: { available: false, reason: e.message } }))
    } finally { setRowBusy(null) }
  }

  const runZip = async (list, { title, zipName }) => {
    if (!list.length) { toast.error('Nothing to download'); return }
    setZipJob({ title, progress: { phase: 'fetch', done: 0, total: list.length }, result: null, zipName })
    try {
      const res = await buildZip(user, list, { runtime, onProgress: (p) => setZipJob((j) => (j ? { ...j, progress: p } : j)) })
      if (res.blob) {
        saveBlob(res.blob, zipName)
        toast.success(`${zipName} downloaded`, { description: `${res.included.length} file(s)${res.excluded.length ? `, ${res.excluded.length} excluded` : ''}` })
      } else toast.error('No files could be added to the ZIP')
      setZipJob((j) => ({ ...j, result: { ...res, size: res.blob?.size || 0 } }))
    } catch (e) {
      toast.error('ZIP export failed', { description: e.message })
      setZipJob(null)
    }
  }

  const downloadSelected = async () => {
    if (!selectedDocs.length) return
    if (selectedDocs.length === 1) { await downloadOne(selectedDocs[0]); return }
    await runZip(selectedDocs, { title: `Download selected (${selectedDocs.length})`, zipName: 'Bellomassi_Selected_Documents.zip' })
  }
  const downloadCategory = (c) => runZip(docs.filter((d) => d.categoryId === c.id), { title: `Download ${c.label} documents`, zipName: `Bellomassi_${c.zipFolder}_Documents.zip` })
  const downloadAll = () => { setConfirmAll(false); runZip(docs, { title: 'Download all documents', zipName: 'Bellomassi_Project_Documents.zip' }) }

  const allUsable = docs.filter(isUsable)
  const zipBusy = Boolean(zipJob && !zipJob.result)

  return (
    <div>
      <PageHeader
        title="Project Documents"
        description="The Bellomassi project documentation package — open, preview and download the actual files one by one, by selection, by category or all at once."
        actions={(
          <>
            <Button variant="secondary" icon={Download} onClick={downloadSelected} disabled={!selectedDocs.length || zipBusy} data-testid="download-selected">
              Download selected{selectedDocs.length ? ` (${selectedDocs.length})` : ''}
            </Button>
            <Button variant="accent" icon={Archive} onClick={() => setConfirmAll(true)} disabled={zipBusy || checking} data-testid="download-all">Download all documents</Button>
          </>
        )}
      />

      <div className="mb-5 flex gap-2.5 rounded-xl border border-line bg-surface-2/70 px-4 py-3 text-[13px] text-ink-2">
        <ShieldAlert size={17} className="mt-0.5 shrink-0 text-warning" aria-hidden />
        <p>
          All documents are <b>drafts for client review — none is approved</b>. Access follows your role: <Badge tone="success">Shareable</Badge> and <Badge tone="info">Internal</Badge> documents
          need <span className="font-mono text-[12px]">project.documents.view</span>; <Badge tone="danger">Restricted</Badge> ones (security, infrastructure, risk) also need <span className="font-mono text-[12px]">project.documents.restricted</span>{restrictedOk ? ' — you have it' : ' — you do not have it'}.
          Prototype limitation: the files are served as static files, so the sign-in protects the screens, not the file URLs. Production: Django REST API + PostgreSQL metadata + private R2 / S3 storage with signed download URLs.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" data-testid="doc-summary">
        <SummaryCard icon={Files} label="Total documents" value={counts.total} hint={`${counts.docIds} document IDs · ${formatBytes(totalSize(docs))}`} />
        <SummaryCard icon={checking ? Loader2 : CheckCircle2} tone={counts.missing ? 'danger' : 'success'} label="Available documents" value={counts.available} hint={checking ? 'Checking files…' : counts.missing ? `${counts.missing} unavailable` : 'All files present'} />
        <SummaryCard icon={FileType2} tone="danger" label="PDF documents" value={counts.pdf} />
        <SummaryCard icon={FileText} tone="info" label="Word documents" value={counts.word} />
        <SummaryCard icon={FileSpreadsheet} tone="success" label="Excel documents" value={counts.excel} />
        <SummaryCard icon={Layers} tone="accent" label="Other files" value={counts.other} hint="Markdown, PowerPoint, diagrams, YAML" />
      </div>

      <section aria-labelledby="doc-cats" className="mb-6">
        <h2 id="doc-cats" className="mb-2.5 text-sm font-semibold text-ink">Categories</h2>
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {categories.map((c) => {
            const list = docs.filter((d) => d.categoryId === c.id)
            if (!list.length) return null
            const access = ACCESS_LABELS[c.access]
            const locked = c.access === 'restricted' && !restrictedOk
            return (
              <li key={c.id} className={cn('flex items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 shadow-xs', category === c.id ? 'border-brand ring-2 ring-brand/15' : 'border-line')}>
                <button type="button" onClick={() => setCategory(category === c.id ? '' : c.id)} className="min-w-0 flex-1 text-left" aria-pressed={category === c.id}>
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">{locked && <Lock size={13} className="text-danger" aria-hidden />}{c.label}</p>
                  <p className="text-xs text-muted tabular">{list.length} file{list.length === 1 ? '' : 's'} · {formatBytes(totalSize(list))} · <span className={access.tone === 'danger' ? 'text-danger' : ''}>{access.label}</span></p>
                </button>
                <Button size="xs" variant="secondary" icon={FolderDown} onClick={() => downloadCategory(c)} disabled={zipBusy || locked || checking}
                  title={locked ? 'Restricted category' : `Download ${c.label} documents as ZIP`} aria-label={`Download ${c.label} documents`} data-testid={`download-category-${c.id}`}>ZIP</Button>
              </li>
            )
          })}
        </ul>
      </section>

      <Card padded={false}>
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchInput value={query} onChange={setQuery} placeholder="Search title, file name or document ID…" label="Search documents" className="lg:w-80" />
            <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-wrap [&>*]:sm:min-w-40">
              <FilterSelect label="Category" value={category} onChange={setCategory} allLabel="All categories" options={categories.map((c) => ({ value: c.id, label: c.label }))} />
              <FilterSelect label="File type" value={type} onChange={setType} allLabel="All file types" options={TYPE_FILTERS.map((t) => ({ value: t.id, label: t.label }))} />
              <FilterSelect label="Status" value={status} onChange={setStatus} allLabel="Any status" options={STATUS_FILTERS} />
              <div className="flex gap-1">
                <FilterSelect label="Sort by" value={sort} onChange={(v) => setSort(v || 'name')} allLabel="Sort: name" options={SORTS.filter((s) => s.value !== 'name').map((s) => ({ value: s.value, label: `Sort: ${s.label.toLowerCase()}` }))} className="flex-1" />
                <button type="button" onClick={() => setDir(dir === 'asc' ? 'desc' : 'asc')} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink-2 shadow-xs hover:bg-surface-2" aria-label={dir === 'asc' ? 'Sorted ascending — switch to descending' : 'Sorted descending — switch to ascending'}>
                  {dir === 'asc' ? <ArrowDownAZ size={16} aria-hidden /> : <ArrowUpAZ size={16} aria-hidden />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
            <span className="tabular" aria-live="polite">{filtered.length === docs.length ? `${docs.length} files` : `${filtered.length} of ${docs.length} files`}</span>
            {activeFilters > 0 && <button type="button" className="font-medium text-brand hover:underline" onClick={() => { setFilters((f) => ({ ...f, query: '', category: '', type: '', status: '' })); setPage(0) }}>Clear {activeFilters} filter{activeFilters === 1 ? '' : 's'}</button>}
            <span className="hidden h-4 w-px bg-line sm:block" />
            <span className="font-medium text-ink tabular" data-testid="selected-count">{selected.size} selected</span>
            <button type="button" className="inline-flex items-center gap-1 font-medium text-brand hover:underline" onClick={selectVisible}><CheckSquare size={13} aria-hidden />Select all visible ({filtered.filter(isUsable).length})</button>
            <button type="button" className="inline-flex items-center gap-1 font-medium text-brand hover:underline" onClick={selectAllAvailable}><CheckSquare size={13} aria-hidden />Select all available ({allUsable.length})</button>
            {selected.size > 0 && <button type="button" className="inline-flex items-center gap-1 font-medium text-brand hover:underline" onClick={clearSelection}><SquareX size={13} aria-hidden />Clear selection</button>}
            <span className="flex-1" />
            <button type="button" className="inline-flex items-center gap-1 hover:text-ink" onClick={recheck} disabled={checking}><RefreshCw size={12} className={checking ? 'animate-spin' : ''} aria-hidden />{checking ? 'Checking files…' : 'Re-check files'}</button>
          </div>
        </div>

        {visible.length ? (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm" data-testid="documents-table">
              <caption className="sr-only">Project documents</caption>
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th scope="col" className="w-10 py-2.5 pl-4"><span className="sr-only">Select</span></th>
                  <th scope="col" className="py-2.5 pr-3">Document</th>
                  <th scope="col" className="hidden py-2.5 pr-3 lg:table-cell">Category</th>
                  <th scope="col" className="hidden py-2.5 pr-3 sm:table-cell">Type</th>
                  <th scope="col" className="hidden py-2.5 pr-3 text-right md:table-cell">Size</th>
                  <th scope="col" className="hidden py-2.5 pr-3 xl:table-cell">Updated</th>
                  <th scope="col" className="hidden py-2.5 pr-3 md:table-cell">Availability</th>
                  <th scope="col" className="py-2.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((d) => {
                  const av = availability(d)
                  const allowed = canAccessDocument(user, d)
                  const usable = av.available && allowed
                  return (
                    <tr key={d.id} className={cn('align-top hover:bg-surface-2/60', selected.has(d.id) && 'bg-brand/5')} data-testid="document-row" data-doc-id={d.id}>
                      <td className="py-3 pl-4">
                        <input type="checkbox" className="mt-2 h-4 w-4 cursor-pointer rounded border-line accent-[#232B5F] disabled:cursor-not-allowed dark:accent-[#F5A623]"
                          checked={selected.has(d.id)} disabled={!usable} onChange={() => toggle(d.id)} aria-label={`Select ${d.fileName}`} />
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex min-w-0 gap-3">
                          <FileTypeIcon type={d.fileType} />
                          <div className="min-w-0">
                            <button type="button" onClick={() => openDoc(d)} disabled={!usable} className="text-left font-medium leading-snug text-ink hover:text-brand hover:underline disabled:no-underline disabled:hover:text-ink">{d.title}</button>
                            <p className="truncate text-xs text-muted" title={d.fileName}>{d.docId && <span className="font-medium text-ink-2">{d.docId} · </span>}{d.fileName}</p>
                            <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                              <Badge tone="neutral">{fileTypeShort(d.fileType)} · {formatBytes(d.size)}</Badge>
                              {!av.available && <Badge tone="danger">Unavailable</Badge>}
                            </div>
                            {!allowed && <p className="mt-1 flex items-center gap-1 text-xs text-danger"><Lock size={12} aria-hidden />Restricted — requires the restricted-documents permission</p>}
                            {!av.available && <p className="mt-1 text-xs text-danger" data-testid="unavailable-reason">{av.reason}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="hidden py-3 pr-3 text-ink-2 lg:table-cell">{d.category}<br /><Badge tone={ACCESS_LABELS[d.access].tone}>{ACCESS_LABELS[d.access].label}</Badge></td>
                      <td className="hidden py-3 pr-3 sm:table-cell"><Badge tone="neutral">{fileTypeShort(d.fileType)}</Badge></td>
                      <td className="hidden py-3 pr-3 text-right text-ink-2 tabular md:table-cell">{formatBytes(d.size)}</td>
                      <td className="hidden py-3 pr-3 text-ink-2 tabular xl:table-cell">{d.updatedAt || '—'}</td>
                      <td className="hidden py-3 pr-3 md:table-cell">
                        {av.pending ? <span className="text-xs text-muted">Checking…</span>
                          : av.available ? <Badge tone="success" dot>Available</Badge> : <Badge tone="danger" dot>Unavailable</Badge>}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-1.5">
                          <Button size="xs" variant="secondary" icon={Eye} onClick={() => openDoc(d)} disabled={!usable} aria-label={`Open ${d.fileName}`} data-testid="open-doc">Open</Button>
                          <Button size="xs" icon={Download} onClick={() => downloadOne(d)} loading={rowBusy === d.id} disabled={!usable || Boolean(rowBusy)} aria-label={`Download ${d.fileName}`} data-testid="download-doc">
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState icon={Files} title="No documents match" description="Change the search or filters." />}

        {pageCount > 1 && (
          <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-muted">
            <span className="tabular">Page {current + 1} of {pageCount}</span>
            <div className="flex gap-1.5">
              <Button size="xs" variant="secondary" onClick={() => setPage(current - 1)} disabled={current === 0}>Previous</Button>
              <Button size="xs" variant="secondary" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1}>Next</Button>
            </div>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted">Catalogue generated {CATALOG_GENERATED_AT.slice(0, 16).replace('T', ' ')} UTC from docs/BELLOMASSI_PROJECT_DOCUMENTATION and its official index (BELLOMASSI_DOCUMENTATION_INDEX.xlsx).</p>

      <DocumentViewer key={viewing?.id || "none"} doc={viewing} onClose={() => setViewing(null)} onDownload={downloadOne} onOpenPath={openPath} downloading={Boolean(viewing && rowBusy === viewing.id)} />

      <ConfirmDialog open={confirmAll} onClose={() => setConfirmAll(false)} onConfirm={downloadAll} title="Download all documents?"
        description={`Creates Bellomassi_Project_Documents.zip in your browser from ${allUsable.length} available file(s) (about ${formatBytes(totalSize(allUsable))}), organised in category folders.`}
        confirmLabel="Create ZIP">
        {docs.length - allUsable.length > 0 && <p className="text-sm text-muted">{docs.length - allUsable.length} file(s) will be excluded (unavailable or restricted) and listed in the summary.</p>}
      </ConfirmDialog>

      <ZipDialog job={zipJob} onClose={() => setZipJob(null)} />
    </div>
  )
}

function ZipDialog({ job, onClose }) {
  if (!job) return null
  const { progress, result } = job
  const pct = progress?.phase === 'zip' ? 50 + Math.round((progress.percent || 0) / 2) : progress?.total ? Math.round(((progress.done || 0) / progress.total) * 50) : 0
  return (
    <Modal open onClose={result ? onClose : undefined} dismissible={Boolean(result)} title={job.title} description={result ? job.zipName : 'Preparing your ZIP — keep this page open.'} size="lg" icon={Archive}
      footer={result ? <Button onClick={onClose}>Close</Button> : null}>
      {!result ? (
        <div className="space-y-2" data-testid="zip-progress">
          <div className="h-2 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${pct}%` }} /></div>
          <p className="text-sm text-muted tabular">
            {progress?.phase === 'zip' ? `Compressing… ${progress.percent || 0}%` : `Fetching files ${progress?.done || 0} / ${progress?.total || 0}${progress?.label ? ` — ${progress.label}` : ''}`}
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="zip-summary">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge tone="success" dot>{result.included.length} included</Badge>
            <Badge tone={result.excluded.length ? 'danger' : 'neutral'} dot>{result.excluded.length} excluded</Badge>
            {result.assets > 0 && <Badge tone="info">{result.assets} screenshots for Markdown files</Badge>}
            {result.size > 0 && <Badge tone="neutral">{formatBytes(result.size)}</Badge>}
          </div>
          {result.excluded.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold text-ink">Excluded</p>
              <ul className="max-h-48 space-y-1 overflow-auto rounded-lg border border-line p-2 text-xs scroll-thin" data-testid="zip-excluded">
                {result.excluded.map((x) => <li key={x.doc.id} className="flex gap-1.5"><XCircle size={13} className="mt-0.5 shrink-0 text-danger" aria-hidden /><span><b className="font-medium text-ink">{x.doc.fileName}</b> — {x.reason}</span></li>)}
              </ul>
            </div>
          )}
          <div>
            <p className="mb-1 text-sm font-semibold text-ink">Included</p>
            <ul className="max-h-56 space-y-0.5 overflow-auto rounded-lg border border-line p-2 font-mono text-[11.5px] text-ink-2 scroll-thin" data-testid="zip-included">
              {result.included.map((i) => <li key={i.path} className="truncate" title={i.path}>{i.path}</li>)}
            </ul>
          </div>
          <p className="text-xs text-muted">A _manifest.txt with the same lists is inside the ZIP.</p>
        </div>
      )}
    </Modal>
  )
}
