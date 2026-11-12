import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Download, ExternalLink, FileWarning, Info, X } from 'lucide-react'
import Button from '../common/Button'
import Badge from '../common/Badge'
import LoadingSpinner from '../common/LoadingSpinner'
import { ACCESS_LABELS, fetchDocumentBlob, formatBytes } from '../../services/projectDocumentsService'
import { cn } from '../../utils/helpers'
import { FileTypeIcon } from './DocumentIcons'

/* ---------- Markdown ---------- */
async function renderMarkdown(text, baseUrl) {
  const [{ marked }, { default: DOMPurify }] = await Promise.all([import('marked'), import('dompurify')])
  const renderer = new marked.Renderer()
  const baseCode = renderer.code.bind(renderer)
  renderer.code = (token) => {
    if (token.lang === 'mermaid') {
      return `<p class="mermaid-note">Mermaid diagram source — the rendered diagram is in the Word / PDF edition and in the Diagrams category.</p>${baseCode(token)}`
    }
    return baseCode(token)
  }
  const html = marked.parse(text, { renderer, gfm: true, async: false })
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
  // Resolve relative links and images against the document's own folder.
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, 'text/html')
  doc.querySelectorAll('img[src]').forEach((img) => { img.setAttribute('src', new URL(img.getAttribute('src'), baseUrl).pathname); img.setAttribute('loading', 'lazy') })
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href')
    if (/^https?:/i.test(href)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); return }
    if (href.startsWith('#')) return
    a.setAttribute('href', new URL(href, baseUrl).pathname)
  })
  return doc.body.firstChild.innerHTML
}

/* ---------- Word (.docx) via mammoth ---------- */
async function renderDocx(blob) {
  const [mammoth, { default: DOMPurify }] = await Promise.all([import('mammoth/mammoth.browser.js'), import('dompurify')])
  const lib = mammoth.default || mammoth
  const { value, messages } = await lib.convertToHtml({ arrayBuffer: await blob.arrayBuffer() })
  return { html: DOMPurify.sanitize(value, { USE_PROFILES: { html: true } }), warnings: messages.filter((m) => m.type === 'warning').length }
}

/* ---------- Excel (.xlsx): values of each sheet, read with JSZip ---------- */
const decodeXml = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
const colIndex = (ref) => [...ref.replace(/\d+/g, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1
const MAX_ROWS = 300
const MAX_COLS = 30

async function readXlsx(blob) {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const wb = await zip.file('xl/workbook.xml')?.async('string')
  if (!wb) throw new Error('Not a valid Excel workbook')
  const rels = await zip.file('xl/_rels/workbook.xml.rels')?.async('string') || ''
  const relMap = Object.fromEntries([...rels.matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((m) => [m[1], m[2]]))
  const shared = []
  const ss = await zip.file('xl/sharedStrings.xml')?.async('string')
  if (ss) for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(decodeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')))
  const sheets = []
  for (const m of wb.matchAll(/<sheet [^>]*?name="([^"]+)"[^>]*?r:id="([^"]+)"/g)) {
    const target = relMap[m[2]] || ''
    const file = zip.file(target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`)
    if (!file) continue
    const xml = await file.async('string')
    const rows = []
    let totalRows = 0
    for (const r of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      totalRows += 1
      if (rows.length >= MAX_ROWS) continue
      const out = []
      for (const c of r[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const i = colIndex(c[1])
        if (i >= MAX_COLS) continue
        const attrs = c[2] || ''
        const body = c[3] || ''
        let v = ''
        if (/t="inlineStr"/.test(attrs)) v = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')
        else if (/t="s"/.test(attrs)) v = shared[Number((body.match(/<v>([\s\S]*?)<\/v>/) || [])[1])] ?? ''
        else if (/t="b"/.test(attrs)) v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1] === '1' ? 'TRUE' : 'FALSE'
        else v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1] ?? ''
        out[i] = decodeXml(v)
      }
      rows.push(Array.from(out, (x) => x ?? ''))
    }
    sheets.push({ name: decodeXml(m[1]), rows, totalRows })
  }
  return sheets
}

function XlsxPreview({ sheets }) {
  const [active, setActive] = useState(0)
  const sheet = sheets[active]
  const width = Math.max(1, ...(sheet?.rows || []).map((r) => r.length))
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4 pt-2 scroll-thin" role="tablist" aria-label="Worksheets">
        {sheets.map((s, i) => (
          <button key={s.name} type="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)}
            className={cn('shrink-0 rounded-t-lg border border-b-0 px-3 py-1.5 text-[13px]', i === active ? 'border-line bg-surface font-semibold text-ink' : 'border-transparent text-muted hover:text-ink')}>{s.name}</button>
        ))}
      </div>
      {sheet && (
        <div className="min-h-0 flex-1 overflow-auto scroll-thin">
          <table className="min-w-full border-collapse text-[12.5px]">
            <tbody>
              {sheet.rows.map((r, ri) => (
                <tr key={ri} className={ri === 0 ? 'sticky top-0 bg-surface-2 font-semibold text-ink' : 'odd:bg-surface even:bg-surface-2/40'}>
                  <td className="border border-line px-2 py-1 text-right text-[11px] text-muted tabular">{ri + 1}</td>
                  {Array.from({ length: width }, (_, ci) => <td key={ci} className="max-w-[28rem] whitespace-pre-wrap border border-line px-2 py-1 align-top text-ink-2">{r[ci] ?? ''}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {sheet.totalRows > sheet.rows.length && <p className="px-4 py-2 text-xs text-muted">Showing the first {sheet.rows.length} of {sheet.totalRows} rows — download the file for the full sheet.</p>}
        </div>
      )}
    </div>
  )
}

const PREVIEW_NOTES = {
  docx: 'Word preview converted in the browser — text, headings, tables and images are shown; page layout, headers and footers are simplified. Download for the exact document.',
  xlsx: 'Excel preview shows cell values only (no formatting, filters or formulas).',
  markdown: 'Markdown rendered in the browser. Mermaid diagrams are shown as source.',
}

/**
 * Full-height preview dialog for one document: metadata, the preview the file type supports (PDF in the browser's
 * PDF viewer, Markdown, Word, Excel values, images, text) and its Download action. Unsupported types say so plainly.
 */
export default function DocumentViewer({ doc, onClose, onDownload, onOpenPath, downloading }) {
  const titleId = useId()
  const panelRef = useRef(null)
  const [state, setState] = useState({ status: 'loading' })
  const mode = doc?.previewMode

  useEffect(() => {
    if (!doc) return undefined
    let cancelled = false
    let objectUrl = null
    setState({ status: 'loading' })
    ;(async () => {
      try {
        if (!mode) { setState({ status: 'unsupported' }); return }
        const { blob, sizeChanged } = await fetchDocumentBlob(doc.filePath, doc.size)
        if (cancelled) return
        if (mode === 'pdf') {
          objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
          setState({ status: 'ready', pdf: objectUrl, sizeChanged })
        } else if (mode === 'image') {
          objectUrl = URL.createObjectURL(blob)
          setState({ status: 'ready', image: objectUrl, sizeChanged })
        } else if (mode === 'text') {
          setState({ status: 'ready', text: await blob.text(), sizeChanged })
        } else if (mode === 'markdown') {
          const html = await renderMarkdown(await blob.text(), new URL(doc.filePath, window.location.origin).href)
          if (!cancelled) setState({ status: 'ready', html, sizeChanged })
        } else if (mode === 'docx') {
          const { html, warnings } = await renderDocx(blob)
          if (!cancelled) setState({ status: 'ready', html, warnings, sizeChanged })
        } else if (mode === 'xlsx') {
          const sheets = await readXlsx(blob)
          if (!cancelled) setState({ status: 'ready', sheets, sizeChanged })
        }
      } catch (e) {
        if (!cancelled) setState({ status: 'error', error: e.message || 'The document could not be loaded.' })
      }
    })()
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [doc, mode])

  useEffect(() => {
    if (!doc) return undefined
    const prev = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector('[data-autofocus]')?.focus()
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.() }
  }, [doc, onClose])

  // Links inside Markdown / Word previews that point at another catalogue document open in this viewer.
  const onContentClick = (e) => {
    const a = e.target.closest?.('a[href]')
    if (!a) return
    const href = a.getAttribute('href')
    if (href?.startsWith('/project-documents/')) {
      e.preventDefault()
      onOpenPath?.(href.split('#')[0])
    }
  }

  const access = ACCESS_LABELS[doc?.access] || ACCESS_LABELS.internal
  const meta = useMemo(() => doc ? [
    ['File name', doc.fileName], ['Category', doc.category], ['Version', doc.version], ['Last updated', doc.updatedAt || '—'],
    ['File type', doc.typeLabel], ['Size', formatBytes(doc.size)], ['Status', doc.status], ['Document ID', doc.docId || '—'],
  ] : [], [doc])

  if (!doc) return null
  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-stretch justify-center p-0 sm:p-4" data-testid="document-viewer">
      <div className="absolute inset-0 bg-[#0b1024]/55 animate-fade-in" onClick={onClose} aria-hidden />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="relative flex w-full max-w-6xl flex-col overflow-hidden border border-line bg-surface shadow-pop sm:rounded-xl animate-scale-in">
        <div className="flex items-start gap-3 border-b border-line px-4 py-3 sm:px-5">
          <FileTypeIcon type={doc.fileType} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold leading-snug text-ink sm:text-lg">{doc.title}</h2>
            <p className="truncate text-xs text-muted">{doc.docId ? `${doc.docId} · ` : ''}{doc.fileName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {['pdf', 'image'].includes(mode) && state.status === 'ready' && (
              <Button size="sm" variant="secondary" icon={ExternalLink} href={state.pdf || state.image} target="_blank" rel="noopener" className="hidden sm:inline-flex">New tab</Button>
            )}
            <Button size="sm" icon={Download} loading={downloading} onClick={() => onDownload(doc)} data-autofocus>Download</Button>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-3 hover:text-ink" aria-label="Close preview"><X size={18} aria-hidden /></button>
          </div>
        </div>
        <p className="border-b border-line bg-surface-2/60 px-4 py-2 text-xs text-muted sm:hidden">{doc.category} · {doc.typeLabel} · {formatBytes(doc.size)} · v{doc.version} · {doc.updatedAt || '—'} · {doc.status}</p>
        <dl className="hidden sm:grid grid-cols-2 gap-x-4 gap-y-1 border-b border-line bg-surface-2/60 px-4 py-2.5 text-xs sm:grid-cols-4 sm:px-5">
          {meta.map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-muted">{k}</dt><dd className="truncate font-medium text-ink" title={String(v)}>{v}</dd></div>)}
        </dl>
        <div className="hidden flex-wrap items-center gap-2 px-4 py-2 text-xs text-muted sm:flex sm:px-5">
          <Badge tone={access.tone}>{access.label}</Badge>
          {doc.description && <span className="min-w-0 flex-1">{doc.description}</span>}
        </div>
        {PREVIEW_NOTES[mode] && state.status === 'ready' && <p className="flex gap-1.5 border-t border-line px-4 py-1.5 text-[11.5px] text-muted sm:px-5"><Info size={13} className="mt-0.5 shrink-0" aria-hidden />{PREVIEW_NOTES[mode]}</p>}
        {state.sizeChanged && <p className="flex gap-1.5 px-4 py-1 text-[11.5px] text-warning sm:px-5"><AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />The file on the server differs in size from the catalogue — run <code>npm run docs:catalog</code> to refresh it.</p>}

        <div className="min-h-0 flex-1 border-t border-line bg-canvas" data-testid="document-preview" data-preview-mode={mode || 'none'} data-preview-status={state.status}>
          {state.status === 'loading' && <div className="grid h-full min-h-[320px] place-items-center"><LoadingSpinner label="Loading preview…" /></div>}
          {state.status === 'error' && (
            <div className="grid h-full min-h-[320px] place-items-center p-6 text-center">
              <div><FileWarning size={34} className="mx-auto text-danger" aria-hidden /><p className="mt-2 font-semibold text-ink">Preview not available</p><p className="mt-1 max-w-md text-sm text-muted">{state.error}</p></div>
            </div>
          )}
          {state.status === 'unsupported' && (
            <div className="grid h-full min-h-[320px] place-items-center p-6 text-center">
              <div>
                <FileTypeIcon type={doc.fileType} size="lg" className="mx-auto" />
                <p className="mt-3 font-semibold text-ink">No in-browser preview for {doc.typeLabel} files</p>
                <p className="mt-1 max-w-md text-sm text-muted">Download the file and open it in {doc.fileType === 'pptx' ? 'PowerPoint, Keynote or Google Slides' : 'a suitable application'}.</p>
                <Button className="mt-4" icon={Download} loading={downloading} onClick={() => onDownload(doc)}>Download {doc.fileName}</Button>
              </div>
            </div>
          )}
          {state.status === 'ready' && state.pdf && <iframe title={`PDF preview of ${doc.fileName}`} src={state.pdf} className="h-full min-h-[60vh] w-full border-0 bg-white" />}
          {state.status === 'ready' && state.image && <div className="grid h-full min-h-[320px] place-items-center overflow-auto p-4"><img src={state.image} alt={doc.title} className="max-h-full max-w-full rounded-md border border-line bg-white" /></div>}
          {state.status === 'ready' && state.text !== undefined && <pre className="h-full overflow-auto whitespace-pre-wrap p-4 font-mono text-[12.5px] leading-relaxed text-ink-2 sm:p-5">{state.text}</pre>}
          {state.status === 'ready' && state.html !== undefined && (
            // Sanitised with DOMPurify before rendering.
            <div className="h-full overflow-auto" onClick={onContentClick}>
              <article className="doc-prose mx-auto max-w-4xl px-4 py-5 sm:px-8" dangerouslySetInnerHTML={{ __html: state.html }} />
            </div>
          )}
          {state.status === 'ready' && state.sheets && <XlsxPreview sheets={state.sheets} />}
        </div>
      </div>
    </div>,
    document.body,
  )
}
