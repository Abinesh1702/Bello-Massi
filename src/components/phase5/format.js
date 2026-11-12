/** Small formatting helpers for Phase 5 screens. */
export const formatBytes = (n) => {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1048576) return `${(v / 1024).toFixed(0)} KB`
  return `${(v / 1048576).toFixed(1)} MB`
}
export const userName = (users, id) => (id === 'system' ? 'Automation' : users.find((u) => u.id === id)?.name || '—')
