/**
 * Prototype forecasting engine — classical statistical models that run in the browser.
 * These are transparent formulas, not trained machine-learning models, and every result says so.
 *
 * forecastSeries() → { status, modelUsed, predictions[{key,value,lower,upper}], backtest, metrics, quality, candidates, notes }
 * Metrics come only from a real holdout backtest on the supplied history; nothing is estimated or invented.
 */
import { FORECAST_MODELS as FM, FORECAST_MODEL_META, FORECAST_STATUS, INSUFFICIENT_DATA_MESSAGE, MIN_HISTORY, PROTOTYPE_MODEL_VERSION } from '../../config/aiConfig'
import { futureKeys, mean, round, std } from './timeSeries'

const Z = { 80: 1.2816, 90: 1.6449, 95: 1.96, 99: 2.5758 }
const SEASON = { day: 7, week: 52, month: 12, quarter: 4 }
const WINDOW = { day: null, week: 4, month: 3, quarter: 2 }

const clamp0 = (v) => (v < 0 ? 0 : v)

/* ---------------- models: fit(train) → { forecast(h): number[], residuals: number[], widen(h): factor } ---------------- */

const fitMA = (y, p) => {
  const w = Math.max(1, Math.min(p.window, y.length))
  const residuals = []
  for (let t = w; t < y.length; t += 1) residuals.push(y[t] - mean(y.slice(t - w, t)))
  const level = mean(y.slice(-w))
  return { forecast: (h) => Array(h).fill(level), residuals, widen: () => Math.sqrt(1 + 1 / w), params: { window: w } }
}

const wavg = (arr) => {
  let num = 0
  let den = 0
  arr.forEach((v, i) => { num += v * (i + 1); den += i + 1 })
  return den ? num / den : 0
}
const fitWMA = (y, p) => {
  const w = Math.max(1, Math.min(p.window, y.length))
  const residuals = []
  for (let t = w; t < y.length; t += 1) residuals.push(y[t] - wavg(y.slice(t - w, t)))
  const level = wavg(y.slice(-w))
  return { forecast: (h) => Array(h).fill(level), residuals, widen: () => Math.sqrt(1 + 1 / w), params: { window: w, weights: `1…${w}` } }
}

const fitSES = (y, p) => {
  const a = p.alpha
  let l = y[0]
  const residuals = []
  for (let t = 1; t < y.length; t += 1) { residuals.push(y[t] - l); l = a * y[t] + (1 - a) * l }
  return { forecast: (h) => Array(h).fill(l), residuals, widen: (h) => Math.sqrt(1 + (h - 1) * a * a), params: { alpha: a } }
}

const fitHOLT = (y, p) => {
  const { alpha: a, beta: b } = p
  if (y.length < 3) return null
  let l = y[0]
  let tr = mean(y.slice(1, Math.min(4, y.length)).map((v, i) => v - y[i]))
  const residuals = []
  for (let t = 1; t < y.length; t += 1) {
    residuals.push(y[t] - (l + tr))
    const prev = l
    l = a * y[t] + (1 - a) * (l + tr)
    tr = b * (l - prev) + (1 - b) * tr
  }
  return { forecast: (h) => Array.from({ length: h }, (_, i) => clamp0(l + (i + 1) * tr)), residuals, widen: (h) => Math.sqrt(h), params: { alpha: a, beta: b, trendPerPeriod: round(tr, 3) } }
}

const fitSEASONAL = (y, p) => {
  const m = p.season
  if (!m || y.length < 2 * m) return null
  const overall = mean(y)
  const idx = Array.from({ length: m }, (_, s) => {
    const slot = y.filter((_, t) => t % m === s)
    return overall ? mean(slot) / overall : 1
  })
  const residuals = []
  for (let t = m; t < y.length; t += 1) residuals.push(y[t] - mean(y.slice(t - m, t)) * idx[t % m])
  const level = mean(y.slice(-m))
  const n = y.length
  return { forecast: (h) => Array.from({ length: h }, (_, i) => clamp0(level * idx[(n + i) % m])), residuals, widen: () => 1, params: { seasonLength: m, indices: idx.map((v) => round(v, 3)) } }
}

const FITTERS = { [FM.MA]: fitMA, [FM.WMA]: fitWMA, [FM.SES]: fitSES, [FM.HOLT]: fitHOLT, [FM.SEASONAL]: fitSEASONAL }

const modelParams = (model, granularity, settings) => ({
  window: granularity === 'day' ? Number(settings.maWindow) || 7 : WINDOW[granularity],
  alpha: Number(model === FM.HOLT ? settings.holtAlpha : settings.sesAlpha) || 0.3,
  beta: Number(settings.holtBeta) || 0.1,
  season: SEASON[granularity],
})

const fit = (model, y, granularity, settings) => {
  const f = FITTERS[model]
  return f ? f(y, modelParams(model, granularity, settings)) : null
}

/* ---------------- metrics ---------------- */

/**
 * MAE, RMSE, bias (mean of predicted − actual), MAPE over non-zero actuals only, WAPE.
 * MAPE is undefined for zero actuals, so those periods are excluded and counted; if every actual is
 * zero MAPE is reported as null rather than a made-up number.
 */
export const evaluate = (actual, predicted) => {
  const n = Math.min(actual.length, predicted.length)
  if (!n) return null
  const err = Array.from({ length: n }, (_, i) => predicted[i] - actual[i])
  const abs = err.map(Math.abs)
  const nonZero = actual.slice(0, n).map((a, i) => ({ a, e: abs[i] })).filter((x) => x.a !== 0)
  const sumActual = actual.slice(0, n).reduce((s, a) => s + Math.abs(a), 0)
  const wape = sumActual ? abs.reduce((s, x) => s + x, 0) / sumActual : null
  return {
    points: n,
    mae: mean(abs),
    rmse: Math.sqrt(mean(err.map((e) => e * e))),
    bias: mean(err),
    mape: nonZero.length ? mean(nonZero.map((x) => x.e / Math.abs(x.a))) * 100 : null,
    mapeExcluded: n - nonZero.length,
    wape: wape === null ? null : wape * 100,
    accuracy: wape === null ? null : Math.max(0, 100 - wape * 100),
  }
}

const roundMetrics = (m) => (m ? {
  ...m, mae: round(m.mae), rmse: round(m.rmse), bias: round(m.bias), mape: m.mape === null ? null : round(m.mape, 1), wape: m.wape === null ? null : round(m.wape, 1), accuracy: m.accuracy === null ? null : round(m.accuracy, 1),
} : null)

/* ---------------- data quality ---------------- */

export const dataQuality = (values, granularity, { lastDataAgeDays = 0 } = {}) => {
  const min = MIN_HISTORY[granularity] || MIN_HISTORY.day
  const n = values.length
  const nonZero = values.filter((v) => v > 0).length
  const m = mean(values)
  const cv = m ? std(values) / m : 0
  const parts = [
    { key: 'history', label: 'History length', weight: 35, value: Math.min(1, n / (min.points * 3)), detail: `${n} periods (target ${min.points * 3})` },
    { key: 'completeness', label: 'Periods with activity', weight: 25, value: n ? nonZero / n : 0, detail: `${nonZero} of ${n} non-zero` },
    { key: 'stability', label: 'Stability', weight: 25, value: 1 - Math.min(1, cv / 2), detail: `coefficient of variation ${round(cv, 2)}` },
    { key: 'recency', label: 'Recency', weight: 15, value: lastDataAgeDays <= 2 ? 1 : Math.max(0, 1 - (lastDataAgeDays - 2) / 30), detail: `latest data ${lastDataAgeDays} day(s) old` },
  ]
  const score = Math.round(parts.reduce((s, p) => s + p.weight * p.value, 0))
  return { score, label: score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Poor', parts: parts.map((p) => ({ ...p, value: round(p.value, 2) })) }
}

export const sufficiency = (values, granularity) => {
  const min = MIN_HISTORY[granularity] || MIN_HISTORY.day
  const nonZero = values.filter((v) => v > 0).length
  const ok = values.length >= min.points && nonZero >= min.nonZero
  return { ok, required: min, have: { points: values.length, nonZero } }
}

/* ---------------- backtest + forecast ---------------- */

const backtest = (model, y, granularity, settings, horizon) => {
  const testLen = Math.min(horizon, Math.max(1, Math.floor(y.length * 0.2)))
  const train = y.slice(0, y.length - testLen)
  if (train.length < 4) return null
  const f = fit(model, train, granularity, settings)
  if (!f) return null
  const predicted = f.forecast(testLen)
  const actual = y.slice(-testLen)
  return { trainLength: train.length, actual, predicted, metrics: evaluate(actual, predicted) }
}

/**
 * @param values  numbers, oldest first, already aggregated to `granularity`
 * @param keys    period keys matching values
 */
export const forecastSeries = ({ values, keys, granularity = 'day', horizonPeriods = 7, model = FM.AUTO, settings = {}, confidenceLevel = 95, lastDataAgeDays = 0 }) => {
  const notes = []
  const quality = dataQuality(values, granularity, { lastDataAgeDays })
  const enough = sufficiency(values, granularity)
  const base = { engine: 'PROTOTYPE', modelVersion: PROTOTYPE_MODEL_VERSION, quality, sufficiency: enough, history: { keys, values } }
  if (!enough.ok) {
    return { ...base, status: FORECAST_STATUS.INSUFFICIENT_DATA, message: INSUFFICIENT_DATA_MESSAGE, modelUsed: model, predictions: [], backtest: null, metrics: null, candidates: [], notes: [`Needs at least ${enough.required.points} ${granularity} periods with ${enough.required.nonZero} non-zero; have ${enough.have.points} with ${enough.have.nonZero}.`] }
  }

  const options = model === FM.AUTO ? [FM.MA, FM.WMA, FM.SES, FM.HOLT, FM.SEASONAL] : [model]
  const candidates = options.map((m) => {
    const bt = backtest(m, values, granularity, settings, horizonPeriods)
    return { model: m, label: FORECAST_MODEL_META[m].label, available: Boolean(bt), backtest: bt, rmse: bt ? round(bt.metrics.rmse) : null, mae: bt ? round(bt.metrics.mae) : null }
  })
  const usable = candidates.filter((c) => c.available)
  let chosen = model
  if (model === FM.AUTO) {
    if (!usable.length) chosen = FM.SES
    else chosen = [...usable].sort((a, b) => a.rmse - b.rmse)[0].model
    notes.push(`Auto selected ${FORECAST_MODEL_META[chosen].label} — lowest RMSE on the holdout window.`)
  }
  const fitted = fit(chosen, values, granularity, settings)
  if (!fitted) {
    return { ...base, status: FORECAST_STATUS.INSUFFICIENT_DATA, message: INSUFFICIENT_DATA_MESSAGE, modelUsed: chosen, predictions: [], backtest: null, metrics: null, candidates, notes: [`${FORECAST_MODEL_META[chosen].label} needs at least two full seasons of history.`] }
  }
  const bt = candidates.find((c) => c.model === chosen)?.backtest || null
  const raw = fitted.forecast(horizonPeriods)
  const resid = fitted.residuals.length >= 3 ? fitted.residuals : bt ? bt.predicted.map((p, i) => bt.actual[i] - p) : []
  const sigma = resid.length >= 2 ? std(resid) : null
  const z = Z[confidenceLevel] || Z[95]
  const fkeys = futureKeys(keys[keys.length - 1], granularity, horizonPeriods)
  const predictions = raw.map((v, i) => {
    const w = sigma === null ? null : z * sigma * fitted.widen(i + 1)
    return { key: fkeys[i], value: round(clamp0(v)), lower: w === null ? null : round(clamp0(v - w)), upper: w === null ? null : round(v + w) }
  })
  if (sigma === null) notes.push('Not enough residuals to estimate a confidence interval.')
  if (bt && bt.metrics.mapeExcluded) notes.push(`MAPE excludes ${bt.metrics.mapeExcluded} holdout period(s) where the actual value was zero.`)
  if (bt && bt.metrics.mape === null) notes.push('MAPE is not defined because every holdout actual was zero.')
  return {
    ...base,
    status: FORECAST_STATUS.COMPLETED,
    modelUsed: chosen,
    params: fitted.params,
    predictions,
    sigma: sigma === null ? null : round(sigma),
    confidenceLevel,
    backtest: bt ? { keys: keys.slice(-bt.actual.length), actual: bt.actual.map((v) => round(v)), predicted: bt.predicted.map((v) => round(v)), trainLength: bt.trainLength } : null,
    metrics: bt ? roundMetrics(bt.metrics) : null,
    candidates: candidates.map(({ backtest: _b, ...c }) => c),
    notes,
  }
}

/** Compare a stored forecast with actuals that arrived after it was generated. */
export const actualVsPredicted = (predictions, actualByKey) => {
  const rows = predictions.filter((p) => actualByKey[p.key] !== undefined).map((p) => ({ key: p.key, predicted: p.value, actual: actualByKey[p.key], lower: p.lower, upper: p.upper }))
  return { rows, metrics: rows.length ? roundMetrics(evaluate(rows.map((r) => r.actual), rows.map((r) => r.predicted))) : null }
}
