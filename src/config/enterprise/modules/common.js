/** Shared building blocks for enterprise module definitions. */
import dayjs from 'dayjs'
import { formatMoney } from '../../../utils/formatters'

export const S = (label, tone = 'neutral') => ({ label, tone })
export const today = () => dayjs().format('YYYY-MM-DD')
export const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100
export const sum = (list, fn) => r2((list || []).reduce((s, x) => s + (Number(fn(x)) || 0), 0))
export const count = (list, fn) => (list || []).filter(fn).length
export const money = (v) => formatMoney(v || 0)

export const productCol = (extra = {}) => ({ key: 'productId', label: 'Product', type: 'lookup', lookup: 'products', required: true, span: 4, ...extra })
export const qtyCol = (key = 'quantity', label = 'Quantity', extra = {}) => ({ key, label, type: 'number', required: true, min: 0, span: 2, ...extra })
export const amountCol = (qty = 'quantity', price = 'unitPrice') => ({ key: 'amount', label: 'Amount', type: 'money', span: 2, computed: (ln) => r2((Number(ln[qty]) || 0) * (Number(ln[price]) || 0)) })
export const linesTotal = (lines, qty = 'quantity', price = 'unitPrice') => sum(lines, (l) => (Number(l[qty]) || 0) * (Number(l[price]) || 0))

/** Standard KPI tiles: one per listed status, clickable to filter the list. */
export const statusKpis = (records, def, statuses, icon) => statuses.map((s) => ({ label: def.statuses[s].label, value: count(records, (r) => r.status === s), filter: { status: s }, tone: def.statuses[s].tone === 'danger' ? 'danger' : def.statuses[s].tone === 'warning' ? 'warning' : def.statuses[s].tone === 'success' ? 'success' : 'brand', icon }))

export const ownerDefault = ({ user }) => ({ ownerId: user?.id })
export const PRIORITIES = ['Low', 'Normal', 'High', 'Critical']
