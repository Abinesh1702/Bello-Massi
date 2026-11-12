// Prints, per role, the routes reachable from the sidebar and from all routes (for before/after comparisons).
const mem = new Map()
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size } }
globalThis.window = globalThis; globalThis.addEventListener = () => {}; globalThis.dispatchEvent = () => true
const src = new URL('../src/', import.meta.url).href
const { initializeStorage } = await import(src + 'services/storageService.js')
const { syncCatalog } = await import(src + 'services/rbacService.js')
initializeStorage(); syncCatalog()
const nav = await import(src + 'config/navigation.js')
const { STORAGE_KEYS: K } = await import(src + 'utils/constants.js')
const users = JSON.parse(localStorage.getItem(K.DEMO_USERS))
const out = {}
for (const u of users) {
  const visible = nav.getNavigationForRole(u).flatMap((g) => (g.children ? g.children.map((c) => c.path) : [g.path]))
  const reachable = nav.NAV_ITEMS.filter((i) => nav.canAccessItem(i, u)).map((i) => i.path)
  out[u.username] = { visible, reachable }
}
const ids = nav.NAV_ITEMS.map((i) => i.id); const paths = nav.NAV_ITEMS.map((i) => i.path)
out.__meta = { items: ids.length, dupIds: ids.filter((x, i) => ids.indexOf(x) !== i), dupPaths: paths.filter((x, i) => paths.indexOf(x) !== i), groups: nav.NAVIGATION.length }
console.log(JSON.stringify(out))
