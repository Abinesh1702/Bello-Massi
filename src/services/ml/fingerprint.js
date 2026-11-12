import dayjs from 'dayjs'

/** Fingerprint of the inputs that change predictions (pure) — a stored run with a different one is stale. */
export const inputsFingerprint = (bundle, now = dayjs()) => {
  const inv = (bundle.inventory || []).reduce((s, r) => s + (Number(r.totalQuantity) || 0) * 3 + (Number(r.reservedQuantity) || 0), 0)
  const ord = (bundle.orders || []).reduce((s, o) => s + (o.orderStatus || '').length + (o.items || []).length, 0)
  const rep = (bundle.replenishments || []).map((d) => `${d.id}:${d.status}`).join(',')
  return `${(bundle.inventory || []).length}:${inv}|${(bundle.orders || []).length}:${ord}|${(bundle.deliveries || []).length}|${(bundle.receipts || []).length}|${rep}|${dayjs(now).format('YYYY-MM-DD')}`
}
