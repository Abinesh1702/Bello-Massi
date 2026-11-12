/**
 * Project Documents — catalogue access, availability checks, downloads and ZIP exports.
 *
 * Files are the real documentation package (docs/BELLOMASSI_PROJECT_DOCUMENTATION), served under /project-documents/
 * (see vite-plugins/projectDocuments.js). Nothing is stored in LocalStorage and nothing is ever generated to stand in
 * for a missing file: a document that cannot be fetched is reported as unavailable and left out of ZIP exports.
 *
 * Prototype security: the screens and every action check the user's permissions, but the static files themselves
 * are not protected by the demo sign-in. Production: Django REST API + PostgreSQL metadata + private Cloudflare R2 /
 * S3 storage with short-lived signed download URLs.
 */
import { PROJECT_DOCUMENTS, DOCUMENT_CATEGORIES, DOCUMENTS_BASE } from '../data/projectDocuments'
import { can } from '../config/permissions'
import { logAudit } from './auditService'

export const ACCESS_LABELS = {
  shareable: { label: 'Shareable', tone: 'success', description: 'Client-facing material (overview, manuals, glossary, presentation).' },
  internal: { label: 'Internal', tone: 'info', description: 'Project working documents for authorised project users.' },
  restricted: { label: 'Restricted', tone: 'danger', description: 'Security, infrastructure and risk documents — need the restricted-documents permission.' },
}

export const TYPE_FILTERS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'docx', label: 'Word' },
  { id: 'xlsx', label: 'Excel' },
  { id: 'md', label: 'Markdown' },
  { id: 'pptx', label: 'PowerPoint' },
  { id: 'image', label: 'Images (SVG / PNG)', test: (d) => ['svg', 'png'].includes(d.fileType) },
  { id: 'text', label: 'Text (Mermaid / YAML)', test: (d) => ['mmd', 'yaml'].includes(d.fileType) },
]

const SAFE_URL = new RegExp(`^${DOCUMENTS_BASE}/[A-Za-z0-9][A-Za-z0-9_.\\-/]*$`)
/** Only catalogue paths under /project-documents/ are ever requested. */
export const isSafeDocumentUrl = (url) => typeof url === 'string' && SAFE_URL.test(url) && !url.includes('..')

export const getDocuments = () => PROJECT_DOCUMENTS
export const getCategories = () => DOCUMENT_CATEGORIES

export const canViewDocuments = (user) => can(user, 'project.documents.view')
export const canViewRestricted = (user) => can(user, 'project.documents.restricted')
/** A user may open / download a document if they can see the library and, for restricted ones, hold the extra key. */
export const canAccessDocument = (user, doc) => canViewDocuments(user) && (doc.access !== 'restricted' || canViewRestricted(user))

/* ---------- Availability ---------- */

const looksLikeAppShell = (res) => /text\/html/i.test(res.headers.get('content-type') || '')

/**
 * Check one URL without downloading it. A static host that answers unknown paths with the SPA's index.html is
 * detected by its HTML content type, so a missing file is never mistaken for an available one.
 */
export const checkUrl = async (url, expectedSize) => {
  if (!isSafeDocumentUrl(url)) return { available: false, reason: 'Invalid document path' }
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    if (!res.ok) return { available: false, reason: res.status === 404 ? 'File not found on the server' : `Server answered ${res.status}` }
    if (looksLikeAppShell(res)) return { available: false, reason: 'File not found (the server returned the app page instead)' }
    const len = Number(res.headers.get('content-length'))
    if (Number.isFinite(len) && len === 0) return { available: false, reason: 'File is empty' }
    return { available: true, size: Number.isFinite(len) && len > 0 ? len : expectedSize, sizeChanged: Number.isFinite(len) && len > 0 && expectedSize > 0 && len !== expectedSize }
  } catch {
    return { available: false, reason: 'Network error while checking the file' }
  }
}

const pool = async (items, limit, worker, onEach) => {
  let i = 0
  const run = async () => {
    while (i < items.length) {
      const idx = i
      i += 1
      const r = await worker(items[idx], idx)
      onEach?.(items[idx], r, idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
}

/** HEAD-check every document (catalogue availability is re-validated in the browser). */
export const checkAvailability = async (docs, onResult) => {
  await pool(docs.filter((d) => d.available), 8, (d) => checkUrl(d.filePath, d.size), (d, r) => onResult(d.id, r))
}

/* ---------- Fetch & save ---------- */

export const fetchDocumentBlob = async (url, expectedSize = 0) => {
  if (!isSafeDocumentUrl(url)) throw new Error('Invalid document path')
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(res.status === 404 ? 'File not found on the server' : `Server answered ${res.status}`)
  if (looksLikeAppShell(res)) throw new Error('File not found (the server returned the app page instead)')
  const blob = await res.blob()
  if (!blob.size) throw new Error('File is empty')
  return { blob, size: blob.size, sizeChanged: expectedSize > 0 && blob.size !== expectedSize }
}

// eslint-disable-next-line no-control-regex
const safeName = (name) => String(name || 'download').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/^\.+/, '').slice(0, 180) || 'download'

export const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeName(fileName)
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30000)
}

/** Download one document as its actual file. */
export const downloadDocument = async (user, doc) => {
  if (!canAccessDocument(user, doc)) throw new Error(doc.access === 'restricted' ? 'You do not have permission to download restricted documents.' : 'You do not have permission to download project documents.')
  const { blob } = await fetchDocumentBlob(doc.filePath, doc.size)
  saveBlob(blob, doc.fileName)
  logAudit({ action: 'EXPORT', module: 'project', entity: 'Project document', recordId: doc.docId || doc.id, recordLabel: doc.fileName, description: `Downloaded project document ${doc.fileName}.` })
  return { ok: true }
}

/* ---------- ZIP ---------- */

const STORED = new Set(['pdf', 'docx', 'xlsx', 'pptx', 'png'])
const ext = (name) => (String(name).split('.').pop() || '').toLowerCase()

/** "a.pdf" → "a (2).pdf" until the path is unused inside the archive. */
const uniquePath = (used, folder, fileName) => {
  const dot = fileName.lastIndexOf('.')
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName
  const suffix = dot > 0 ? fileName.slice(dot) : ''
  let candidate = `${folder}/${safeName(fileName)}`
  let n = 2
  while (used.has(candidate.toLowerCase())) { candidate = `${folder}/${safeName(`${stem} (${n})${suffix}`)}`; n += 1 }
  used.add(candidate.toLowerCase())
  return candidate
}

/**
 * Build a real ZIP from the selected documents.
 * docs: catalogue entries; runtime: { [id]: { available, reason } } from availability checks.
 * Returns { blob, included: [{ doc, path }], excluded: [{ doc, reason }], assets }.
 */
export const buildZip = async (user, docs, { rootFolder = 'Bellomassi_Project_Documents', runtime = {}, onProgress } = {}) => {
  if (!canViewDocuments(user)) throw new Error('You do not have permission to download project documents.')
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const root = safeName(rootFolder)
  const used = new Set()
  const included = []
  const excluded = []
  const queue = []
  for (const d of docs) {
    if (!canAccessDocument(user, d)) excluded.push({ doc: d, reason: 'Restricted — you do not have the restricted-documents permission' })
    else if (!d.available || runtime[d.id]?.available === false) excluded.push({ doc: d, reason: runtime[d.id]?.reason || 'File missing from the documentation package' })
    else queue.push(d)
  }
  // Screenshots referenced by Markdown documents travel with them so the Markdown renders offline.
  const assetSeen = new Set()
  const assetJobs = []
  for (const d of queue) {
    for (const a of d.assets || []) {
      if (assetSeen.has(a.filePath)) continue
      assetSeen.add(a.filePath)
      assetJobs.push({ asset: a, folder: `${root}/${d.zipFolder}/screenshots` })
    }
  }
  const total = queue.length + assetJobs.length
  let done = 0
  const tick = (label) => { done += 1; onProgress?.({ phase: 'fetch', done, total, label }) }
  onProgress?.({ phase: 'fetch', done: 0, total })

  await pool(queue, 4, async (d) => {
    try {
      const { blob } = await fetchDocumentBlob(d.filePath, d.size)
      const p = uniquePath(used, `${root}/${d.zipFolder}`, d.fileName)
      zip.file(p, blob, { compression: STORED.has(ext(d.fileName)) ? 'STORE' : 'DEFLATE', compressionOptions: { level: 6 }, date: d.updatedAt ? new Date(`${d.updatedAt}T12:00:00`) : undefined })
      included.push({ doc: d, path: p })
    } catch (e) {
      excluded.push({ doc: d, reason: e.message })
    }
    tick(d.fileName)
  })
  let assets = 0
  await pool(assetJobs, 4, async ({ asset, folder }) => {
    try {
      const { blob } = await fetchDocumentBlob(asset.filePath, asset.size)
      const p = `${folder}/${safeName(asset.fileName)}`
      if (!used.has(p.toLowerCase())) { used.add(p.toLowerCase()); zip.file(p, blob, { compression: 'STORE' }); assets += 1 }
    } catch { /* a missing screenshot only affects the image inside a Markdown file; listed below */ }
    tick(asset.fileName)
  })
  if (!included.length) {
    return { blob: null, included, excluded, assets }
  }
  included.sort((a, b) => a.path.localeCompare(b.path))
  const lines = [
    `${root} — ZIP manifest`,
    `Created: ${new Date().toISOString()}  ·  by: ${user?.name || 'unknown'}`,
    'Source: Bellomassi project documentation package (Draft — for client review; no document is approved).',
    '',
    `Included documents (${included.length}):`,
    ...included.map((i) => `  ${i.path.slice(root.length + 1)}`),
    assets ? `Screenshots for Markdown documents: ${assets}` : '',
    '',
    `Excluded documents (${excluded.length}):`,
    ...(excluded.length ? excluded.map((x) => `  ${x.doc.sourcePath} — ${x.reason}`) : ['  none']),
  ]
  zip.file(`${root}/_manifest.txt`, lines.filter((l) => l !== null).join('\r\n'))
  const blob = await zip.generateAsync({ type: 'blob', streamFiles: true }, (m) => onProgress?.({ phase: 'zip', percent: Math.round(m.percent), total }))
  logAudit({ action: 'EXPORT', module: 'project', entity: 'Project document', recordLabel: `${root}.zip`, description: `Downloaded ${included.length} project document(s) as ${root}.zip (${excluded.length} excluded).` })
  return { blob, included, excluded, assets }
}

export const formatBytes = (n) => {
  if (!Number.isFinite(n) || n <= 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
