// Read-only documentation helper: seeds the demo data in an in-memory storage and writes a JSON summary of every key.
const st = {}
const mem = { getItem: (k) => (k in st ? st[k] : null), setItem: (k, v) => { st[k] = String(v) }, removeItem: (k) => { delete st[k] }, key: (i) => Object.keys(st)[i], get length() { return Object.keys(st).length }, clear: () => { for (const k of Object.keys(st)) delete st[k] } }
globalThis.window = globalThis; globalThis.localStorage = mem; globalThis.sessionStorage = { ...mem }
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {}; globalThis.dispatchEvent = () => {}
globalThis.CustomEvent = class { constructor(t, o) { this.type = t; this.detail = o?.detail } }
const s = await import('../../../../src/services/storageService.js')
s.initializeStorage()
const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? `array<${v.length ? typeOf(v[0]) : 'any'}>` : typeof v)
const out = {}
for (const k of Object.keys(st).sort()) {
  let v; try { v = JSON.parse(st[k]) } catch { v = st[k] }
  const rec = Array.isArray(v) ? v[0] : v
  const fields = {}
  if (rec && typeof rec === 'object' && !Array.isArray(rec)) {
    const all = Array.isArray(v) ? v : [v]
    for (const r of all) for (const [f, x] of Object.entries(r || {})) if (!(f in fields) || fields[f] === 'null') fields[f] = typeOf(x)
  }
  out[k] = { kind: Array.isArray(v) ? 'array' : typeof v, count: Array.isArray(v) ? v.length : null, bytes: st[k].length, fields, sample: rec && typeof rec === 'object' ? JSON.stringify(rec).slice(0, 600) : String(v).slice(0, 200) }
}
const fs = await import('node:fs')
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
console.log('keys', Object.keys(out).length, 'bytes', Object.values(st).reduce((a, b) => a + b.length, 0))
