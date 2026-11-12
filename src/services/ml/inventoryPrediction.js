/**
 * Predictive inventory (pure). For every stock line (product × hub):
 * demand history → forecast → coverage → stock-out date → safety stock → reorder point → recommendation.
 *
 * Formulas (shown in the UI):
 *   Available            = on hand − reserved − damaged
 *   Projected position   = available − committed open orders + incoming replenishment
 *   Safety stock         = z(service level) × σ(daily demand) × √(lead time)        (≥ 14 active days of history)
 *                          or average daily demand × safety days                       (prototype fallback)
 *   Reorder point        = average daily demand × lead time + safety stock
 *   Target stock         = reorder point + average daily demand × review period (capped at the hub maximum)
 *   Recommended quantity = max(0, target − projected position), rounded up to MOQ and pack multiple
 * Nothing here changes stock.
 */
import dayjs from 'dayjs'
import { FORECAST_MODELS, FORECAST_STATUS, RISK, RISK_FLAGS as F, RISK_META, SERVICE_LEVEL_Z } from '../../config/aiConfig'
import { getAvailable, getStockStatus } from '../../utils/stock'
import { committedOpenDemand, demandSeries } from './demandData'
import { forecastSeries } from './forecastEngine'
import { mean, round, slope, std } from './timeSeries'

const ACTIVE_REPLENISHMENT = ['APPROVED', 'CONVERTED']

/** Quantity approved for replenishment but not yet received through a stock receipt. */
export const incomingQuantity = (drafts, receipts, productId, hubId) =>
  (drafts || []).filter((d) => ACTIVE_REPLENISHMENT.includes(d.status) && d.hubId === hubId).reduce((s, d) => {
    const line = (d.lines || []).find((l) => l.productId === productId)
    if (!line) return s
    const received = (receipts || []).filter((r) => r.referenceNumber === d.number && r.productId === productId && r.hubId === hubId).reduce((q, r) => q + (Number(r.quantity) || 0), 0)
    return s + Math.max(0, (Number(line.quantity) || 0) - received)
  }, 0)

export const supplierFor = (product, settings) => {
  const params = settings.productParams?.[product.id] || {}
  const list = settings.suppliers || []
  return list.find((s) => s.id === params.supplierId) || list.find((s) => (s.categories || []).includes(product.category)) || list[0] || null
}

export const leadTimeFor = (product, settings) => {
  const params = settings.productParams?.[product.id] || {}
  if (Number(params.leadTimeDays) > 0) return { days: Number(params.leadTimeDays), source: 'Product setting' }
  const sup = supplierFor(product, settings)
  if (sup && Number(sup.leadTimeDays) > 0) return { days: Number(sup.leadTimeDays), source: `Supplier · ${sup.name}` }
  return { days: Number(settings.defaultLeadTimeDays) || 7, source: 'Default lead time' }
}

const roundUpTo = (q, step) => (step > 1 ? Math.ceil(q / step) * step : Math.ceil(q))

export const predictInventory = (data, settings, { now = dayjs(), index }) => {
  const today = dayjs(now).startOf('day')
  const to = today.subtract(1, 'day').format('YYYY-MM-DD')
  const lookback = Math.max(14, Number(settings.lookbackDays) || 56)
  const from = today.subtract(lookback, 'day').format('YYYY-MM-DD')
  const horizon = Math.max(7, Number(settings.forecastHorizonDays) || 14)
  const z = SERVICE_LEVEL_Z[settings.serviceLevel] || SERVICE_LEVEL_Z[95]
  const basis = settings.demandBasis || 'dispatched'
  const P = Object.fromEntries((data.products || []).map((p) => [p.id, p]))
  const H = Object.fromEntries((data.hubs || []).map((h) => [h.id, h]))

  const rows = (data.inventory || []).filter((r) => P[r.productId]?.trackInventory !== false && P[r.productId]?.status === 'Active' && H[r.hubId]?.status === 'Active').map((rec) => {
    const product = P[rec.productId]
    const hub = H[rec.hubId]
    const series = demandSeries(index, rec.productId, rec.hubId, { from, to })
    const y = series[basis]
    const activeDays = y.filter((v) => v > 0).length
    const avgDaily = mean(y)
    const sd = std(y)
    const last7 = mean(y.slice(-7))
    const prior = mean(y.slice(0, -7))
    const trendPerDay = slope(y)
    const trendPctWeek = avgDaily ? (trendPerDay * 7 / avgDaily) * 100 : 0
    const weekday = Array.from({ length: 7 }, (_, d) => {
      const vals = y.filter((_, i) => dayjs(series.days[i]).day() === d)
      return avgDaily ? round(mean(vals) / avgDaily, 2) : 0
    })

    const fc = forecastSeries({ values: y, keys: series.days, granularity: 'day', horizonPeriods: horizon, model: settings.defaultModel || FORECAST_MODELS.AUTO, settings, confidenceLevel: Number(settings.confidenceLevel) || 95 })
    const modelOk = fc.status === FORECAST_STATUS.COMPLETED
    const forecastDemand = modelOk ? fc.predictions.reduce((s, p) => s + p.value, 0) : avgDaily * horizon
    const forecastDaily = forecastDemand / horizon
    const upcoming7 = modelOk ? fc.predictions.slice(0, 7).reduce((s, p) => s + p.value, 0) : avgDaily * 7

    const onHand = Number(rec.totalQuantity) || 0
    const available = Math.max(0, getAvailable(rec))
    const committed = committedOpenDemand(data.orders, rec.productId, rec.hubId)
    const incoming = incomingQuantity(data.replenishments, data.receipts, rec.productId, rec.hubId)
    const position = available - committed + incoming
    const lt = leadTimeFor(product, settings)
    const supplier = supplierFor(product, settings)
    const params = settings.productParams?.[product.id] || {}
    const moq = Math.max(0, Number(params.moq ?? 10))
    const pack = Math.max(1, Number(params.packMultiple ?? 5))

    const statistical = activeDays >= 14
    const safetyStock = statistical ? z * sd * Math.sqrt(lt.days) : avgDaily * (Number(settings.safetyDays) || 3)
    const reorderPoint = avgDaily * lt.days + safetyStock
    let targetStock = reorderPoint + avgDaily * (Number(settings.reviewPeriodDays) || 14)
    let capped = false
    if (rec.maximumStock && targetStock > rec.maximumStock) { targetStock = Number(rec.maximumStock); capped = true }

    // Use the same rounded rates that are displayed so coverage can be re-derived from the screen.
    const demandRate = round(forecastDaily) > 0 ? round(forecastDaily) : round(avgDaily)
    const coverageDays = demandRate > 0 ? Math.max(0, available - committed) / demandRate : null
    const stockoutDate = coverageDays === null ? null : today.add(Math.floor(coverageDays), 'day').format('YYYY-MM-DD')
    const safetyDaysEq = demandRate > 0 ? safetyStock / demandRate : 0

    let risk = RISK.LOW
    let reason = 'Stock covers lead time, safety stock and the review period.'
    if (demandRate <= 0) {
      reason = onHand > 0 ? `No ${basis} demand in the last ${lookback} days.` : 'No stock and no recent demand.'
    } else if (available - committed <= 0) {
      risk = RISK.CRITICAL; reason = committed > 0 ? `Open orders (${round(committed)}) already exceed available stock.` : 'Out of stock with ongoing demand.'
    } else if (coverageDays < lt.days) {
      risk = RISK.CRITICAL; reason = `Stock lasts ~${round(coverageDays, 1)} days but resupply takes ${lt.days} days.`
    } else if (coverageDays < lt.days + safetyDaysEq) {
      risk = RISK.HIGH; reason = `Coverage ${round(coverageDays, 1)} days is inside lead time + safety buffer (${round(lt.days + safetyDaysEq, 1)} days).`
    } else if (position <= reorderPoint) {
      risk = RISK.MEDIUM; reason = `Projected position ${round(position)} is at or below the reorder point ${round(reorderPoint)}.`
    }

    const needsOrder = demandRate > 0 && (position <= reorderPoint || risk === RISK.CRITICAL || risk === RISK.HIGH)
    let recommendedQty = 0
    if (needsOrder) {
      const raw = Math.max(0, targetStock - position)
      recommendedQty = raw > 0 ? roundUpTo(Math.max(raw, moq), pack) : 0
    }
    const suggestedReorderDate = !demandRate ? null : position <= reorderPoint ? today.format('YYYY-MM-DD') : today.add(Math.floor((position - reorderPoint) / demandRate), 'day').format('YYYY-MM-DD')

    const flags = []
    if (risk === RISK.CRITICAL || risk === RISK.HIGH) flags.push(F.STOCKOUT)
    const status = getStockStatus(rec)
    if (status === 'Low Stock' || status === 'Out of Stock') flags.push(F.LOW_STOCK)
    if (onHand > 0 && activeDays === 0) flags.push(F.NON_MOVING)
    else if (coverageDays !== null && coverageDays > (Number(settings.slowMovingCoverageDays) || 120)) flags.push(F.SLOW)
    if (coverageDays !== null && coverageDays > (Number(settings.excessCoverageDays) || 60) && onHand > targetStock) flags.push(F.EXCESS)
    const spike = prior > 0 && last7 >= (Number(settings.spikeFactor) || 1.6) * prior && last7 * 7 >= 5
    if (spike) flags.push(F.SPIKE)

    const price = Number(product.sellingPrice) || 0
    const unitCost = Number(product.purchasePrice) || 0
    let impact = null
    if (risk === RISK.CRITICAL || risk === RISK.HIGH) {
      const shortDays = Math.max(0, lt.days - (coverageDays || 0))
      impact = { kind: 'sales_at_risk', value: round(demandRate * shortDays * price), label: 'Sales at risk before resupply' }
    } else if (flags.includes(F.EXCESS) || flags.includes(F.NON_MOVING)) {
      impact = { kind: 'capital_tied', value: round(Math.max(0, onHand - targetStock) * unitCost), label: 'Capital tied up above target' }
    }
    const action = recommendedQty > 0 ? (risk === RISK.CRITICAL ? 'Reorder immediately' : 'Raise a replenishment order')
      : flags.includes(F.NON_MOVING) ? 'Review non-moving stock (promote, transfer or stop buying)'
        : flags.includes(F.EXCESS) ? 'Pause purchasing; consider a transfer' : 'No action needed'

    return {
      id: `${rec.productId}|${rec.hubId}`, stockId: rec.id, productId: rec.productId, hubId: rec.hubId,
      productName: product.name, productCode: product.code, category: product.category, unit: product.unit, hubName: hub.name,
      onHand, reserved: Number(rec.reservedQuantity) || 0, damaged: Number(rec.damagedQuantity) || 0, available, committed, incoming, position: round(position),
      reorderLevel: rec.reorderLevel, maximumStock: rec.maximumStock || null, stockStatus: status,
      basis, lookbackDays: lookback, activeDays,
      history: { ordered: round(series.ordered.reduce((s, v) => s + v, 0)), dispatched: round(series.dispatched.reduce((s, v) => s + v, 0)), delivered: round(series.delivered.reduce((s, v) => s + v, 0)) },
      avgDaily: round(avgDaily), avgWeekly: round(avgDaily * 7), avgMonthly: round(avgDaily * 30), stdDaily: round(sd), cv: avgDaily ? round(sd / avgDaily, 2) : null,
      trendPctWeek: round(trendPctWeek, 1), trend: Math.abs(trendPctWeek) < 3 ? 'Stable' : trendPctWeek > 0 ? 'Increasing' : 'Decreasing',
      weekdayFactors: weekday, last7Avg: round(last7), priorAvg: round(prior),
      forecastModel: modelOk ? fc.modelUsed : 'HIST_AVG', forecastStatus: fc.status, forecastHorizon: horizon,
      forecastDemand: round(forecastDemand), forecastDaily: round(forecastDaily), upcoming7: round(upcoming7),
      coverageDays: coverageDays === null ? null : round(coverageDays, 1), stockoutDate, daysUntilStockout: coverageDays === null ? null : Math.floor(coverageDays),
      leadTimeDays: lt.days, leadTimeSource: lt.source, supplierId: supplier?.id || null, supplierName: supplier?.name || '',
      safetyStock: round(safetyStock), safetyMethod: statistical ? `Statistical (z ${z} × σ × √LT)` : `Fallback (${settings.safetyDays || 3} safety days)`,
      reorderPoint: round(reorderPoint), targetStock: round(targetStock), targetCapped: capped, moq, packMultiple: pack,
      recommendedQty, suggestedReorderDate,
      risk, riskScore: RISK_META[risk].score, flags, reason, action, impact,
      unitCost, price, value: round(onHand * unitCost),
    }
  })

  // High demand: top decile by average daily demand.
  const demands = rows.map((r) => r.avgDaily).filter((v) => v > 0).sort((a, b) => b - a)
  const cut = demands[Math.max(0, Math.floor(demands.length * 0.1) - 1)] || Infinity
  rows.forEach((r) => { if (r.avgDaily > 0 && r.avgDaily >= cut) r.flags.push(F.HIGH_DEMAND) })

  // Imbalance: a hub at risk while another hub holds excess of the same product → transfer suggestion.
  const byProduct = {}
  rows.forEach((r) => { (byProduct[r.productId] ||= []).push(r) })
  Object.values(byProduct).forEach((list) => {
    const donors = list.filter((r) => r.available - r.targetStock > 0 && (r.flags.includes(F.EXCESS) || r.flags.includes(F.SLOW) || r.flags.includes(F.NON_MOVING)))
    list.filter((r) => r.risk === RISK.CRITICAL || r.risk === RISK.HIGH).forEach((r) => {
      const donor = donors.sort((a, b) => (b.available - b.targetStock) - (a.available - a.targetStock))[0]
      if (!donor) return
      const qty = Math.floor(Math.min(donor.available - donor.targetStock, Math.max(r.recommendedQty, r.targetStock - r.position)))
      if (qty <= 0) return
      r.flags.push(F.IMBALANCE)
      if (!donor.flags.includes(F.IMBALANCE)) donor.flags.push(F.IMBALANCE)
      r.transferSuggestion = { fromHubId: donor.hubId, fromHubName: donor.hubName, quantity: qty }
    })
  })

  return { generatedAt: dayjs(now).toISOString(), rows, summary: summarize(rows, horizon) }
}

export const summarize = (rows, horizon = 14) => {
  const byRisk = Object.fromEntries(Object.keys(RISK_META).map((k) => [k, rows.filter((r) => r.risk === k).length]))
  const considered = rows.filter((r) => r.avgDaily > 0 || r.onHand > 0)
  const byHub = {}
  rows.forEach((r) => {
    const h = (byHub[r.hubId] ||= { hubId: r.hubId, hubName: r.hubName, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 })
    h[r.risk] += 1
  })
  const byCategory = {}
  rows.forEach((r) => { byCategory[r.category] = (byCategory[r.category] || 0) + r.value })
  return {
    lines: rows.length,
    totalValue: round(rows.reduce((s, r) => s + r.value, 0)),
    lowStock: rows.filter((r) => r.flags.includes(F.LOW_STOCK)).length,
    predictedStockouts: rows.filter((r) => r.daysUntilStockout !== null && r.daysUntilStockout <= horizon && r.avgDaily > 0).length,
    reorder: rows.filter((r) => r.recommendedQty > 0).length,
    excess: rows.filter((r) => r.flags.includes(F.EXCESS) || r.flags.includes(F.NON_MOVING)).length,
    riskScore: considered.length ? Math.round(mean(considered.map((r) => r.riskScore))) : 0,
    byRisk,
    byHub: Object.values(byHub),
    byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value: round(value) })).sort((a, b) => b.value - a.value),
  }
}
