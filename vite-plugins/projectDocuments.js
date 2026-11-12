/**
 * Serves and publishes the project documentation files used by Project Documents (/project-documents).
 *
 * - Only files listed in the generated catalogue (src/data/projectDocuments.js) — and the screenshots those
 *   documents reference — are served; anything else under /project-documents/ is a real 404 (no SPA fallback,
 *   no directory listing, no path traversal: requests are matched against the catalogue, never joined blindly).
 * - Dev server and `vite preview` stream them from docs/BELLOMASSI_PROJECT_DOCUMENTATION.
 * - `vite build` copies exactly those files to dist/project-documents/ so any static host can serve them.
 *
 * Prototype note: static files are not protected by the app's sign-in. Production should keep documents in private
 * object storage behind an authenticated API that issues short-lived signed URLs.
 */
import fs from 'node:fs'
import path from 'node:path'
import { PROJECT_DOCUMENTS, DOCUMENTS_BASE, DOCUMENTS_SOURCE_DIR } from '../src/data/projectDocuments.js'

const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  md: 'text/markdown; charset=utf-8',
  yaml: 'text/yaml; charset=utf-8',
  mmd: 'text/plain; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
}

const allowList = () => {
  const map = new Map()
  for (const d of PROJECT_DOCUMENTS) {
    map.set(d.filePath, d.sourcePath)
    for (const a of d.assets || []) map.set(a.filePath, a.sourcePath)
  }
  return map
}

export default function projectDocuments() {
  let root = process.cwd()
  let outDir = 'dist'
  const files = allowList()
  const sourceDir = () => path.join(root, DOCUMENTS_SOURCE_DIR)

  const middleware = (req, res, next) => {
    let urlPath
    try { urlPath = decodeURIComponent(new URL(req.url, 'http://local').pathname) } catch { res.statusCode = 400; res.end('Bad request'); return }
    // Anything addressed to /project-documents/ (even if it normalises elsewhere, e.g. with "..") is answered here.
    if (!urlPath.startsWith(`${DOCUMENTS_BASE}/`) && !String(req.url).startsWith(`${DOCUMENTS_BASE}/`)) return next()
    const rel = files.get(urlPath)
    const abs = rel ? path.join(sourceDir(), rel) : null
    let stat = null
    try { stat = abs && fs.statSync(abs) } catch { stat = null }
    if (!rel || !stat || !stat.isFile()) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Document not found')
      return
    }
    res.statusCode = 200
    res.setHeader('Content-Type', MIME[path.extname(abs).slice(1).toLowerCase()] || 'application/octet-stream')
    res.setHeader('Content-Length', String(stat.size))
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'no-cache')
    if (req.method === 'HEAD') { res.end(); return }
    fs.createReadStream(abs).pipe(res)
  }

  return {
    name: 'bellomassi-project-documents',
    configResolved(config) { root = config.root; outDir = path.resolve(config.root, config.build.outDir) },
    configureServer(server) { server.middlewares.use(middleware) },
    configurePreviewServer(server) { server.middlewares.use(middleware) },
    closeBundle() {
      let copied = 0
      let missing = 0
      for (const [urlPath, rel] of files) {
        const src = path.join(sourceDir(), rel)
        if (!fs.existsSync(src)) { missing += 1; continue }
        const dest = path.join(outDir, urlPath.replace(/^\//, ''))
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(src, dest)
        copied += 1
      }
      this.info?.(`project documents: ${copied} files copied to ${path.relative(root, outDir)}${DOCUMENTS_BASE}${missing ? `, ${missing} missing` : ''}`)
      if (!this.info) console.log(`project documents: ${copied} files copied${missing ? `, ${missing} missing` : ''}`)
    },
  }
}
