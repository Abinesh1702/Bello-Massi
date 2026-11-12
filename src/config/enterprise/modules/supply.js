/**
 * Van sales, procurement (PR → RFQ → quotes → PO → GRN → supplier invoice → payment) and import / export shipments.
 */
import dayjs from 'dayjs'
import { ShoppingCart, Ship, Truck, FileCheck2 } from 'lucide-react'
import { S, today, sum, count, money, productCol, qtyCol, amountCol, linesTotal, statusKpis, r2, PRIORITIES } from './common'
import { createRecord, patchRecord, read } from '../../../services/enterprise/recordService'
import { recordFor } from '../../../services/enterprise/lookupService'
import { loadVan, settleVan, validateVanAssignment, vanStock } from '../../../services/enterprise/vanSalesService'
import { createPoFromQuote, createPoFromRequisition, postGoodsReceipt, poRemaining, threeWayMatch, validateGrnLines } from '../../../services/enterprise/procurementService'
import { supplierInvoiceBalance, vatOn } from '../../../services/enterprise/financeService'
import { STORAGE_KEYS as K } from '../../../utils/constants'

/* ---------------- Van sales ---------------- */
export const vanAssignments = {
  id: 'van_assignments', key: K.VAN_ASSIGNMENTS, label: 'Van route', plural: 'Van routes', numberPrefix: 'VAN', idPrefix: 'van', basePath: '/van-sales/routes', auditModule: 'vansales',
  description: 'Daily van load per sales executive: load from the hub, sell on the route, return unsold stock and settle cash.',
  permissions: { view: 'vansales.view', create: 'vansales.manage', edit: 'vansales.manage' },
  scope: { own: ['salesExecId'] },
  statuses: { PLANNED: S('Planned', 'info'), LOADED: S('Loaded', 'brand'), ON_ROUTE: S('On route', 'accent'), SETTLED: S('Settled', 'success'), CANCELLED: S('Cancelled', 'neutral') },
  initialStatus: 'PLANNED', editableIn: ['PLANNED'], titleField: 'routeName',
  initialValues: () => ({ routeDate: today(), hubId: 'hub-che', lines: [] }),
  fields: [
    { key: 'routeName', label: 'Route', type: 'text', required: true },
    { key: 'routeDate', label: 'Date', type: 'date', required: true },
    { key: 'hubId', label: 'Load from hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'vehicleId', label: 'Van', type: 'lookup', lookup: 'vehicles', required: true, filter: (v, vals) => !vals.hubId || v.hubId === vals.hubId },
    { key: 'salesExecId', label: 'Van sales executive', type: 'lookup', lookup: 'users', required: true },
    { key: 'lines', label: 'Van load', type: 'lines', required: true, columns: [productCol({ filter: (p) => p.status === 'Active' }), qtyCol('loadedQty', 'Load qty')] },
  ],
  validate: (v, ctx) => validateVanAssignment(v, ctx.list, ctx.existing?.id),
  listColumns: ['routeName', 'routeDate', 'salesExecId', 'vehicleId', 'hubId'], filters: ['salesExecId', 'hubId'],
  kpis: (rs) => [...statusKpis(rs, vanAssignments, ['PLANNED', 'ON_ROUTE', 'SETTLED'], Truck), { label: 'Van sales value', value: money(sum(read(K.VAN_SALES).filter((s) => s.status === 'COMPLETED'), (s) => s.total)) }],
  summary: (r) => { const st = vanStock(r); return [{ label: 'Loaded', value: sum(st, (x) => x.loaded) }, { label: 'Sold', value: sum(st, (x) => x.sold) }, { label: 'On van', value: sum(st, (x) => x.onVan) }, { label: 'Sales', value: count(read(K.VAN_SALES), (s) => s.assignmentId === r.id && s.status === 'COMPLETED') }] },
  actions: [
    { id: 'load', label: 'Load van', from: ['PLANNED'], to: 'LOADED', permission: ['vansales.manage', 'warehouse.loading.manage'], description: 'Moves the load quantities out of hub stock (Van Stock Load movements, FEFO lots).', effect: (r) => loadVan(r) },
    { id: 'start', label: 'Start route', from: ['LOADED'], to: 'ON_ROUTE', permission: ['vansales.manage', 'vansales.app'] },
    { id: 'settle', label: 'Settle', from: ['ON_ROUTE', 'LOADED'], to: 'SETTLED', permission: ['vansales.manage', 'vansales.app'], inputs: [{ key: 'cashDeposited', label: 'Cash deposited', type: 'money', required: true }], description: 'Unsold stock is returned to the hub and a settlement is created for approval.', effect: (r, { input, user }) => { if (input.values?.cashDeposited === undefined || input.values?.cashDeposited === '') return { ok: false, error: 'Enter the cash deposited (0 if none).' }; return settleVan(r, input.values, user) } },
    { id: 'cancel', label: 'Cancel', from: ['PLANNED'], to: 'CANCELLED', permission: 'vansales.manage', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [r.settlementId && { label: `Settlement ${r.settlementNumber}`, to: `/van-sales/settlements/${r.settlementId}` }, { label: 'Van sales on this route', to: `/van-sales/sales?assignmentId=${r.id}` }],
  detailTables: (r) => [{ title: 'Van stock', subtitle: 'Loaded − sold (from van sales); unsold stock returns to the hub at settlement.', columns: [{ key: 'productId', header: 'Product', render: (x) => recordFor('products', x.productId)?.name }, { key: 'loaded', header: 'Loaded', align: 'right' }, { key: 'sold', header: 'Sold', align: 'right' }, { key: 'onVan', header: 'On van', align: 'right' }], rows: vanStock(r) }],
}

export const vanSales = {
  id: 'van_sales', key: K.VAN_SALES, label: 'Van sale', plural: 'Van sales', numberPrefix: 'VS', idPrefix: 'vs', basePath: '/van-sales/sales', auditModule: 'vansales',
  description: 'Sales made from van stock on the route. Quantities are limited to what is on the van; cash sales are reconciled at settlement.',
  permissions: { view: 'vansales.view', create: ['vansales.app', 'vansales.manage'], edit: 'vansales.manage' },
  scope: { own: ['salesExecId'] }, filters: ['assignmentId', 'paymentMode'],
  statuses: { COMPLETED: S('Completed', 'success'), VOIDED: S('Voided', 'danger') }, initialStatus: 'COMPLETED', editableIn: [],
  initialValues: ({ user, params }) => ({ salesExecId: user?.id, assignmentId: params?.get('assignmentId') || read(K.VAN_ASSIGNMENTS).find((a) => a.salesExecId === user?.id && a.status === 'ON_ROUTE')?.id || '', paymentMode: 'Cash', lines: [] }),
  fields: [
    { key: 'assignmentId', label: 'Van route', type: 'lookup', lookup: 'module:van_assignments', required: true, filter: (a) => a.status === 'ON_ROUTE' },
    { key: 'customerId', label: 'Customer', type: 'lookup', lookup: 'customers', required: true },
    { key: 'paymentMode', label: 'Payment', type: 'select', options: ['Cash', 'Credit', 'Card'], required: true },
    { key: 'salesExecId', label: 'Sales executive', type: 'lookup', lookup: 'users', readOnly: true },
    { key: 'lines', label: 'Items', type: 'lines', required: true, columns: [productCol({ fill: (p) => ({ unitPrice: p.sellingPrice }) }), qtyCol(), { key: 'unitPrice', label: 'Price', type: 'money', span: 2 }, amountCol()] },
  ],
  compute: (r) => { const subtotal = linesTotal(r.lines); const vat = vatOn(subtotal); return { subtotal, vatAmount: vat, total: r2(subtotal + vat) } },
  computedSummary: ['subtotal', 'vatAmount', 'total'],
  validate: (v) => {
    const e = {}
    const a = read(K.VAN_ASSIGNMENTS).find((x) => x.id === v.assignmentId)
    if (!a) return e
    if (a.status !== 'ON_ROUTE') e.assignmentId = 'Sales can only be made on a route that has started.'
    const c = recordFor('customers', v.customerId)
    if (c && c.status !== 'Active') e.customerId = `${c.name} is ${String(c.status).toLowerCase()}.`
    if (c && v.paymentMode === 'Credit' && (c.creditHold || !c.creditEnabled)) e.paymentMode = `${c.name} cannot buy on credit${c.creditHold ? ' (credit hold)' : ''}.`
    const st = Object.fromEntries(vanStock(a).map((x) => [x.productId, x.onVan]))
    const want = {}
    ;(v.lines || []).forEach((l, i) => {
      want[l.productId] = (want[l.productId] || 0) + (Number(l.quantity) || 0)
      if (!(l.productId in st)) e[`lines.${i}.productId`] = 'Not loaded on this van.'
      else if (want[l.productId] > st[l.productId] + 1e-9) e[`lines.${i}.quantity`] = `Only ${st[l.productId]} on the van.`
    })
    return e
  },
  listColumns: ['assignmentId', 'customerId', 'paymentMode', 'total', 'salesExecId'],
  kpis: (rs) => [{ label: 'Sales today', value: count(rs, (r) => r.createdAt?.slice(0, 10) === today() && r.status === 'COMPLETED') }, { label: 'Value today', value: money(sum(rs.filter((r) => r.createdAt?.slice(0, 10) === today() && r.status === 'COMPLETED'), (r) => r.total)) }, { label: 'Cash sales', value: money(sum(rs.filter((r) => r.paymentMode === 'Cash' && r.status === 'COMPLETED'), (r) => r.total)) }, { label: 'Voided', value: count(rs, (r) => r.status === 'VOIDED'), filter: { status: 'VOIDED' } }],
  actions: [{ id: 'void', label: 'Void sale', from: ['COMPLETED'], to: 'VOIDED', permission: 'vansales.manage', note: 'required', tone: 'danger', when: (r) => read(K.VAN_ASSIGNMENTS).find((a) => a.id === r.assignmentId)?.status === 'ON_ROUTE' }],
}

export const vanSettlements = {
  id: 'van_settlements', key: K.VAN_SETTLEMENTS, label: 'Van settlement', plural: 'Van settlements', numberPrefix: 'VST', idPrefix: 'vst', basePath: '/van-sales/settlements', auditModule: 'vansales',
  description: 'End-of-route settlements: sales, expected cash from cash sales, cash deposited and variance. Approved by the Van Sales Manager.',
  permissions: { view: 'vansales.view', create: 'vansales.settle.approve' }, noCreate: true,
  scope: { own: ['salesExecId'] },
  statuses: { SUBMITTED: S('Submitted', 'warning'), APPROVED: S('Approved', 'success'), DISPUTED: S('Disputed', 'danger') }, initialStatus: 'SUBMITTED', editableIn: [],
  fields: [
    { key: 'assignmentId', label: 'Van route', type: 'lookup', lookup: 'module:van_assignments' },
    { key: 'salesExecId', label: 'Sales executive', type: 'lookup', lookup: 'users' },
    { key: 'routeDate', label: 'Route date', type: 'date' },
    { key: 'salesCount', label: 'Sales', type: 'integer' },
    { key: 'salesValue', label: 'Sales value', type: 'money' },
    { key: 'expectedCash', label: 'Expected cash', type: 'money' },
    { key: 'cashDeposited', label: 'Cash deposited', type: 'money' },
    { key: 'variance', label: 'Variance', type: 'money' },
  ],
  listColumns: ['assignmentId', 'salesExecId', 'routeDate', 'salesValue', 'expectedCash', 'cashDeposited', 'variance'],
  kpis: (rs) => [...statusKpis(rs, vanSettlements, ['SUBMITTED', 'DISPUTED']), { label: 'Net cash variance', value: money(sum(rs, (r) => r.variance)), tone: sum(rs, (r) => r.variance) < 0 ? 'danger' : 'success' }],
  actions: [
    { id: 'approve', label: 'Approve', from: ['SUBMITTED', 'DISPUTED'], to: 'APPROVED', permission: 'vansales.settle.approve', noSelf: true, when: () => true, effect: (r, { input }) => (Math.abs(r.variance) > 0.009 && String(input.note || '').trim().length < 3 ? { ok: false, error: 'There is a cash variance — enter a note explaining why it is accepted.' } : {}) },
    { id: 'dispute', label: 'Dispute', from: ['SUBMITTED'], to: 'DISPUTED', permission: 'vansales.settle.approve', note: 'required', tone: 'danger' },
  ],
  related: (r) => [{ label: 'Van route', to: `/van-sales/routes/${r.assignmentId}` }],
}

/* ---------------- Procurement ---------------- */
const PR_STATUSES = { DRAFT: S('Draft', 'neutral'), SUBMITTED: S('Pending approval', 'warning'), APPROVED: S('Approved', 'info'), REJECTED: S('Rejected', 'danger'), RFQ_ISSUED: S('RFQ issued', 'brand'), PO_CREATED: S('PO created', 'success'), CANCELLED: S('Cancelled', 'neutral') }
export const requisitions = {
  id: 'purchase_requisitions', key: K.PURCHASE_REQUISITIONS, label: 'Purchase requisition', plural: 'Purchase requisitions', numberPrefix: 'PR', idPrefix: 'pr', basePath: '/procurement/requisitions', auditModule: 'purchasing',
  description: 'Internal requests to buy. Approved requisitions become an RFQ (competitive quotes) or a purchase order directly.',
  permissions: { view: 'procurement.requisitions.view', create: 'procurement.requisitions.create', edit: 'procurement.requisitions.create' },
  scope: { own: ['requestedBy'] }, ownerEditOnly: true,
  statuses: PR_STATUSES, initialStatus: 'DRAFT', editableIn: ['DRAFT', 'REJECTED'],
  initialValues: ({ user }) => ({ requestedBy: user?.id, hubId: user?.hubId || 'hub-che', priority: 'Normal', requiredBy: dayjs().add(10, 'day').format('YYYY-MM-DD'), lines: [] }),
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, wide: true },
    { key: 'hubId', label: 'Deliver to hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'requiredBy', label: 'Required by', type: 'date', required: true },
    { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES, required: true },
    { key: 'requestedBy', label: 'Requested by', type: 'lookup', lookup: 'users', readOnly: true },
    { key: 'justification', label: 'Justification', type: 'textarea', required: true },
    { key: 'lines', label: 'Items', type: 'lines', required: true, columns: [productCol({ filter: (p) => p.status === 'Active', fill: (p) => ({ estimatedPrice: p.purchasePrice }) }), qtyCol(), { key: 'estimatedPrice', label: 'Est. price', type: 'money', span: 2 }, amountCol('quantity', 'estimatedPrice')] },
  ],
  compute: (r) => ({ total: linesTotal(r.lines, 'quantity', 'estimatedPrice') }), computedSummary: ['total'],
  validate: (v) => ((v.lines || []).some((l) => !(Number(l.quantity) > 0)) ? { lines: 'Every line needs a quantity above zero.' } : {}),
  listColumns: ['title', 'hubId', 'requiredBy', 'priority', 'total', 'requestedBy'], filters: ['hubId', 'priority'],
  kpis: (rs) => [...statusKpis(rs, requisitions, ['SUBMITTED', 'APPROVED', 'RFQ_ISSUED'], ShoppingCart), { label: 'Open value', value: money(sum(rs.filter((r) => ['SUBMITTED', 'APPROVED'].includes(r.status)), (r) => r.total)) }],
  actions: [
    { id: 'submit', label: 'Submit', from: ['DRAFT', 'REJECTED'], to: 'SUBMITTED', permission: 'procurement.requisitions.create', notify: (r) => ({ title: `Requisition ${r.number} awaiting approval`, message: r.title, link: `/procurement/requisitions/${r.id}` }) },
    { id: 'approve', label: 'Approve', from: ['SUBMITTED'], to: 'APPROVED', permission: 'procurement.requisitions.approve', noSelf: true },
    { id: 'reject', label: 'Reject', from: ['SUBMITTED'], to: 'REJECTED', permission: 'procurement.requisitions.approve', note: 'required', tone: 'danger' },
    {
      id: 'rfq', label: 'Create RFQ', from: ['APPROVED'], to: 'RFQ_ISSUED', permission: 'procurement.rfq.manage',
      inputs: [{ key: 'supplierIds', label: 'Invite suppliers', type: 'multilookup', lookup: 'suppliers', required: true }],
      effect: (r, { input, user }) => {
        const ids = input.values?.supplierIds || []
        if (ids.length < 1) return { ok: false, error: 'Invite at least one supplier.' }
        const x = createRecord('rfqs', { title: r.title, requisitionId: r.id, hubId: r.hubId, supplierIds: ids, responseDue: dayjs().add(5, 'day').format('YYYY-MM-DD'), lines: r.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }, user)
        return x.ok ? { patch: { rfqId: x.record.id, rfqNumber: x.record.number } } : x
      },
    },
    {
      id: 'po', label: 'Create PO directly', from: ['APPROVED'], to: 'PO_CREATED', permission: 'procurement.po.create',
      inputs: [{ key: 'supplierId', label: 'Supplier', type: 'lookup', lookup: 'suppliers', required: true }],
      effect: (r, { input, user }) => { const x = createPoFromRequisition(r, input.values?.supplierId, user); return x.ok ? { patch: { poId: x.record.id, poNumber: x.record.number } } : x },
    },
    { id: 'cancel', label: 'Cancel', from: ['DRAFT', 'SUBMITTED', 'APPROVED'], to: 'CANCELLED', permission: 'procurement.requisitions.create', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [r.replenishmentDraftId && { label: `AI replenishment ${r.replenishmentNumber || ''}`, to: `/ai/replenishment/${r.replenishmentDraftId}` }, r.rfqId && { label: `RFQ ${r.rfqNumber}`, to: `/procurement/rfqs/${r.rfqId}` }, r.poId && { label: `PO ${r.poNumber}`, to: `/procurement/purchase-orders/${r.poId}` }],
}

export const rfqs = {
  id: 'rfqs', key: K.RFQS, label: 'RFQ', plural: 'Requests for quotation', numberPrefix: 'RFQ', idPrefix: 'rfq', basePath: '/procurement/rfqs', auditModule: 'purchasing',
  description: 'Competitive quotes from invited suppliers. Compare the received quotes side by side and award one — the PO is created from the winning quote.',
  permissions: { view: 'procurement.rfq.view', create: 'procurement.rfq.manage', edit: 'procurement.rfq.manage' },
  statuses: { DRAFT: S('Draft', 'neutral'), ISSUED: S('Issued to suppliers', 'info'), EVALUATION: S('Under evaluation', 'warning'), AWARDED: S('Awarded', 'success'), CANCELLED: S('Cancelled', 'neutral') },
  initialStatus: 'DRAFT', editableIn: ['DRAFT'],
  initialValues: () => ({ responseDue: dayjs().add(5, 'day').format('YYYY-MM-DD'), hubId: 'hub-che', lines: [], supplierIds: [] }),
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, wide: true },
    { key: 'requisitionId', label: 'Requisition', type: 'lookup', lookup: 'module:purchase_requisitions' },
    { key: 'hubId', label: 'Deliver to hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'responseDue', label: 'Quotes due', type: 'date', required: true },
    { key: 'supplierIds', label: 'Invited suppliers', type: 'multilookup', lookup: 'suppliers', required: true },
    { key: 'lines', label: 'Items', type: 'lines', required: true, columns: [productCol(), qtyCol()] },
  ],
  listColumns: ['title', 'supplierIds', 'responseDue'],
  kpis: (rs) => statusKpis(rs, rfqs, ['ISSUED', 'EVALUATION', 'AWARDED']),
  actions: [
    { id: 'issue', label: 'Issue to suppliers', from: ['DRAFT'], to: 'ISSUED', permission: 'procurement.rfq.manage', description: 'Invited suppliers see this RFQ in the Supplier Portal and can submit a quote. No real email is sent.', notify: (r) => ({ title: `New RFQ ${r.number}`, message: r.title, roles: ['SUPPLIER'], link: '/supplier' }) },
    { id: 'evaluate', label: 'Close for evaluation', from: ['ISSUED'], to: 'EVALUATION', permission: 'procurement.rfq.manage', when: (r) => read(K.SUPPLIER_QUOTES).some((q) => q.rfqId === r.id) },
    {
      id: 'award', label: 'Award', from: ['EVALUATION'], to: 'AWARDED', permission: 'procurement.rfq.approve', noSelf: true,
      inputs: [{ key: 'quoteId', label: 'Winning quote', type: 'lookup', lookup: 'module:supplier_quotes', required: true }],
      effect: (r, { input, user }) => {
        const quotes = read(K.SUPPLIER_QUOTES)
        const q = quotes.find((x) => x.id === input.values?.quoteId && x.rfqId === r.id)
        if (!q) return { ok: false, error: 'Choose one of the quotes received for this RFQ.' }
        const po = createPoFromQuote(q, r, user)
        if (!po.ok) return po
        quotes.filter((x) => x.rfqId === r.id && ['SUBMITTED', 'SHORTLISTED'].includes(x.status)).forEach((x) => patchRecord('supplier_quotes', x.id, { status: x.id === q.id ? 'ACCEPTED' : 'REJECTED' }, { user, action: x.id === q.id ? `Awarded on ${r.number}` : `Not selected on ${r.number}` }))
        return { patch: { awardedQuoteId: q.id, awardedSupplierId: q.supplierId, poId: po.record.id, poNumber: po.record.number } }
      },
    },
    { id: 'cancel', label: 'Cancel', from: ['DRAFT', 'ISSUED', 'EVALUATION'], to: 'CANCELLED', permission: 'procurement.rfq.manage', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [r.requisitionId && { label: 'Requisition', to: `/procurement/requisitions/${r.requisitionId}` }, r.poId && { label: `PO ${r.poNumber}`, to: `/procurement/purchase-orders/${r.poId}` }, { label: 'Quotes', to: `/procurement/quotes?rfqId=${r.id}` }],
  detailTables: (r) => {
    const qs = read(K.SUPPLIER_QUOTES).filter((q) => q.rfqId === r.id)
    const low = Math.min(...qs.map((q) => q.total || Infinity))
    const fast = Math.min(...qs.map((q) => Number(q.leadTimeDays) || Infinity))
    const lineCols = (r.lines || []).map((l, i) => ({ key: `l${i}`, header: recordFor('products', l.productId)?.name || 'Item', align: 'right', render: (q) => { const p = (q.lines || []).find((x) => x.productId === l.productId)?.unitPrice; const best = Math.min(...qs.map((x) => (x.lines || []).find((y) => y.productId === l.productId)?.unitPrice ?? Infinity)); return p === undefined ? '—' : `${money(p)}${p === best ? ' ★' : ''}` } }))
    return [{
      title: 'Quote comparison', subtitle: '★ lowest unit price per item. Award picks the winning quote and creates the PO.', empty: 'No quotes received yet.', rowTo: (q) => `/procurement/quotes/${q.id}`,
      columns: [{ key: 'supplierId', header: 'Supplier', render: (q) => recordFor('suppliers', q.supplierId)?.name || q.supplierId }, ...lineCols, { key: 'total', header: 'Total', align: 'right', render: (q) => `${money(q.total)}${q.total === low ? ' (lowest)' : ''}` }, { key: 'leadTimeDays', header: 'Lead time', align: 'right', render: (q) => `${q.leadTimeDays} d${Number(q.leadTimeDays) === fast ? ' (fastest)' : ''}` }, { key: 'paymentTerms', header: 'Terms' }, { key: 'status', header: 'Status' }],
      rows: qs,
    }]
  },
}

export const supplierQuotes = {
  id: 'supplier_quotes', key: K.SUPPLIER_QUOTES, label: 'Supplier quote', plural: 'Supplier quotes', numberPrefix: 'SQ', idPrefix: 'sq', basePath: '/procurement/quotes', auditModule: 'purchasing',
  description: 'Quotes received against RFQs — entered by buyers or submitted by suppliers in the Supplier Portal (suppliers only see their own).',
  permissions: { view: ['procurement.rfq.view', 'supplierportal.access'], create: ['procurement.rfq.manage', 'supplierportal.access'], edit: ['procurement.rfq.manage', 'supplierportal.access'] },
  scope: { supplier: 'supplierId' }, filters: ['rfqId', 'supplierId'],
  statuses: { SUBMITTED: S('Submitted', 'info'), SHORTLISTED: S('Shortlisted', 'accent'), ACCEPTED: S('Accepted', 'success'), REJECTED: S('Not selected', 'neutral') },
  initialStatus: 'SUBMITTED', editableIn: ['SUBMITTED'],
  initialValues: ({ user, params }) => {
    const rfq = read(K.RFQS).find((r) => r.id === params?.get('rfqId'))
    return { supplierId: user?.supplierId || '', __supplierLock: user?.supplierId || '', rfqId: rfq?.id || '', validUntil: dayjs().add(30, 'day').format('YYYY-MM-DD'), leadTimeDays: 7, paymentTerms: 'Net 30', lines: (rfq?.lines || []).map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: '' })) }
  },
  fields: [
    { key: 'rfqId', label: 'RFQ', type: 'lookup', lookup: 'module:rfqs', required: true, filter: (r, v) => r.status === 'ISSUED' && (!v.supplierId || (r.supplierIds || []).includes(v.supplierId)) },
    { key: 'supplierId', label: 'Supplier', type: 'lookup', lookup: 'suppliers', required: true, filter: (s, v) => !v.__supplierLock || s.id === v.__supplierLock },
    { key: 'validUntil', label: 'Valid until', type: 'date', required: true },
    { key: 'leadTimeDays', label: 'Lead time (days)', type: 'integer', required: true, min: 0 },
    { key: 'paymentTerms', label: 'Payment terms', type: 'select', options: ['Advance', 'Net 15', 'Net 30', 'Net 45', 'Net 60'], required: true },
    { key: 'incoterm', label: 'Incoterm', type: 'select', options: ['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] },
    { key: 'lines', label: 'Prices', type: 'lines', required: true, columns: [productCol(), qtyCol(), { key: 'unitPrice', label: 'Unit price', type: 'money', required: true, span: 2 }, amountCol()] },
  ],
  compute: (r) => ({ total: linesTotal(r.lines) }), computedSummary: ['total'],
  validate: (v, ctx) => {
    const e = {}
    const rfq = read(K.RFQS).find((r) => r.id === v.rfqId)
    if (rfq && !(rfq.supplierIds || []).includes(v.supplierId)) e.supplierId = 'This supplier was not invited to the RFQ.'
    if (rfq && ctx.mode === 'create' && rfq.status !== 'ISSUED') e.rfqId = 'This RFQ is no longer accepting quotes.'
    if (ctx.list.some((q) => q.id !== ctx.existing?.id && q.rfqId === v.rfqId && q.supplierId === v.supplierId && q.status !== 'REJECTED')) e.supplierId = 'This supplier already quoted on this RFQ — edit that quote instead.'
    if (ctx.user?.supplierId && v.supplierId !== ctx.user.supplierId) e.supplierId = 'You can only quote for your own company.'
    return e
  },
  listColumns: ['rfqId', 'supplierId', 'total', 'leadTimeDays', 'validUntil'],
  actions: [
    { id: 'shortlist', label: 'Shortlist', from: ['SUBMITTED'], to: 'SHORTLISTED', permission: 'procurement.rfq.manage' },
    { id: 'decline', label: 'Not selected', from: ['SUBMITTED', 'SHORTLISTED'], to: 'REJECTED', permission: 'procurement.rfq.manage', tone: 'secondary' },
  ],
  related: (r) => [{ label: 'RFQ', to: `/procurement/rfqs/${r.rfqId}` }],
}

const PO_STATUSES = { DRAFT: S('Draft', 'neutral'), PENDING_APPROVAL: S('Pending approval', 'warning'), APPROVED: S('Approved', 'info'), SENT: S('Sent to supplier', 'brand'), CONFIRMED: S('Supplier confirmed', 'accent'), PARTIALLY_RECEIVED: S('Partially received', 'warning'), RECEIVED: S('Received', 'success'), CLOSED: S('Closed', 'neutral'), REJECTED: S('Rejected', 'danger'), CANCELLED: S('Cancelled', 'neutral') }
export const purchaseOrders = {
  id: 'purchase_orders', key: K.PURCHASE_ORDERS, label: 'Purchase order', plural: 'Purchase orders', numberPrefix: 'PO', idPrefix: 'po', basePath: '/procurement/purchase-orders', auditModule: 'purchasing',
  description: 'Purchase orders with approval, supplier confirmation and receiving progress. Goods are received with a goods receipt (GRN) in Warehouse › Receiving.',
  permissions: { view: ['procurement.po.view', 'supplierportal.access'], create: 'procurement.po.create', edit: 'procurement.po.create' },
  scope: { supplier: 'supplierId' },
  statuses: PO_STATUSES, initialStatus: 'DRAFT', editableIn: ['DRAFT', 'REJECTED'],
  initialValues: () => ({ hubId: 'hub-che', orderDate: today(), expectedDate: dayjs().add(7, 'day').format('YYYY-MM-DD'), currency: 'Base currency', incoterm: 'DAP', paymentTerms: 'Net 30', lines: [] }),
  fields: [
    { key: 'supplierId', label: 'Supplier', type: 'lookup', lookup: 'suppliers', required: true },
    { key: 'hubId', label: 'Deliver to hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'orderDate', label: 'Order date', type: 'date', required: true },
    { key: 'expectedDate', label: 'Expected delivery', type: 'date', required: true },
    { key: 'currency', label: 'Currency', type: 'select', options: ['Base currency', 'AED', 'USD', 'EUR', 'INR'], required: true },
    { key: 'incoterm', label: 'Incoterm', type: 'select', options: ['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] },
    { key: 'paymentTerms', label: 'Payment terms', type: 'select', options: ['Advance', 'Net 15', 'Net 30', 'Net 45', 'Net 60'], required: true },
    { key: 'requisitionId', label: 'Requisition', type: 'lookup', lookup: 'module:purchase_requisitions', readOnly: true },
    { key: 'supplierRef', label: 'Supplier confirmation ref.', type: 'text', readOnly: true },
    { key: 'lines', label: 'Items', type: 'lines', required: true, columns: [productCol({ filter: (p) => p.status === 'Active', fill: (p) => ({ unitPrice: p.purchasePrice, taxPercent: 5 }) }), qtyCol(), { key: 'unitPrice', label: 'Unit price', type: 'money', required: true, span: 2 }, { key: 'taxPercent', label: 'VAT %', type: 'percent', span: 1 }, { key: 'receivedQty', label: 'Received', type: 'number', span: 1, computed: (l) => l.receivedQty || 0 }, amountCol()] },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  compute: (r) => { const subtotal = linesTotal(r.lines); const vatAmount = sum(r.lines, (l) => vatOn((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), l.taxPercent ?? 5)); return { subtotal, vatAmount, total: r2(subtotal + vatAmount) } },
  computedSummary: ['subtotal', 'vatAmount', 'total'],
  validate: (v) => {
    const e = {}
    const s = recordFor('suppliers', v.supplierId)
    if (s && s.status === 'Inactive') e.supplierId = `${s.name} is inactive.`
    if (v.expectedDate && v.orderDate && v.expectedDate < v.orderDate) e.expectedDate = 'Expected delivery cannot be before the order date.'
    return e
  },
  listColumns: ['supplierId', 'hubId', 'orderDate', 'expectedDate', 'total'], filters: ['supplierId', 'hubId'],
  kpis: (rs) => [...statusKpis(rs, purchaseOrders, ['PENDING_APPROVAL', 'SENT', 'PARTIALLY_RECEIVED'], FileCheck2), { label: 'Open PO value', value: money(sum(rs.filter((r) => ['APPROVED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(r.status)), (r) => r.total)) }],
  summary: (r) => [{ label: 'Total', value: money(r.total) }, { label: 'Ordered qty', value: sum(r.lines, (l) => l.quantity) }, { label: 'Received qty', value: sum(r.lines, (l) => l.receivedQty || 0) }, { label: 'Open qty', value: sum(Object.values(poRemaining(r)), (x) => Math.max(0, x)) }],
  actions: [
    { id: 'submit', label: 'Submit for approval', from: ['DRAFT', 'REJECTED'], to: 'PENDING_APPROVAL', permission: 'procurement.po.create', notify: (r) => ({ title: `PO ${r.number} awaiting approval`, message: money(r.total), link: `/procurement/purchase-orders/${r.id}` }) },
    { id: 'approve', label: 'Approve', from: ['PENDING_APPROVAL'], to: 'APPROVED', permission: 'procurement.po.approve', noSelf: true, effect: (r, { user }) => ({ patch: { approvedBy: user.id, approvedAt: new Date().toISOString() } }) },
    { id: 'reject', label: 'Reject', from: ['PENDING_APPROVAL'], to: 'REJECTED', permission: 'procurement.po.approve', note: 'required', tone: 'danger' },
    { id: 'send', label: 'Send to supplier', from: ['APPROVED'], to: 'SENT', permission: 'procurement.po.create', description: 'Marks the PO as sent. The supplier sees it in the Supplier Portal. No real email is sent from the prototype.', notify: (r) => ({ title: `Purchase order ${r.number}`, message: 'Please confirm in the supplier portal.', roles: ['SUPPLIER'], link: '/supplier' }) },
    { id: 'confirm', label: 'Confirm order', from: ['SENT'], to: 'CONFIRMED', permission: ['supplierportal.access', 'procurement.po.create'], inputs: [{ key: 'supplierRef', label: 'Supplier reference', type: 'text', required: true }, { key: 'confirmedDate', label: 'Confirmed delivery date', type: 'date', required: true }], effect: (r, { input }) => (!input.values?.supplierRef || !input.values?.confirmedDate ? { ok: false, error: 'Enter the supplier reference and confirmed delivery date.' } : { patch: { supplierRef: input.values.supplierRef, expectedDate: input.values.confirmedDate } }) },
    { id: 'close', label: 'Close', from: ['RECEIVED', 'PARTIALLY_RECEIVED'], to: 'CLOSED', permission: 'procurement.po.approve', note: 'required', tone: 'secondary' },
    { id: 'cancel', label: 'Cancel', from: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT'], to: 'CANCELLED', permission: 'procurement.po.approve', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [
    ['APPROVED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(r.status) && { label: 'Receive goods (GRN)', to: `/warehouse/receiving/new?purchaseOrderId=${r.id}` },
    { label: 'Goods receipts', to: `/warehouse/receiving?purchaseOrderId=${r.id}` },
    r.requisitionId && { label: 'Requisition', to: `/procurement/requisitions/${r.requisitionId}` },
    { label: 'Supplier invoices', to: `/finance/payables/invoices?purchaseOrderId=${r.id}` },
  ],
}

export const goodsReceipts = {
  id: 'goods_receipts', key: K.GOODS_RECEIPTS, label: 'Goods receipt', plural: 'Goods receipts (GRN)', numberPrefix: 'RCV', idPrefix: 'rcv', basePath: '/warehouse/receiving', auditModule: 'wms',
  description: 'Receiving against purchase orders with batch, expiry, rejected quantity and bin. Posting adds accepted stock to the hub through the stock ledger, puts QA-required lots on hold, and opens put-away tasks.',
  permissions: { view: 'warehouse.receiving.view', create: 'warehouse.receiving.manage', edit: 'warehouse.receiving.manage' },
  scope: { supplier: 'supplierId' }, filters: ['purchaseOrderId', 'hubId'],
  statuses: { DRAFT: S('Draft', 'neutral'), POSTED: S('Posted', 'success'), CANCELLED: S('Cancelled', 'neutral') },
  initialStatus: 'DRAFT', editableIn: ['DRAFT'],
  initialValues: ({ params }) => {
    const po = read(K.PURCHASE_ORDERS).find((p) => p.id === params?.get('purchaseOrderId'))
    const rem = po ? poRemaining(po) : {}
    return { purchaseOrderId: po?.id || '', supplierId: po?.supplierId || '', hubId: po?.hubId || 'hub-che', receivedDate: today(), qaRequired: true, lines: po ? po.lines.filter((l) => (rem[l.productId] || 0) > 0).map((l) => ({ productId: l.productId, orderedQty: l.quantity, receivedQty: Math.max(0, (l.quantity || 0) - (l.receivedQty || 0)), rejectedQty: 0, batchNumber: '', expiryDate: '', mfgDate: '', unitCost: l.unitPrice })) : [] }
  },
  fields: [
    { key: 'purchaseOrderId', label: 'Purchase order', type: 'lookup', lookup: 'module:purchase_orders', filter: (p) => ['APPROVED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(p.status), onChange: (v) => { const po = recordFor('module:purchase_orders', v); return po ? { supplierId: po.supplierId, hubId: po.hubId } : {} } },
    { key: 'supplierId', label: 'Supplier', type: 'lookup', lookup: 'suppliers', required: true },
    { key: 'hubId', label: 'Receiving hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'receivedDate', label: 'Received date', type: 'date', required: true },
    { key: 'deliveryNoteRef', label: 'Supplier delivery note', type: 'text' },
    { key: 'vehicleTemperature', label: 'Truck temperature (°C)', type: 'number' },
    { key: 'qaRequired', label: 'Hold for QA inspection', type: 'boolean' },
    { key: 'lines', label: 'Received lines', type: 'lines', required: true, columns: [
      productCol({ span: 3 }), { key: 'orderedQty', label: 'Ordered', type: 'number', span: 1 }, qtyCol('receivedQty', 'Received', { span: 1 }), { key: 'rejectedQty', label: 'Rejected', type: 'number', span: 1 },
      { key: 'batchNumber', label: 'Batch', type: 'text', span: 2 }, { key: 'expiryDate', label: 'Expiry', type: 'date', span: 2 }, { key: 'mfgDate', label: 'Mfg date', type: 'date', span: 2, hideInTable: true },
      { key: 'locationId', label: 'Bin', type: 'lookup', lookup: 'locations', span: 2, hideInTable: true }, { key: 'unitCost', label: 'Unit cost', type: 'money', span: 2, hideInTable: true },
    ] },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  validate: (v) => {
    const e = validateGrnLines(v)
    if (v.vehicleTemperature !== null && v.vehicleTemperature !== undefined && v.vehicleTemperature !== '' && Number(v.vehicleTemperature) > -12 && (v.lines || []).some((l) => recordFor('products', l.productId)?.storageCondition === 'Frozen') && !v.qaRequired) e.qaRequired = 'Frozen goods arrived warmer than −12 °C — keep them on QA hold.'
    return e
  },
  compute: (r) => ({ acceptedTotal: sum(r.lines, (l) => (Number(l.receivedQty) || 0) - (Number(l.rejectedQty) || 0)), value: sum(r.lines, (l) => ((Number(l.receivedQty) || 0) - (Number(l.rejectedQty) || 0)) * (Number(l.unitCost) || 0)) }),
  listColumns: ['purchaseOrderId', 'supplierId', 'hubId', 'receivedDate', 'qaRequired', 'value'],
  kpis: (rs) => [...statusKpis(rs, goodsReceipts, ['DRAFT', 'POSTED']), { label: 'Received today', value: count(rs, (r) => r.status === 'POSTED' && r.receivedDate === today()) }, { label: 'Rejected qty (all)', value: sum(rs.filter((r) => r.status === 'POSTED'), (r) => sum(r.lines, (l) => l.rejectedQty)), tone: 'warning' }],
  actions: [
    { id: 'post', label: 'Post receipt', from: ['DRAFT'], to: 'POSTED', permission: 'warehouse.receiving.manage', description: 'Accepted quantities are received into hub stock now. QA-required lots stay on hold (not sellable) until QA releases them.', effect: (r, { user }) => postGoodsReceipt(r, user), notify: (r) => (r.qaRequired ? { title: `GRN ${r.number} on QA hold`, message: `Inspection ${r.qaInspectionNumber || ''} opened`, roles: ['QA_MANAGER'], link: '/qa/inspections' } : null) },
    { id: 'cancel', label: 'Cancel draft', from: ['DRAFT'], to: 'CANCELLED', permission: 'warehouse.receiving.manage', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [r.purchaseOrderId && { label: 'Purchase order', to: `/procurement/purchase-orders/${r.purchaseOrderId}` }, r.status === 'POSTED' && { label: 'Lots received', to: `/inventory/batches?q=${encodeURIComponent(r.number)}` }, r.status === 'POSTED' && { label: 'Put-away tasks', to: `/warehouse/putaway?grnId=${r.id}` }],
}

export const supplierInvoices = {
  id: 'supplier_invoices', key: K.SUPPLIER_INVOICES, label: 'Supplier invoice', plural: 'Supplier invoices', numberPrefix: 'SINV', idPrefix: 'sinv', basePath: '/finance/payables/invoices', auditModule: 'ap',
  description: 'Supplier bills with 3-way matching (PO price × goods received vs invoice). Variances need a note to approve. Payments are recorded in Supplier payments.',
  permissions: { view: ['finance.ap.view', 'supplierportal.access'], create: ['finance.ap.manage', 'supplierportal.access'], edit: 'finance.ap.manage' },
  scope: { supplier: 'supplierId' }, filters: ['supplierId', 'purchaseOrderId'],
  statuses: { RECEIVED: S('Received', 'info'), MATCHED: S('Matched', 'brand'), VARIANCE: S('Price / qty variance', 'warning'), APPROVED: S('Approved for payment', 'accent'), PARTIALLY_PAID: S('Partially paid', 'warning'), PAID: S('Paid', 'success'), REJECTED: S('Rejected', 'danger') },
  initialStatus: 'RECEIVED', editableIn: ['RECEIVED', 'VARIANCE'],
  initialValues: ({ user }) => ({ supplierId: user?.supplierId || '', __supplierLock: user?.supplierId || '', invoiceDate: today(), dueDate: dayjs().add(30, 'day').format('YYYY-MM-DD') }),
  fields: [
    { key: 'supplierId', label: 'Supplier', type: 'lookup', lookup: 'suppliers', required: true, filter: (s, v) => !v.__supplierLock || s.id === v.__supplierLock },
    { key: 'purchaseOrderId', label: 'Purchase order', type: 'lookup', lookup: 'module:purchase_orders', filter: (p, v) => (!v.supplierId || p.supplierId === v.supplierId) && ['PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CONFIRMED', 'SENT', 'APPROVED'].includes(p.status) },
    { key: 'supplierInvoiceNo', label: 'Supplier invoice no.', type: 'text', required: true },
    { key: 'supplierTrn', label: 'Supplier TRN', type: 'text' },
    { key: 'invoiceDate', label: 'Invoice date', type: 'date', required: true },
    { key: 'dueDate', label: 'Due date', type: 'date', required: true },
    { key: 'subtotal', label: 'Amount before VAT', type: 'money', required: true, min: 0 },
    { key: 'vatAmount', label: 'VAT', type: 'money', required: true, min: 0 },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  compute: (r) => ({ total: r2(Number(r.subtotal || 0) + Number(r.vatAmount || 0)) }), computedSummary: ['total'],
  validate: (v, ctx) => {
    const e = {}
    if (ctx.list.some((x) => x.id !== ctx.existing?.id && x.supplierId === v.supplierId && String(x.supplierInvoiceNo).trim().toLowerCase() === String(v.supplierInvoiceNo || '').trim().toLowerCase() && x.status !== 'REJECTED')) e.supplierInvoiceNo = 'This supplier invoice number is already recorded (duplicate).'
    if (v.supplierTrn && !/^\d{15}$/.test(String(v.supplierTrn).replace(/\s/g, ''))) e.supplierTrn = 'TRN must be 15 digits.'
    if (v.dueDate && v.invoiceDate && v.dueDate < v.invoiceDate) e.dueDate = 'Due date cannot be before the invoice date.'
    if (ctx.user?.supplierId && v.supplierId !== ctx.user.supplierId) e.supplierId = 'You can only submit invoices for your own company.'
    return e
  },
  listColumns: ['supplierId', 'supplierInvoiceNo', 'purchaseOrderId', 'invoiceDate', 'dueDate', 'total'],
  kpis: (rs) => [...statusKpis(rs, supplierInvoices, ['RECEIVED', 'VARIANCE', 'APPROVED']), { label: 'Unpaid balance', value: money(sum(rs.filter((r) => ['APPROVED', 'PARTIALLY_PAID', 'MATCHED', 'VARIANCE', 'RECEIVED'].includes(r.status)), (r) => supplierInvoiceBalance(r.id))) }],
  summary: (r) => { const m = threeWayMatch(r); return [{ label: 'Invoice (before VAT)', value: money(r.subtotal) }, { label: 'Received value (PO price)', value: money(m.receivedValue) }, { label: 'Variance', value: `${money(m.variance)} (${m.variancePct}%)`, tone: m.status === 'MATCHED' ? 'success' : 'warning' }, { label: 'Balance due', value: money(supplierInvoiceBalance(r.id)) }] },
  actions: [
    { id: 'match', label: 'Run 3-way match', from: ['RECEIVED', 'VARIANCE'], permission: 'finance.ap.manage', note: 'none', effect: (r) => { const m = threeWayMatch(r); return { patch: { status: m.status === 'MATCHED' ? 'MATCHED' : 'VARIANCE', match: m } } } },
    { id: 'approve', label: 'Approve for payment', from: ['MATCHED', 'VARIANCE'], to: 'APPROVED', permission: 'finance.ap.approve', noSelf: true, effect: (r, { input }) => (r.status === 'VARIANCE' && String(input.note || '').trim().length < 3 ? { ok: false, error: 'This invoice has a variance — enter the reason it is approved.' } : {}) },
    { id: 'reject', label: 'Reject', from: ['RECEIVED', 'MATCHED', 'VARIANCE'], to: 'REJECTED', permission: 'finance.ap.approve', note: 'required', tone: 'danger' },
  ],
  related: (r) => [r.purchaseOrderId && { label: 'Purchase order', to: `/procurement/purchase-orders/${r.purchaseOrderId}` }, ['APPROVED', 'PARTIALLY_PAID'].includes(r.status) && { label: 'Record payment', to: `/finance/payables/payments/new?supplierInvoiceId=${r.id}` }],
}

export const supplierPayments = {
  id: 'supplier_payments', key: K.SUPPLIER_PAYMENTS, label: 'Supplier payment', plural: 'Supplier payments', numberPrefix: 'SPAY', idPrefix: 'spay', basePath: '/finance/payables/payments', auditModule: 'ap',
  description: 'Payments to suppliers against approved invoices. "Mark paid" records the payment in the prototype — no bank transfer is made.',
  permissions: { view: ['finance.ap.view', 'supplierportal.access'], create: 'finance.ap.manage', edit: 'finance.ap.manage' },
  scope: { supplier: 'supplierId' },
  statuses: { DRAFT: S('Draft', 'neutral'), APPROVED: S('Approved', 'info'), PAID: S('Paid (recorded)', 'success'), CANCELLED: S('Cancelled', 'neutral') },
  initialStatus: 'DRAFT', editableIn: ['DRAFT'],
  initialValues: ({ params }) => {
    const inv = read(K.SUPPLIER_INVOICES).find((s) => s.id === params?.get('supplierInvoiceId'))
    return { supplierInvoiceId: inv?.id || '', supplierId: inv?.supplierId || '', amount: inv ? supplierInvoiceBalance(inv.id) : '', paymentDate: today(), method: 'Bank transfer' }
  },
  fields: [
    { key: 'supplierInvoiceId', label: 'Supplier invoice', type: 'lookup', lookup: 'module:supplier_invoices', required: true, filter: (s) => ['APPROVED', 'PARTIALLY_PAID'].includes(s.status), onChange: (v) => { const s = recordFor('module:supplier_invoices', v); return s ? { supplierId: s.supplierId, amount: supplierInvoiceBalance(s.id) } : {} } },
    { key: 'supplierId', label: 'Supplier', type: 'lookup', lookup: 'suppliers', required: true },
    { key: 'amount', label: 'Amount', type: 'money', required: true, min: 0.01 },
    { key: 'paymentDate', label: 'Payment date', type: 'date', required: true },
    { key: 'method', label: 'Method', type: 'select', options: ['Bank transfer', 'Cheque', 'Cash'], required: true },
    { key: 'bankAccountId', label: 'Paid from', type: 'lookup', lookup: 'bankAccounts', required: true },
    { key: 'reference', label: 'Reference', type: 'text' },
  ],
  validate: (v) => {
    const e = {}
    const bal = supplierInvoiceBalance(v.supplierInvoiceId)
    if (v.supplierInvoiceId && Number(v.amount) > bal + 0.009) e.amount = `Amount exceeds the invoice balance of ${money(bal)}.`
    const inv = read(K.SUPPLIER_INVOICES).find((s) => s.id === v.supplierInvoiceId)
    if (inv && inv.supplierId !== v.supplierId) e.supplierId = 'Supplier does not match the invoice.'
    return e
  },
  listColumns: ['supplierInvoiceId', 'supplierId', 'amount', 'paymentDate', 'method'],
  actions: [
    { id: 'approve', label: 'Approve', from: ['DRAFT'], to: 'APPROVED', permission: 'finance.ap.approve', noSelf: true },
    {
      id: 'pay', label: 'Mark paid', from: ['APPROVED'], to: 'PAID', permission: 'finance.ap.manage', description: 'Records the payment in the prototype. No bank transfer is made.',
      effect: (r, { user }) => {
        const bal = supplierInvoiceBalance(r.supplierInvoiceId)
        if (Number(r.amount) > bal + 0.009) return { ok: false, error: `Only ${money(bal)} is still due on this invoice.` }
        patchRecord('supplier_invoices', r.supplierInvoiceId, { status: bal - Number(r.amount) <= 0.009 ? 'PAID' : 'PARTIALLY_PAID' }, { user, action: `Payment ${r.number} recorded` })
        return { patch: { paidAt: new Date().toISOString() } }
      },
    },
    { id: 'cancel', label: 'Cancel', from: ['DRAFT', 'APPROVED'], to: 'CANCELLED', permission: 'finance.ap.manage', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [{ label: 'Supplier invoice', to: `/finance/payables/invoices/${r.supplierInvoiceId}` }],
}

/* ---------------- Import & export ---------------- */
const IMP_STATUSES = { BOOKED: S('Booked', 'info'), IN_TRANSIT: S('In transit', 'brand'), ARRIVED: S('Arrived at port', 'accent'), CUSTOMS: S('Customs clearance', 'warning'), CLEARED: S('Cleared', 'success'), DELIVERED: S('Delivered to warehouse', 'success'), CLOSED: S('Closed', 'neutral'), CANCELLED: S('Cancelled', 'neutral') }
const DOCS = [['docCommercialInvoice', 'Commercial invoice'], ['docPackingList', 'Packing list'], ['docBillOfLading', 'Bill of lading / AWB'], ['docCertificateOfOrigin', 'Certificate of origin'], ['docHealthCertificate', 'Health certificate'], ['docHalalCertificate', 'Halal certificate']]
export const landedCost = (r) => {
  const extra = sum([r.freightCost, r.insuranceCost, r.dutyCost, r.clearingCost, r.otherCost], (x) => x)
  const basis = r.allocationBasis || 'VALUE'
  const weightOf = (l) => (basis === 'QUANTITY' ? Number(l.quantity) || 0 : basis === 'WEIGHT' ? Number(l.weightKg) || 0 : (Number(l.quantity) || 0) * (Number(l.unitValue) || 0))
  const totalW = sum(r.lines, weightOf)
  return (r.lines || []).map((l) => {
    const share = totalW ? weightOf(l) / totalW : 0
    const alloc = r2(extra * share)
    const base = r2((Number(l.quantity) || 0) * (Number(l.unitValue) || 0))
    return { ...l, base, allocated: alloc, landed: r2(base + alloc), landedUnit: Number(l.quantity) ? r2((base + alloc) / Number(l.quantity)) : 0, share: r2(share * 100) }
  })
}
export const importShipments = {
  id: 'import_shipments', key: K.IMPORT_SHIPMENTS, label: 'Shipment', plural: 'Import & export shipments', numberPrefix: 'SHP', idPrefix: 'shp', basePath: '/import/shipments', auditModule: 'import',
  description: 'Sea, air and land shipments with containers, documents checklist, milestones and landed cost allocated by quantity, weight or value.',
  permissions: { view: 'import.shipments.view', create: 'import.shipments.manage', edit: 'import.shipments.manage' },
  scope: { supplier: 'supplierId' }, filters: ['direction', 'mode'],
  statuses: IMP_STATUSES, initialStatus: 'BOOKED', editableIn: ['BOOKED', 'IN_TRANSIT', 'ARRIVED', 'CUSTOMS'],
  initialValues: () => ({ direction: 'Import', mode: 'Sea', allocationBasis: 'VALUE', etd: today(), eta: dayjs().add(21, 'day').format('YYYY-MM-DD'), containerType: '40ft Reefer', lines: [] }),
  sections: [
    { title: 'Shipment', fields: ['direction', 'mode', 'purchaseOrderId', 'supplierId', 'originPort', 'destinationPort', 'incoterm', 'blNumber', 'containerNumbers', 'containerType', 'etd', 'eta', 'ata', 'customsDeclarationNo'] },
    { title: 'Documents checklist', fields: DOCS.map(([k]) => k) },
    { title: 'Costs & landed cost basis', fields: ['freightCost', 'insuranceCost', 'dutyCost', 'clearingCost', 'otherCost', 'allocationBasis'] },
    { title: 'Goods', fields: ['lines', 'notes'] },
  ],
  fields: [
    { key: 'direction', label: 'Direction', type: 'select', options: ['Import', 'Export'], required: true },
    { key: 'mode', label: 'Mode', type: 'select', options: ['Sea', 'Air', 'Land'], required: true },
    { key: 'purchaseOrderId', label: 'Purchase order', type: 'lookup', lookup: 'module:purchase_orders', onChange: (v) => { const po = recordFor('module:purchase_orders', v); return po ? { supplierId: po.supplierId, lines: po.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitValue: l.unitPrice, weightKg: l.quantity * 12 })) } : {} } },
    { key: 'supplierId', label: 'Supplier / consignee', type: 'lookup', lookup: 'suppliers' },
    { key: 'originPort', label: 'Origin port', type: 'text', required: true },
    { key: 'destinationPort', label: 'Destination port', type: 'text', required: true },
    { key: 'incoterm', label: 'Incoterm', type: 'select', options: ['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] },
    { key: 'blNumber', label: 'B/L / AWB number', type: 'text' },
    { key: 'containerNumbers', label: 'Container numbers', type: 'text' },
    { key: 'containerType', label: 'Container type', type: 'select', options: ['20ft Reefer', '40ft Reefer', '20ft Dry', '40ft Dry', 'LCL', 'Air cargo', 'Reefer truck'] },
    { key: 'etd', label: 'ETD', type: 'date', required: true },
    { key: 'eta', label: 'ETA', type: 'date', required: true },
    { key: 'ata', label: 'Actual arrival', type: 'date' },
    { key: 'customsDeclarationNo', label: 'Customs declaration no.', type: 'text' },
    ...DOCS.map(([key, label]) => ({ key, label, type: 'boolean' })),
    { key: 'freightCost', label: 'Freight', type: 'money', min: 0 },
    { key: 'insuranceCost', label: 'Insurance', type: 'money', min: 0 },
    { key: 'dutyCost', label: 'Customs duty', type: 'money', min: 0 },
    { key: 'clearingCost', label: 'Clearing & port charges', type: 'money', min: 0 },
    { key: 'otherCost', label: 'Other', type: 'money', min: 0 },
    { key: 'allocationBasis', label: 'Allocate costs by', type: 'select', required: true, options: [{ value: 'QUANTITY', label: 'Quantity' }, { value: 'WEIGHT', label: 'Weight' }, { value: 'VALUE', label: 'Value' }] },
    { key: 'lines', label: 'Goods', type: 'lines', required: true, columns: [productCol({ span: 3, fill: (p) => ({ unitValue: p.purchasePrice }) }), qtyCol('quantity', 'Qty', { span: 2 }), { key: 'weightKg', label: 'Weight kg', type: 'number', span: 2 }, { key: 'unitValue', label: 'Unit value', type: 'money', span: 2 }, amountCol('quantity', 'unitValue')] },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  compute: (r) => ({ goodsValue: linesTotal(r.lines, 'quantity', 'unitValue'), extraCost: sum([r.freightCost, r.insuranceCost, r.dutyCost, r.clearingCost, r.otherCost], (x) => x), docsComplete: DOCS.filter(([k]) => r[k]).length }),
  computedSummary: ['goodsValue', 'extraCost'],
  validate: (v) => (v.eta && v.etd && v.eta < v.etd ? { eta: 'ETA cannot be before ETD.' } : {}),
  listColumns: ['direction', 'mode', 'supplierId', 'originPort', 'eta', 'containerNumbers', 'goodsValue'],
  kpis: (rs) => [...statusKpis(rs, importShipments, ['IN_TRANSIT', 'CUSTOMS'], Ship), { label: 'Arriving ≤ 7 days', value: count(rs, (r) => ['BOOKED', 'IN_TRANSIT'].includes(r.status) && dayjs(r.eta).diff(dayjs(), 'day') <= 7) }, { label: 'Missing documents', value: count(rs, (r) => !['CLOSED', 'CANCELLED', 'DELIVERED'].includes(r.status) && (r.docsComplete || 0) < DOCS.length), tone: 'warning' }],
  summary: (r) => [{ label: 'Goods value', value: money(r.goodsValue) }, { label: 'Freight, duty & charges', value: money(r.extraCost) }, { label: 'Landed total', value: money((r.goodsValue || 0) + (r.extraCost || 0)) }, { label: 'Documents', value: `${r.docsComplete || 0} / ${DOCS.length}` }],
  actions: [
    { id: 'depart', label: 'Departed', from: ['BOOKED'], to: 'IN_TRANSIT', permission: 'import.shipments.manage' },
    { id: 'arrive', label: 'Arrived', from: ['IN_TRANSIT'], to: 'ARRIVED', permission: 'import.shipments.manage', effect: (r) => ({ patch: { ata: r.ata || today() } }) },
    { id: 'customs', label: 'Start customs clearance', from: ['ARRIVED'], to: 'CUSTOMS', permission: 'import.shipments.manage', effect: (r) => (DOCS.some(([k]) => !r[k]) && r.direction === 'Import' ? { ok: false, error: 'Complete the documents checklist before customs clearance.' } : {}) },
    { id: 'clear', label: 'Cleared', from: ['CUSTOMS'], to: 'CLEARED', permission: 'import.shipments.approve', effect: (r) => (!r.customsDeclarationNo ? { ok: false, error: 'Enter the customs declaration number first.' } : {}) },
    { id: 'deliver', label: 'Delivered to warehouse', from: ['CLEARED'], to: 'DELIVERED', permission: 'import.shipments.manage' },
    { id: 'close', label: 'Close (costs final)', from: ['DELIVERED'], to: 'CLOSED', permission: 'import.landedcost.manage', effect: (r) => ({ patch: { landedCost: landedCost(r) } }) },
    { id: 'cancel', label: 'Cancel', from: ['BOOKED'], to: 'CANCELLED', permission: 'import.shipments.manage', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [r.purchaseOrderId && { label: 'Purchase order', to: `/procurement/purchase-orders/${r.purchaseOrderId}` }, r.purchaseOrderId && ['CLEARED', 'DELIVERED'].includes(r.status) && { label: 'Receive goods (GRN)', to: `/warehouse/receiving/new?purchaseOrderId=${r.purchaseOrderId}` }],
  detailTables: (r) => [{
    title: 'Landed cost', subtitle: `Freight, insurance, duty, clearing and other costs allocated by ${String(r.allocationBasis || 'VALUE').toLowerCase()}.`,
    columns: [{ key: 'productId', header: 'Product', render: (l) => recordFor('products', l.productId)?.name }, { key: 'quantity', header: 'Qty', align: 'right' }, { key: 'base', header: 'Goods value', align: 'right', render: (l) => money(l.base) }, { key: 'share', header: 'Share', align: 'right', render: (l) => `${l.share}%` }, { key: 'allocated', header: 'Allocated cost', align: 'right', render: (l) => money(l.allocated) }, { key: 'landed', header: 'Landed total', align: 'right', render: (l) => money(l.landed) }, { key: 'landedUnit', header: 'Landed / unit', align: 'right', render: (l) => money(l.landedUnit) }],
    rows: landedCost(r),
  }],
}

export const SUPPLY_MODULES = [vanAssignments, vanSales, vanSettlements, requisitions, rfqs, supplierQuotes, purchaseOrders, goodsReceipts, supplierInvoices, supplierPayments, importShipments]
