/**
 * Enterprise record engine — one implementation of CRUD, approval workflow, history, audit and data scope for every
 * enterprise module (CRM, procurement, warehouse tasks, QA, fleet, finance, HR…). Module behaviour is declared in
 * config/enterprise/modules/*.js; side effects that touch other ledgers (stock, invoices, orders) live in the module's
 * action `effect` and call the owning service (inventoryService, batchService, financeService…), never raw storage.
 *
 * Every write: permission check (service layer, not only the UI) → validation → numbering → history entry → audit log.
 * Prototype: runs in the browser on LocalStorage; a Django REST API would expose the same operations per module.
 */
import dayjs from 'dayjs'
import storage from '../storageService'
import { getCurrentUser } from '../authService'
import { can } from '../../config/permissions'
import { scopeOf } from '../rbacService'
import { logAudit } from '../auditService'
import { pushNotification } from '../notificationService'
import { STORAGE_KEYS } from '../../utils/constants'
import { uid } from '../../utils/helpers'

const REGISTRY = new Map()
export const registerModules = (defs) => defs.forEach((d) => REGISTRY.set(d.id, d))
export const getModuleDef = (id) => REGISTRY.get(id) || null
export const allModuleDefs = () => [...REGISTRY.values()]
export const moduleForPath = (pathname) => {
  let best = null
  REGISTRY.forEach((d) => { if (pathname === d.basePath || pathname.startsWith(`${d.basePath}/`)) { if (!best || d.basePath.length > best.basePath.length) best = d } })
  return best
}

export const read = (key) => storage.getItem(key, []) || []
const write = (key, list) => storage.setItem(key, list)

const ok = (data = {}) => ({ ok: true, ...data })
const fail = (error, errors) => ({ ok: false, error, errors: errors || { form: error } })

/* ---------- Numbering: PREFIX-YYYY-NNNNN, continuing from the highest number used this year ---------- */
export const nextDocNumber = (prefix, list, field = 'number', width = 5) => {
  const year = dayjs().year()
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  const max = (list || []).reduce((m, r) => { const x = String(r?.[field] || '').match(re); return x ? Math.max(m, Number(x[1])) : m }, 0)
  return `${prefix}-${year}-${String(max + 1).padStart(width, '0')}`
}

/* ---------- Users & data scope ---------- */
export const actorOf = (user = getCurrentUser()) => ({ id: user?.id || 'system', name: user?.name || 'System' })
const driverIdOf = (user) => (storage.getItem(STORAGE_KEYS.DRIVERS, []) || []).find((d) => d.userId === user?.id)?.id || null

/** Scope of a user against a module: 'all', or a filter predicate. Customer / supplier / driver users only ever see linked records. */
export const scopeFilter = (def, user) => {
  if (!user) return () => false
  const s = scopeOf(user)
  const sc = def.scope || {}
  const own = (r) => (sc.own || []).some((f) => r[f] === user.id) || r.createdBy === user.id
  if (s === 'CUSTOMER') return sc.customer ? (r) => Boolean(user.customerId) && r[sc.customer] === user.customerId : () => false
  if (s === 'SUPPLIER') return sc.supplier ? (r) => Boolean(user.supplierId) && r[sc.supplier] === user.supplierId : () => false
  if (s === 'DRIVER') {
    const did = driverIdOf(user)
    return (r) => (sc.driver && did && r[sc.driver] === did) || own(r)
  }
  if (s === 'SALESMAN') return sc.own || sc.salesman ? own : () => true
  if (s === 'DISPATCHER' && sc.hub && user.hubId) return (r) => !r[sc.hub] || r[sc.hub] === user.hubId
  return () => true
}

export const canDo = (def, op, user = getCurrentUser()) => {
  const key = def.permissions?.[op]
  if (!key) return op === 'view' ? true : false
  return (Array.isArray(key) ? key : [key]).some((k) => can(user, k))
}

export const listRecords = (moduleId, user = getCurrentUser()) => {
  const def = getModuleDef(moduleId)
  if (!def || !canDo(def, 'view', user)) return []
  const f = scopeFilter(def, user)
  return read(def.key).filter(f)
}


/* ---------- Validation ---------- */
const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && !v.length)

export const validateValues = (def, values, ctx) => {
  const errors = {}
  for (const f of def.fields || []) {
    if (f.readOnly || f.computed) continue
    if (typeof f.hideIf === 'function' && f.hideIf(values)) continue
    const v = values[f.key]
    if (f.required && isEmpty(v)) { errors[f.key] = `${f.label} is required.`; continue }
    if (isEmpty(v)) continue
    if (['number', 'money', 'percent', 'integer'].includes(f.type)) {
      const n = Number(v)
      if (!Number.isFinite(n)) errors[f.key] = `${f.label} must be a number.`
      else if (f.min !== undefined && n < f.min) errors[f.key] = `${f.label} must be at least ${f.min}.`
      else if (f.max !== undefined && n > f.max) errors[f.key] = `${f.label} must be at most ${f.max}.`
      else if (f.type === 'integer' && !Number.isInteger(n)) errors[f.key] = `${f.label} must be a whole number.`
      else if (f.type === 'percent' && (n < 0 || n > 100)) errors[f.key] = `${f.label} must be between 0 and 100.`
    }
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) errors[f.key] = 'Enter a valid email address.'
    if ((f.type === 'date' || f.type === 'datetime') && !dayjs(v).isValid()) errors[f.key] = 'Enter a valid date.'
    if (f.type === 'select' && f.options && !f.options.some((o) => (o.value ?? o) === v)) errors[f.key] = `Choose a valid ${f.label.toLowerCase()}.`
    if (f.type === 'lines') {
      const lines = Array.isArray(v) ? v : []
      lines.forEach((ln, i) => {
        for (const c of f.columns || []) {
          const cv = ln[c.key]
          if (c.required && isEmpty(cv)) errors[`${f.key}.${i}.${c.key}`] = `Line ${i + 1}: ${c.label} is required.`
          if (['number', 'money', 'integer'].includes(c.type) && !isEmpty(cv)) {
            const n = Number(cv)
            if (!Number.isFinite(n) || n < (c.min ?? 0)) errors[`${f.key}.${i}.${c.key}`] = `Line ${i + 1}: ${c.label} must be ${c.min ?? 0} or more.`
          }
        }
      })
      if (f.required && !lines.length) errors[f.key] = `Add at least one line.`
    }
  }
  if (def.validate) Object.assign(errors, def.validate(values, ctx) || {})
  return errors
}

const coerce = (def, values) => {
  const out = { ...values }
  for (const f of def.fields || []) {
    if (!(f.key in out)) continue
    if (['number', 'money', 'percent', 'integer'].includes(f.type)) out[f.key] = isEmpty(out[f.key]) ? null : Number(out[f.key])
    if (f.type === 'boolean') out[f.key] = Boolean(out[f.key])
    if (f.type === 'lines') out[f.key] = (out[f.key] || []).map((ln) => {
      const l = { ...ln }
      ;(f.columns || []).forEach((c) => { if (['number', 'money', 'integer', 'percent'].includes(c.type)) l[c.key] = isEmpty(l[c.key]) ? 0 : Number(l[c.key]) })
      return l
    })
  }
  return out
}

/* ---------- Create / update ---------- */
const historyEntry = (user, action, from, to, note = '') => ({ at: new Date().toISOString(), by: actorOf(user).id, byName: actorOf(user).name, action, from, to, note })

/**
 * `system: true` is only used by services that create follow-up records as part of an action the user was already
 * authorised for (e.g. a posted goods receipt opening its QA inspection and put-away tasks).
 */
export const createRecord = (moduleId, values, user = getCurrentUser(), { silent = false, system = false } = {}) => {
  const def = getModuleDef(moduleId)
  if (!def) return fail('Unknown module.')
  if (!system && !canDo(def, 'create', user)) return fail(`You do not have permission to create ${def.plural.toLowerCase()}.`)
  const list = read(def.key)
  const ctx = { user, list, mode: 'create' }
  const input = coerce(def, values)
  const errors = validateValues(def, input, ctx)
  if (Object.keys(errors).length) return fail(Object.values(errors)[0], errors)
  const now = new Date().toISOString()
  const actor = actorOf(user)
  let record = {
    id: uid(def.idPrefix || def.id.slice(0, 3)),
    ...(def.numberPrefix ? { number: nextDocNumber(def.numberPrefix, list) } : {}),
    ...(def.defaults ? def.defaults(input, ctx) : {}),
    ...input,
    status: input.status && def.statuses?.[input.status] && def.allowInitialStatus ? input.status : def.initialStatus || 'ACTIVE',
    createdAt: now, createdBy: actor.id, createdByName: actor.name, updatedAt: now, updatedBy: actor.id,
    history: [historyEntry(user, 'Created', null, def.initialStatus || 'ACTIVE')],
  }
  if (def.compute) record = { ...record, ...def.compute(record, ctx) }
  if (def.beforeCreate) {
    const r = def.beforeCreate(record, ctx)
    if (r && r.ok === false) return r
    if (r && r.record) record = r.record
  }
  const res = write(def.key, [record, ...list])
  if (res && res.ok === false) return fail(res.error || 'Could not save — browser storage is full or unavailable.')
  if (!silent) logAudit({ action: 'CREATE', module: def.auditModule || 'project', entity: def.label, recordId: record.id, recordLabel: record.number || record.title || record.name || record.id, description: `${def.label} ${record.number || record.title || record.name || ''} created.` })
  def.afterCreate?.(record, ctx)
  return ok({ record })
}

export const isEditable = (def, rec) => !def.editableIn || def.editableIn.includes(rec.status)

export const updateRecord = (moduleId, id, values, user = getCurrentUser()) => {
  const def = getModuleDef(moduleId)
  if (!def) return fail('Unknown module.')
  if (!canDo(def, 'edit', user) && !canDo(def, 'create', user)) return fail(`You do not have permission to edit ${def.plural.toLowerCase()}.`)
  const list = read(def.key)
  const current = list.find((r) => r.id === id)
  if (!current || !scopeFilter(def, user)(current)) return fail(`${def.label} not found.`)
  if (!isEditable(def, current)) return fail(`${def.label} ${current.number || ''} is ${def.statuses?.[current.status]?.label || current.status} and cannot be edited. Reopen it first if your role allows.`)
  if (def.ownerEditOnly && !canDo(def, 'edit', user) && current.createdBy !== user?.id) return fail('You can only edit your own records.')
  const ctx = { user, list, mode: 'edit', existing: current }
  const input = coerce(def, values)
  const merged = { ...current, ...input }
  const errors = validateValues(def, merged, ctx)
  if (Object.keys(errors).length) return fail(Object.values(errors)[0], errors)
  let next = { ...merged, id: current.id, number: current.number, status: current.status, createdAt: current.createdAt, createdBy: current.createdBy, updatedAt: new Date().toISOString(), updatedBy: actorOf(user).id }
  if (def.compute) next = { ...next, ...def.compute(next, ctx) }
  next.history = [...(current.history || []), historyEntry(user, 'Edited', current.status, current.status)]
  const res = write(def.key, list.map((r) => (r.id === id ? next : r)))
  if (res && res.ok === false) return fail(res.error || 'Could not save.')
  logAudit({ action: 'EDIT', module: def.auditModule || 'project', entity: def.label, recordId: id, recordLabel: next.number || next.title || next.name || id, description: `${def.label} ${next.number || next.title || next.name || ''} updated.` })
  return ok({ record: next })
}

/* ---------- Workflow actions ---------- */
export const availableActions = (def, rec, user = getCurrentUser()) => (def.actions || []).filter((a) => {
  if (a.from && !a.from.includes(rec.status)) return false
  if (a.when && !a.when(rec, { user })) return false
  const perms = Array.isArray(a.permission) ? a.permission : [a.permission]
  return !a.permission || perms.some((p) => can(user, p))
})

/**
 * Run a workflow action. Self-approval is refused where the action says noSelf; required notes are enforced;
 * the action's effect may update other ledgers through their own services and returns a patch for this record.
 */
export const runAction = (moduleId, id, actionId, input = {}, user = getCurrentUser()) => {
  const def = getModuleDef(moduleId)
  if (!def) return fail('Unknown module.')
  const action = (def.actions || []).find((a) => a.id === actionId)
  if (!action) return fail('Unknown action.')
  const list = read(def.key)
  const rec = list.find((r) => r.id === id)
  if (!rec || !scopeFilter(def, user)(rec)) return fail(`${def.label} not found.`)
  const perms = Array.isArray(action.permission) ? action.permission : [action.permission]
  if (action.permission && !perms.some((p) => can(user, p))) return fail(`You do not have permission to ${action.label.toLowerCase()}.`)
  if (action.from && !action.from.includes(rec.status)) return fail(`${def.label} ${rec.number || ''} is ${def.statuses?.[rec.status]?.label || rec.status} — "${action.label}" is not allowed now.`)
  if (action.noSelf && rec.createdBy === user?.id && !can(user, 'settings.manage')) return fail(`You cannot ${action.label.toLowerCase()} your own ${def.label.toLowerCase()} — another authorised user must do it.`)
  const note = String(input.note || '').trim()
  if (action.note === 'required' && note.length < 3) return fail('Enter a reason / note (at least 3 characters).', { note: 'Enter a reason / note.' })
  let patch = {}
  if (action.effect) {
    try {
      const r = action.effect(rec, { user, input, list, def })
      if (r && r.ok === false) return r
      patch = r?.patch || r || {}
    } catch (e) {
      return fail(e.message || 'The action could not be completed.')
    }
  }
  const latest = read(def.key)
  const base = latest.find((r) => r.id === id) || rec
  const to = patch.status || action.to || base.status
  let next = { ...base, ...patch, status: to, updatedAt: new Date().toISOString(), updatedBy: actorOf(user).id }
  if (def.compute) next = { ...next, ...def.compute(next, { user }) }
  next.history = [...(base.history || []), historyEntry(user, action.label, base.status, to, note)]
  const res = write(def.key, latest.map((r) => (r.id === id ? next : r)))
  if (res && res.ok === false) return fail(res.error || 'Could not save.')
  logAudit({ action: action.audit || (/approv|releas|confirm|post/i.test(action.label) ? 'APPROVAL' : /reject|cancel|fail|void/i.test(action.label) ? 'REJECTION' : 'STATUS_CHANGE'), module: def.auditModule || 'project', entity: def.label, recordId: id, recordLabel: next.number || next.title || next.name || id, description: `${def.label} ${next.number || ''}: ${action.label}${note ? ` — ${note}` : ''} (${def.statuses?.[base.status]?.label || base.status} → ${def.statuses?.[to]?.label || to}).` })
  if (action.notify) {
    const n = action.notify(next)
    if (n) pushNotification({ type: 'info', ...n })
  }
  return ok({ record: next })
}


/** Patch a record from another service (e.g. linking a GRN to its PO) — keeps history. */
export const patchRecord = (moduleId, id, patch, { user = getCurrentUser(), action = 'Updated', note = '' } = {}) => {
  const def = getModuleDef(moduleId)
  const list = read(def.key)
  const rec = list.find((r) => r.id === id)
  if (!rec) return fail('Not found.')
  const to = patch.status || rec.status
  let next = { ...rec, ...patch, updatedAt: new Date().toISOString(), updatedBy: actorOf(user).id }
  if (def.compute) next = { ...next, ...def.compute(next, { user }) }
  next.history = [...(rec.history || []), historyEntry(user, action, rec.status, to, note)]
  write(def.key, list.map((r) => (r.id === id ? next : r)))
  return ok({ record: next })
}

