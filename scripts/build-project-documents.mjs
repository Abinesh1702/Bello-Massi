#!/usr/bin/env node
/**
 * Builds src/data/projectDocuments.js — the catalogue behind Project Documents (/project-documents).
 *
 * Source of truth: the documentation package in docs/BELLOMASSI_PROJECT_DOCUMENTATION and its official index
 * (25_DOCUMENTATION_INDEX/BELLOMASSI_DOCUMENTATION_INDEX.xlsx). Every file listed in the index becomes a catalogue
 * entry; files that the index lists but that are not on disk are kept and marked unavailable (never replaced by
 * placeholders). Diagram renders and sources found on disk are added as Diagrams entries. Screenshots used by the
 * Markdown documents are attached to those documents as assets (for previews and ZIP exports), not listed alone.
 *
 * Usage: node scripts/build-project-documents.mjs   (also runs automatically before `npm run build`)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PKG = path.join(ROOT, 'docs', 'BELLOMASSI_PROJECT_DOCUMENTATION')
const OUT = path.join(ROOT, 'src', 'data', 'projectDocuments.js')
const INDEX = '25_DOCUMENTATION_INDEX/BELLOMASSI_DOCUMENTATION_INDEX.xlsx'
const URL_BASE = '/project-documents'
const SAFE = /^[A-Za-z0-9][A-Za-z0-9_.\-/]*$/

/** Package folder → library category, ZIP folder and access level. */
const CATEGORIES = [
  ['01_PROJECT_OVERVIEW', 'project-overview', 'Project Overview', 'Project_Overview', 'shareable'],
  ['02_BUSINESS_REQUIREMENTS', 'business-requirements', 'Business Requirements', 'Business_Requirements', 'internal'],
  ['03_SYSTEM_REQUIREMENTS', 'system-requirements', 'System Requirements', 'System_Requirements', 'internal'],
  ['04_FUNCTIONAL_REQUIREMENTS', 'functional-requirements', 'Functional Requirements', 'Functional_Requirements', 'internal'],
  ['05_SCOPE_AND_PLANNING', 'scope-planning', 'Scope & Planning', 'Scope_and_Planning', 'internal'],
  ['06_BUSINESS_WORKFLOWS', 'workflows', 'Workflows', 'Workflows', 'internal'],
  ['07_SYSTEM_ARCHITECTURE', 'architecture', 'Architecture', 'Architecture', 'internal'],
  ['08_DATABASE_AND_DATA_DESIGN', 'database', 'Database Design', 'Database', 'internal'],
  ['09_API_AND_INTEGRATION', 'api', 'API Documentation', 'API', 'internal'],
  ['10_SECURITY_AND_COMPLIANCE', 'security', 'Security Documentation', 'Security', 'restricted'],
  ['11_INFRASTRUCTURE_AND_DEVOPS', 'infrastructure', 'Infrastructure', 'Infrastructure', 'restricted'],
  ['12_UI_UX_AND_DESIGN', 'ui-ux', 'UI/UX', 'UI_UX', 'internal'],
  ['13_TESTING_AND_QUALITY_ASSURANCE', 'qa-testing', 'QA & Testing', 'QA_Testing', 'internal'],
  ['14_DEPLOYMENT_AND_RELEASE', 'deployment', 'Deployment', 'Deployment', 'internal'],
  ['15_USER_MANUALS', 'user-manuals', 'User Manuals', 'User_Manuals', 'shareable'],
  ['16_ADMINISTRATION_AND_CONFIGURATION', 'admin', 'Admin Documentation', 'Admin', 'internal'],
  ['17_PROJECT_MANAGEMENT', 'project-management', 'Project Management', 'Project_Management', 'internal'],
  ['18_RISK_AND_CHANGE_MANAGEMENT', 'risk-change', 'Risk & Change Management', 'Risk_and_Change', 'restricted'],
  ['19_CLIENT_HANDOVER', 'client-handover', 'Client Handover', 'Client_Handover', 'internal'],
  ['20_FUTURE_ROADMAP', 'roadmap', 'Roadmap', 'Roadmap', 'internal'],
  ['21_DIAGRAMS_AND_VISUAL_DOCUMENTATION', 'diagrams', 'Diagrams', 'Diagrams', 'internal'],
  ['22_GLOSSARY_AND_REFERENCE', 'glossary', 'Glossary', 'Glossary', 'shareable'],
  ['23_DOCUMENT_CONTROL', 'document-control', 'Document Control', 'Document_Control', 'internal'],
  ['24_PROJECT_PRESENTATION', 'presentation', 'Presentation', 'Presentation', 'shareable'],
  ['25_DOCUMENTATION_INDEX', 'documentation-index', 'Documentation Index', 'Documentation_Index', 'internal'],
].map(([folder, id, label, zipFolder, access]) => ({ folder, id, label, zipFolder, access }))
const CAT_BY_FOLDER = Object.fromEntries(CATEGORIES.map((c) => [c.folder, c]))

const TYPES = {
  pdf: { group: 'pdf', label: 'PDF', preview: 'pdf' },
  docx: { group: 'word', label: 'Word', preview: 'docx' },
  xlsx: { group: 'excel', label: 'Excel', preview: 'xlsx' },
  pptx: { group: 'other', label: 'PowerPoint', preview: null },
  md: { group: 'other', label: 'Markdown', preview: 'markdown' },
  yaml: { group: 'other', label: 'YAML (OpenAPI)', preview: 'text' },
  mmd: { group: 'other', label: 'Mermaid source', preview: 'text' },
  svg: { group: 'other', label: 'SVG image', preview: 'image' },
  png: { group: 'other', label: 'PNG image', preview: 'image' },
}

const xmlText = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')

/** Rows of one worksheet (inline or shared strings) as arrays of cell text. */
async function sheetRows(zip, sheetFile) {
  const shared = []
  const ss = zip.file('xl/sharedStrings.xml')
  if (ss) for (const m of (await ss.async('string')).matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(xmlText([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')))
  const xml = await zip.file(sheetFile).async('string')
  return [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((row) => {
    const out = []
    for (const c of row[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const col = [...c[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1
      const attrs = c[2] || ''
      const body = c[3] || ''
      let v = ''
      if (/t="inlineStr"/.test(attrs)) v = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')
      else if (/t="s"/.test(attrs)) v = shared[Number((body.match(/<v>([\s\S]*?)<\/v>/) || [])[1])] || ''
      else v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1] || ''
      out[col] = xmlText(v)
    }
    return out
  })
}

const exists = (rel) => { try { return fs.statSync(path.join(PKG, rel)).isFile() } catch { return false } }
const statOf = (rel) => { try { return fs.statSync(path.join(PKG, rel)) } catch { return null } }

async function xlsxPurpose(rel) {
  try {
    const zip = await JSZip.loadAsync(fs.readFileSync(path.join(PKG, rel)))
    const rows = await sheetRows(zip, 'xl/worksheets/sheet1.xml')
    return (rows.find((r) => r[0] === 'Purpose') || [])[1] || ''
  } catch { return '' }
}
const mdPurpose = (rel) => {
  try {
    const t = fs.readFileSync(path.join(PKG, rel), 'utf8')
    const m = t.match(/^## Purpose\s*\n+([^\n]+(?:\n[^\n#|][^\n]*)*)/m)
    return m ? m[1].replace(/\s+/g, ' ').trim() : ''
  } catch { return '' }
}
const mdAssets = (rel) => {
  try {
    const t = fs.readFileSync(path.join(PKG, rel), 'utf8')
    const dir = path.posix.dirname(rel)
    const set = new Set([...t.matchAll(/\]\((screenshots\/[A-Za-z0-9_.-]+\.png)\)/g)].map((m) => path.posix.join(dir, m[1])))
    return [...set].sort()
  } catch { return [] }
}

async function main() {
  if (!exists(INDEX)) throw new Error(`Documentation index not found: ${path.join(PKG, INDEX)}`)
  const zip = await JSZip.loadAsync(fs.readFileSync(path.join(PKG, INDEX)))
  const wb = await zip.file('xl/workbook.xml').async('string')
  const names = [...wb.matchAll(/<sheet [^>]*name="([^"]+)"/g)].map((m) => m[1])
  const idxSheet = names.indexOf('Documentation Index') + 1
  const rows = (await sheetRows(zip, `xl/worksheets/sheet${idxSheet}.xml`)).slice(1)

  const entries = new Map()
  const add = (rel, meta) => {
    if (!SAFE.test(rel) || rel.includes('..')) throw new Error(`Unsafe path in catalogue: ${rel}`)
    if (entries.has(rel)) return
    const folder = rel.split('/')[0]
    const cat = CAT_BY_FOLDER[folder]
    if (!cat) return
    const ext = path.extname(rel).slice(1).toLowerCase()
    const type = TYPES[ext]
    if (!type) return
    entries.set(rel, { rel, cat, ext, type, ...meta })
  }
  for (const r of rows) {
    const [docId, title, , version, status, filePaths, owner, module, related, created, updated] = r
    if (!filePaths) continue
    for (const p of String(filePaths).split(/\n|,\s*/).map((s) => s.trim()).filter(Boolean)) {
      if (p.includes('*') || !p.includes('/')) continue // patterns and root copies are expanded / skipped below
      add(p, { docId: docId && docId !== '—' ? docId : null, title, version, status, owner, module, related, created, updated })
    }
  }
  // Diagram sources and renders listed in the index by pattern.
  const DGM = '21_DIAGRAMS_AND_VISUAL_DOCUMENTATION'
  for (const sub of ['mermaid', 'svg', 'png']) {
    const dir = path.join(PKG, DGM, sub)
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir).sort()) {
      const stem = f.replace(/\.[^.]+$/, '')
      const id = (stem.match(/^DGM-\d+/) || [stem])[0]
      const name = stem.slice(id.length).replace(/^_/, '').replace(/_/g, ' ')
      add(`${DGM}/${sub}/${f}`, { docId: id, title: `${id} ${name} — ${sub === 'mermaid' ? 'Mermaid source' : `${sub.toUpperCase()} render`}`, version: '1.0', status: 'Draft — for client review', owner: 'Solution Architect', module: 'All modules', related: 'BM-DGM-001', created: '2026-11-12', updated: '2026-11-12' })
    }
  }

  const twinPurpose = {}
  const list = []
  for (const e of [...entries.values()].sort((a, b) => a.rel.localeCompare(b.rel))) {
    const st = statOf(e.rel)
    let description = ''
    const base = e.rel.replace(/\.[^.]+$/, '')
    if (e.ext === 'md') description = mdPurpose(e.rel)
    else if (e.ext === 'xlsx') description = await xlsxPurpose(e.rel)
    else if (['docx', 'pdf'].includes(e.ext)) description = twinPurpose[base] ?? (twinPurpose[base] = mdPurpose(`${base}.md`))
    else if (e.ext === 'pptx') description = 'Project presentation deck (PowerPoint). Speaker notes are in BM-PRS-002.'
    else if (e.ext === 'yaml') description = 'Proposed OpenAPI 3 specification of the production REST API (not implemented).'
    else description = e.ext === 'mmd' ? 'Editable Mermaid source of the diagram.' : 'Rendered diagram image.'
    const docId = e.docId || null
    const fileName = path.posix.basename(e.rel)
    list.push({
      id: e.rel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      docId,
      title: e.title || fileName,
      fileName,
      filePath: `${URL_BASE}/${e.rel}`,
      sourcePath: e.rel,
      category: e.cat.label,
      categoryId: e.cat.id,
      zipFolder: e.rel.split('/').length > 2 ? `${e.cat.zipFolder}/${e.rel.split('/').slice(1, -1).join('/')}` : e.cat.zipFolder,
      fileType: e.ext,
      typeGroup: e.type.group,
      typeLabel: e.type.label,
      description,
      version: e.version || '1.0',
      updatedAt: e.updated || (st ? st.mtime.toISOString().slice(0, 10) : null),
      status: e.status || 'Draft — for client review',
      owner: e.owner || '',
      size: st ? st.size : 0,
      available: Boolean(st && st.size > 0),
      previewSupported: Boolean(e.type.preview),
      previewMode: e.type.preview,
      access: e.cat.access,
      assets: e.ext === 'md' ? mdAssets(e.rel).filter(exists).map((a) => ({ fileName: path.posix.basename(a), filePath: `${URL_BASE}/${a}`, sourcePath: a, size: statOf(a).size })) : [],
    })
  }
  const ids = new Set()
  for (const d of list) { if (ids.has(d.id)) throw new Error(`Duplicate id ${d.id}`); ids.add(d.id) }

  const header = `/* eslint-disable */
// GENERATED by scripts/build-project-documents.mjs from docs/BELLOMASSI_PROJECT_DOCUMENTATION
// (official index: ${INDEX}). Do not edit by hand — re-run \`npm run docs:catalog\`.
`
  const body = `${header}
export const DOCUMENTS_BASE = ${JSON.stringify(URL_BASE)}
export const DOCUMENTS_SOURCE_DIR = 'docs/BELLOMASSI_PROJECT_DOCUMENTATION'
export const CATALOG_GENERATED_AT = ${JSON.stringify(new Date().toISOString())}
export const DOCUMENT_CATEGORIES = ${JSON.stringify(CATEGORIES.map(({ id, label, zipFolder, access, folder }) => ({ id, label, zipFolder, access, folder })), null, 1)}
export const PROJECT_DOCUMENTS = [
${list.map((d) => JSON.stringify(d)).join(',\n')},
]
`
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, body)
  const avail = list.filter((d) => d.available).length
  console.log(`project documents: ${list.length} catalogue entries, ${avail} available, ${list.length - avail} missing → ${path.relative(ROOT, OUT)}`)
}

main().catch((e) => { console.error(e.message); process.exit(1) })
