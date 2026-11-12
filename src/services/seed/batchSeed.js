/** Opening lots for the batch layer — pure (no storage access) so the seed and migrations can use it. */
import dayjs from 'dayjs'

const round = (n) => Math.round((Number(n) || 0) * 1000) / 1000
/* ---------- Opening lots (seed / migration) ---------- */
const SHELF_DAYS = { Frozen: [180, 420], Chilled: [8, 40], Ambient: [120, 360] }
export const buildOpeningBatches = ({ inventory, products, movements, locations = [], now = dayjs() }) => {
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  const batches = []
  let i = 0
  inventory.forEach((r) => {
    const p = P[r.productId]
    if (!p || !(r.totalQuantity > 0)) return
    const cond = p.storageCondition || 'Frozen'
    const [lo, hi] = SHELF_DAYS[cond] || SHELF_DAYS.Frozen
    const parts = r.totalQuantity >= 60 ? [0.5, 0.3, 0.2] : r.totalQuantity >= 20 ? [0.6, 0.4] : [1]
    let left = r.totalQuantity
    parts.forEach((share, k) => {
      i += 1
      const qty = k === parts.length - 1 ? round(left) : Math.max(1, Math.floor(r.totalQuantity * share))
      left = round(left - qty)
      const span = lo + Math.round(((i * 37) % 100) / 100 * (hi - lo))
      // A few lots near expiry so the alerts have real data
      const expiry = i % 17 === 0 ? now.add(4, 'day') : i % 11 === 0 ? now.add(20, 'day') : now.add(span, 'day')
      const bins = locations.filter((l) => l.level === 'BIN' && l.hubId === r.hubId && l.storageType === cond)
      batches.push({
        id: `bat-open-${i}`,
        batchNumber: `OB${now.format('YY')}-${String(p.code || '').replace(/[^A-Z0-9]/gi, '').slice(-4)}-${String(i).padStart(4, '0')}`,
        lotNumber: `L${String(1000 + i)}`,
        productId: r.productId, hubId: r.hubId,
        locationId: bins.length ? bins[i % bins.length].id : null,
        quantity: qty, receivedQuantity: qty,
        mfgDate: expiry.subtract(hi, 'day').format('YYYY-MM-DD'),
        expiryDate: expiry.format('YYYY-MM-DD'),
        supplierBatch: `SB-${1000 + ((i * 13) % 9000)}`,
        originCountry: ['Brazil', 'India', 'United Arab Emirates', 'Netherlands', 'Thailand'][i % 5],
        supplierId: null, grnId: null, grnNumber: null,
        sourceMovement: 'OPENING', sourceType: 'Opening balance',
        qaStatus: 'AVAILABLE',
        receivedAt: now.subtract(30 + (i % 40), 'day').toISOString(),
        consumption: [], createdAt: now.toISOString(),
      })
    })
  })
  return { batches, state: { processedIds: movements.map((m) => m.id), unmatched: [], transferPool: {}, syncedAt: now.toISOString() } }
}
