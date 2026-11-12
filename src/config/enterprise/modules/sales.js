/**
 * Sales, CRM, pricing, returns, order changes, customer service tickets, HORECA accounts and standing orders.
 * HORECA accounts and templates point at the existing customer master — no second customer record is created.
 */
import dayjs from 'dayjs'
import { Target, Users, Ticket, FileText, Undo2 } from 'lucide-react'
import { S, today, sum, count, money, productCol, qtyCol, amountCol, linesTotal, statusKpis, ownerDefault, PRIORITIES, r2 } from './common'
import { createRecord, read } from '../../../services/enterprise/recordService'
import { applyOrderChange, receiveSalesReturn, orderFromTemplate, salesAchieved } from '../../../services/enterprise/salesOpsService'
import { recordFor } from '../../../services/enterprise/lookupService'
import { STORAGE_KEYS as K } from '../../../utils/constants'

const SEGMENTS = ['Retail', 'Wholesale', 'HORECA', 'Modern Trade', 'Institutional', 'Van Sales']

export const leads = {
  id: 'leads', key: K.LEADS, label: 'Lead', plural: 'Leads', numberPrefix: 'LEAD', idPrefix: 'lead', basePath: '/sales/leads', auditModule: 'crm',
  description: 'Prospective customers from calls, referrals, exhibitions and the website — qualify, convert to opportunities or close as lost.',
  permissions: { view: 'sales.leads.view', create: 'sales.leads.create', edit: ['sales.leads.edit', 'sales.leads.manage'] },
  scope: { own: ['ownerId'] }, ownerEditOnly: true,
  statuses: { NEW: S('New', 'info'), CONTACTED: S('Contacted', 'brand'), QUALIFIED: S('Qualified', 'accent'), CONVERTED: S('Converted', 'success'), LOST: S('Lost', 'danger') },
  initialStatus: 'NEW', editableIn: ['NEW', 'CONTACTED', 'QUALIFIED'], titleField: 'company',
  initialValues: (c) => ({ ...ownerDefault(c), source: 'Phone call', segment: 'Retail', nextFollowUp: dayjs().add(2, 'day').format('YYYY-MM-DD') }),
  fields: [
    { key: 'company', label: 'Company / outlet', type: 'text', required: true },
    { key: 'contactName', label: 'Contact person', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'phone', required: true },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'segment', label: 'Segment', type: 'select', options: SEGMENTS, required: true },
    { key: 'source', label: 'Source', type: 'select', options: ['Phone call', 'Referral', 'Exhibition', 'Website', 'Walk-in', 'WhatsApp', 'Field visit'], required: true },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'estimatedValue', label: 'Estimated monthly value', type: 'money', min: 0 },
    { key: 'ownerId', label: 'Owner', type: 'lookup', lookup: 'users', required: true },
    { key: 'nextFollowUp', label: 'Next follow-up', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  listColumns: ['company', 'contactName', 'segment', 'source', 'ownerId', 'estimatedValue', 'nextFollowUp'],
  searchFields: ['contactName', 'phone', 'city'], filters: ['segment', 'ownerId'],
  kpis: (rs) => [...statusKpis(rs, leads, ['NEW', 'QUALIFIED', 'CONVERTED'], Users), { label: 'Pipeline value (open)', value: money(sum(rs.filter((r) => !['CONVERTED', 'LOST'].includes(r.status)), (r) => r.estimatedValue)) }],
  actions: [
    { id: 'contact', label: 'Mark contacted', from: ['NEW'], to: 'CONTACTED', permission: ['sales.leads.edit', 'sales.leads.manage'] },
    { id: 'qualify', label: 'Qualify', from: ['NEW', 'CONTACTED'], to: 'QUALIFIED', permission: ['sales.leads.edit', 'sales.leads.manage'] },
    {
      id: 'convert', label: 'Convert to opportunity', from: ['QUALIFIED'], to: 'CONVERTED', permission: 'sales.opportunities.manage',
      effect: (rec, { user }) => {
        const r = createRecord('opportunities', { title: `${rec.company} — first order`, leadId: rec.id, value: rec.estimatedValue || 0, probability: 40, expectedClose: dayjs().add(30, 'day').format('YYYY-MM-DD'), ownerId: rec.ownerId, segment: rec.segment, notes: rec.notes || '' }, user)
        return r.ok ? { patch: { opportunityId: r.record.id, opportunityNumber: r.record.number } } : r
      },
    },
    { id: 'lose', label: 'Mark lost', from: ['NEW', 'CONTACTED', 'QUALIFIED'], to: 'LOST', permission: ['sales.leads.edit', 'sales.leads.manage'], note: 'required', tone: 'danger' },
  ],
  related: (r) => [r.opportunityId && { label: `Opportunity ${r.opportunityNumber}`, to: `/sales/opportunities/${r.opportunityId}` }],
}

export const opportunities = {
  id: 'opportunities', key: K.OPPORTUNITIES, label: 'Opportunity', plural: 'Opportunities', numberPrefix: 'OPP', idPrefix: 'opp', basePath: '/sales/opportunities', auditModule: 'crm',
  description: 'Sales pipeline by stage with value and probability. Won opportunities link to the customer and first order.',
  permissions: { view: 'sales.opportunities.view', create: 'sales.opportunities.manage', edit: 'sales.opportunities.manage' },
  scope: { own: ['ownerId'] }, ownerEditOnly: true,
  statuses: { PROSPECTING: S('Prospecting', 'info'), PROPOSAL: S('Proposal sent', 'brand'), NEGOTIATION: S('Negotiation', 'warning'), WON: S('Won', 'success'), LOST: S('Lost', 'danger') },
  initialStatus: 'PROSPECTING', editableIn: ['PROSPECTING', 'PROPOSAL', 'NEGOTIATION'],
  initialValues: (c) => ({ ...ownerDefault(c), probability: 25, expectedClose: dayjs().add(30, 'day').format('YYYY-MM-DD') }),
  fields: [
    { key: 'title', label: 'Opportunity', type: 'text', required: true, wide: true },
    { key: 'customerId', label: 'Customer (if existing)', type: 'lookup', lookup: 'customers' },
    { key: 'leadId', label: 'Lead', type: 'lookup', lookup: 'module:leads' },
    { key: 'segment', label: 'Segment', type: 'select', options: SEGMENTS },
    { key: 'value', label: 'Value', type: 'money', required: true, min: 0 },
    { key: 'probability', label: 'Probability %', type: 'percent', required: true },
    { key: 'expectedClose', label: 'Expected close', type: 'date', required: true },
    { key: 'ownerId', label: 'Owner', type: 'lookup', lookup: 'users', required: true },
    { key: 'competitor', label: 'Competitor', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  listColumns: ['title', 'customerId', 'value', 'probability', 'expectedClose', 'ownerId'], filters: ['ownerId', 'segment'],
  kpis: (rs) => [
    { label: 'Open pipeline', value: money(sum(rs.filter((r) => !['WON', 'LOST'].includes(r.status)), (r) => r.value)), icon: Target },
    { label: 'Weighted pipeline', value: money(sum(rs.filter((r) => !['WON', 'LOST'].includes(r.status)), (r) => (r.value * r.probability) / 100)) },
    { label: 'Won', value: count(rs, (r) => r.status === 'WON'), filter: { status: 'WON' }, tone: 'success' },
    { label: 'Win rate', value: `${Math.round((count(rs, (r) => r.status === 'WON') / Math.max(1, count(rs, (r) => ['WON', 'LOST'].includes(r.status)))) * 100)}%` },
  ],
  actions: [
    { id: 'proposal', label: 'Proposal sent', from: ['PROSPECTING'], to: 'PROPOSAL', permission: 'sales.opportunities.manage' },
    { id: 'negotiate', label: 'Negotiation', from: ['PROSPECTING', 'PROPOSAL'], to: 'NEGOTIATION', permission: 'sales.opportunities.manage' },
    { id: 'won', label: 'Mark won', from: ['PROSPECTING', 'PROPOSAL', 'NEGOTIATION'], to: 'WON', permission: 'sales.opportunities.manage', effect: () => ({ patch: { probability: 100, closedAt: new Date().toISOString() } }) },
    { id: 'lost', label: 'Mark lost', from: ['PROSPECTING', 'PROPOSAL', 'NEGOTIATION'], to: 'LOST', permission: 'sales.opportunities.manage', note: 'required', tone: 'danger', effect: () => ({ patch: { probability: 0, closedAt: new Date().toISOString() } }) },
  ],
  related: (r) => [r.customerId && { label: 'Customer', to: `/customers/${r.customerId}` }, r.leadId && { label: 'Lead', to: `/sales/leads/${r.leadId}` }, r.customerId && { label: 'Create order', to: `/orders/create?customerId=${r.customerId}` }],
}

export const salesVisits = {
  id: 'sales_visits', key: K.SALES_VISITS, label: 'Sales activity', plural: 'Sales activities', numberPrefix: 'ACT', idPrefix: 'act', basePath: '/sales/activities', auditModule: 'crm',
  description: 'Customer visits, calls and tastings planned and completed by the sales team.',
  permissions: { view: 'sales.activities.view', create: 'sales.activities.manage', edit: 'sales.activities.manage' },
  scope: { own: ['ownerId'] }, ownerEditOnly: true,
  statuses: { PLANNED: S('Planned', 'info'), COMPLETED: S('Completed', 'success'), CANCELLED: S('Cancelled', 'neutral') },
  initialStatus: 'PLANNED', editableIn: ['PLANNED'], titleField: 'purpose',
  initialValues: (c) => ({ ...ownerDefault(c), activityDate: today(), activityType: 'Visit' }),
  fields: [
    { key: 'activityType', label: 'Type', type: 'select', options: ['Visit', 'Call', 'Tasting / sampling', 'Meeting', 'Collection follow-up'], required: true },
    { key: 'customerId', label: 'Customer', type: 'lookup', lookup: 'customers' },
    { key: 'leadId', label: 'Lead', type: 'lookup', lookup: 'module:leads' },
    { key: 'activityDate', label: 'Date', type: 'date', required: true },
    { key: 'purpose', label: 'Purpose', type: 'text', required: true },
    { key: 'ownerId', label: 'Sales person', type: 'lookup', lookup: 'users', required: true },
    { key: 'outcome', label: 'Outcome', type: 'textarea' },
  ],
  validate: (v) => (!v.customerId && !v.leadId ? { customerId: 'Choose a customer or a lead.' } : {}),
  listColumns: ['activityType', 'customerId', 'purpose', 'activityDate', 'ownerId'], filters: ['activityType', 'ownerId'],
  kpis: (rs) => [{ label: 'Planned today', value: count(rs, (r) => r.status === 'PLANNED' && r.activityDate === today()), filter: { status: 'PLANNED' } }, ...statusKpis(rs, salesVisits, ['PLANNED', 'COMPLETED'])],
  actions: [
    { id: 'complete', label: 'Complete', from: ['PLANNED'], to: 'COMPLETED', permission: 'sales.activities.manage', inputs: [{ key: 'outcome', label: 'Outcome', type: 'textarea' }], note: 'none', effect: (rec, { input }) => ({ patch: { outcome: input.values?.outcome || rec.outcome || '' } }) },
    { id: 'cancel', label: 'Cancel', from: ['PLANNED'], to: 'CANCELLED', permission: 'sales.activities.manage', note: 'required', tone: 'secondary' },
  ],
}

export const salesTargets = {
  id: 'sales_targets', key: K.SALES_TARGETS, label: 'Sales target', plural: 'Sales targets', numberPrefix: 'TGT', idPrefix: 'tgt', basePath: '/sales/targets', auditModule: 'salesmgmt',
  description: 'Monthly value targets per sales person. Achievement is calculated live from their orders (drafts, rejected and cancelled orders excluded).',
  permissions: { view: 'sales.targets.view', create: 'sales.commission.manage', edit: 'sales.commission.manage' },
  scope: { own: ['ownerId'] },
  statuses: { ACTIVE: S('Active', 'success'), CLOSED: S('Closed', 'neutral') }, initialStatus: 'ACTIVE', editableIn: ['ACTIVE'],
  initialValues: () => ({ period: dayjs().format('YYYY-MM') }),
  fields: [
    { key: 'ownerId', label: 'Sales person', type: 'lookup', lookup: 'users', required: true },
    { key: 'period', label: 'Month (YYYY-MM)', type: 'text', required: true },
    { key: 'targetValue', label: 'Target value', type: 'money', required: true, min: 1 },
    { key: 'achieved', label: 'Achieved', type: 'money', computed: true, render: (_, r) => money(salesAchieved(r.ownerId, r.period)) },
    { key: 'achievement', label: 'Achievement', type: 'percent', computed: true, render: (_, r) => `${Math.round((salesAchieved(r.ownerId, r.period) / Math.max(1, r.targetValue)) * 100)}%` },
  ],
  validate: (v, ctx) => {
    const e = {}
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(v.period || ''))) e.period = 'Use the format YYYY-MM.'
    if (ctx.list.some((t) => t.id !== ctx.existing?.id && t.ownerId === v.ownerId && t.period === v.period)) e.period = 'This person already has a target for that month.'
    return e
  },
  listColumns: ['ownerId', 'period', 'targetValue', 'achieved', 'achievement'], filters: ['period'],
  actions: [{ id: 'close', label: 'Close period', from: ['ACTIVE'], to: 'CLOSED', permission: 'sales.commission.manage', effect: (r) => ({ patch: { achievedAtClose: salesAchieved(r.ownerId, r.period) } }) }],
}

export const commissionRules = {
  id: 'commission_rules', key: K.COMMISSION_RULES, label: 'Commission rule', plural: 'Commission rules', numberPrefix: 'COM', idPrefix: 'com', basePath: '/sales/commission', auditModule: 'salesmgmt',
  description: 'Commission percentages by segment, paid once the target achievement threshold is reached. Calculated for review only — no payroll posting.',
  permissions: { view: 'sales.targets.view', create: 'sales.commission.manage', edit: 'sales.commission.manage' },
  statuses: { ACTIVE: S('Active', 'success'), INACTIVE: S('Inactive', 'neutral') }, initialStatus: 'ACTIVE', titleField: 'name',
  fields: [
    { key: 'name', label: 'Rule name', type: 'text', required: true },
    { key: 'segment', label: 'Segment', type: 'select', options: ['All', ...SEGMENTS], required: true },
    { key: 'ratePercent', label: 'Commission %', type: 'percent', required: true },
    { key: 'minAchievementPct', label: 'Minimum achievement %', type: 'percent', required: true },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  listColumns: ['name', 'segment', 'ratePercent', 'minAchievementPct'],
  actions: [
    { id: 'deactivate', label: 'Deactivate', from: ['ACTIVE'], to: 'INACTIVE', permission: 'sales.commission.manage', tone: 'secondary' },
    { id: 'activate', label: 'Activate', from: ['INACTIVE'], to: 'ACTIVE', permission: 'sales.commission.manage' },
  ],
}

export const priceLists = {
  id: 'price_lists', key: K.PRICE_LISTS, label: 'Price list', plural: 'Price lists', numberPrefix: 'PL', idPrefix: 'pl', basePath: '/sales/pricing', auditModule: 'salesmgmt',
  description: 'Segment and customer-specific contract prices with validity dates. A price list needs approval by another authorised user before it is active.',
  permissions: { view: 'sales.pricing.view', create: 'sales.pricing.manage', edit: 'sales.pricing.manage' },
  statuses: { DRAFT: S('Draft', 'neutral'), PENDING_APPROVAL: S('Pending approval', 'warning'), ACTIVE: S('Active', 'success'), REJECTED: S('Rejected', 'danger'), INACTIVE: S('Inactive', 'neutral') },
  initialStatus: 'DRAFT', editableIn: ['DRAFT', 'REJECTED'], titleField: 'name',
  initialValues: () => ({ segment: 'HORECA', validFrom: today(), validTo: dayjs().add(6, 'month').format('YYYY-MM-DD'), lines: [] }),
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'segment', label: 'Segment', type: 'select', options: SEGMENTS, required: true },
    { key: 'customerId', label: 'Customer (contract price)', type: 'lookup', lookup: 'customers' },
    { key: 'validFrom', label: 'Valid from', type: 'date', required: true },
    { key: 'validTo', label: 'Valid to', type: 'date', required: true },
    { key: 'lines', label: 'Prices', type: 'lines', required: true, columns: [
      productCol({ fill: (p) => ({ listPrice: p.sellingPrice, price: p.sellingPrice }) }),
      { key: 'listPrice', label: 'List price', type: 'money', span: 2 },
      { key: 'price', label: 'Contract price', type: 'money', required: true, span: 2 },
      { key: 'minQty', label: 'Min qty', type: 'number', span: 1 },
      { key: 'disc', label: 'Discount', type: 'percent', span: 2, computed: (l) => (l.listPrice ? r2(((l.listPrice - l.price) / l.listPrice) * 100) : 0) },
    ] },
  ],
  validate: (v) => {
    const e = {}
    if (v.validFrom && v.validTo && v.validTo < v.validFrom) e.validTo = 'Valid-to must be after valid-from.'
    ;(v.lines || []).forEach((l, i) => {
      const p = recordFor('products', l.productId)
      if (p && p.status !== 'Active') e[`lines.${i}.productId`] = `${p.name} is inactive.`
      if (p && p.maxDiscountPercent !== undefined && l.listPrice && ((l.listPrice - l.price) / l.listPrice) * 100 > Math.max(p.maxDiscountPercent, 15)) e[`lines.${i}.price`] = `Discount on ${p.name} exceeds the authorised limit — reduce it or get pricing approval.`
    })
    return e
  },
  listColumns: ['name', 'segment', 'customerId', 'validFrom', 'validTo'], filters: ['segment'],
  kpis: (rs) => statusKpis(rs, priceLists, ['ACTIVE', 'PENDING_APPROVAL', 'DRAFT'], FileText),
  actions: [
    { id: 'submit', label: 'Submit for approval', from: ['DRAFT', 'REJECTED'], to: 'PENDING_APPROVAL', permission: 'sales.pricing.manage', notify: (r) => ({ title: `Price list ${r.number} awaiting approval`, message: r.name, roles: ['SALES_MANAGER'], link: `/sales/pricing/${r.id}` }) },
    { id: 'approve', label: 'Approve', from: ['PENDING_APPROVAL'], to: 'ACTIVE', permission: 'sales.pricing.approve', noSelf: true, effect: (r, { user }) => ({ patch: { approvedBy: user.id, approvedAt: new Date().toISOString() } }) },
    { id: 'reject', label: 'Reject', from: ['PENDING_APPROVAL'], to: 'REJECTED', permission: 'sales.pricing.approve', note: 'required', tone: 'danger' },
    { id: 'deactivate', label: 'Deactivate', from: ['ACTIVE'], to: 'INACTIVE', permission: 'sales.pricing.manage', tone: 'secondary', note: 'required' },
  ],
}

export const salesReturns = {
  id: 'sales_returns', key: K.SALES_RETURNS, label: 'Sales return', plural: 'Sales returns', numberPrefix: 'SRN', idPrefix: 'srn', basePath: '/sales/returns', auditModule: 'salesmgmt',
  description: 'Customer returns: approve, receive at the hub (resaleable stock goes back through the stock ledger) and credit the customer with a credit note.',
  permissions: { view: 'sales.returns.view', create: 'sales.returns.manage', edit: 'sales.returns.manage' },
  scope: { own: ['ownerId'], customer: 'customerId' },
  statuses: { REQUESTED: S('Requested', 'warning'), APPROVED: S('Approved', 'info'), RECEIVED: S('Received', 'brand'), CREDITED: S('Credited', 'success'), REJECTED: S('Rejected', 'danger') },
  initialStatus: 'REQUESTED', editableIn: ['REQUESTED'],
  initialValues: (c) => ({ ...ownerDefault(c), returnDate: today(), reason: 'Quality issue', lines: [] }),
  fields: [
    { key: 'customerId', label: 'Customer', type: 'lookup', lookup: 'customers', required: true, onChange: (v) => { const c = recordFor('customers', v); return c ? { hubId: c.hubId } : {} } },
    { key: 'orderId', label: 'Original order', type: 'lookup', lookup: 'orders', filter: (o, v) => !v.customerId || o.customerId === v.customerId },
    { key: 'hubId', label: 'Return to hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'returnDate', label: 'Return date', type: 'date', required: true },
    { key: 'reason', label: 'Reason', type: 'select', options: ['Quality issue', 'Short expiry', 'Damaged in transit', 'Wrong product', 'Excess quantity', 'Customer cancelled'], required: true },
    { key: 'ownerId', label: 'Raised by', type: 'lookup', lookup: 'users', readOnly: true, hideInDetail: false },
    { key: 'lines', label: 'Returned items', type: 'lines', required: true, columns: [productCol({ fill: (p) => ({ unitPrice: p.sellingPrice }) }), qtyCol(), { key: 'unitPrice', label: 'Unit price', type: 'money', span: 2 }, { key: 'condition', label: 'Condition', type: 'select', options: ['Resaleable', 'Damaged', 'Expired'], required: true, span: 2 }, amountCol()] },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  compute: (r) => ({ value: linesTotal(r.lines) }),
  computedSummary: ['value'],
  listColumns: ['customerId', 'orderId', 'reason', 'returnDate', 'value'], filters: ['reason'],
  kpis: (rs) => [...statusKpis(rs, salesReturns, ['REQUESTED', 'APPROVED', 'RECEIVED'], Undo2), { label: 'Value credited', value: money(sum(rs.filter((r) => r.status === 'CREDITED'), (r) => r.value)) }],
  actions: [
    { id: 'approve', label: 'Approve return', from: ['REQUESTED'], to: 'APPROVED', permission: 'sales.returns.approve', noSelf: true, notify: (r) => ({ title: `Return ${r.number} approved — receive at hub`, message: `${r.lines.length} line(s)`, roles: ['WAREHOUSE_MANAGER'], link: `/sales/returns/${r.id}` }) },
    { id: 'reject', label: 'Reject', from: ['REQUESTED'], to: 'REJECTED', permission: 'sales.returns.approve', note: 'required', tone: 'danger' },
    { id: 'receive', label: 'Receive at hub', from: ['APPROVED'], to: 'RECEIVED', permission: ['warehouse.receiving.manage', 'inventory.adjustments.manage'], description: 'Resaleable quantities are added back to stock with a Sales Return movement; damaged / expired quantities are not added to sellable stock.', effect: (r) => { const x = receiveSalesReturn(r); return x.ok ? { patch: { receivedAt: new Date().toISOString(), movementNumbers: x.movements } } : x } },
    {
      id: 'credit', label: 'Issue credit note', from: ['RECEIVED'], to: 'CREDITED', permission: ['finance.ar.manage', 'sales.returns.approve'],
      effect: (r, { user }) => {
        const inv = read(K.INVOICES).find((i) => i.orderId === r.orderId && i.status !== 'CANCELLED')
        const c = createRecord('credit_notes', { customerId: r.customerId, invoiceId: inv?.id || '', salesReturnId: r.id, date: today(), reason: `Sales return ${r.number} — ${r.reason}`, amount: r.value }, user)
        return c.ok ? { patch: { creditNoteId: c.record.id, creditNoteNumber: c.record.number } } : c
      },
    },
  ],
  related: (r) => [r.orderId && { label: 'Order', to: `/orders/${r.orderId}` }, r.creditNoteId && { label: `Credit note ${r.creditNoteNumber}`, to: `/finance/credit-notes/${r.creditNoteId}` }],
}

export const orderChanges = {
  id: 'order_changes', key: K.ORDER_CHANGE_REQUESTS, label: 'Order change request', plural: 'Order change requests', numberPrefix: 'OCR', idPrefix: 'ocr', basePath: '/sales/order-changes', auditModule: 'salesmgmt',
  description: 'Requests to cancel an order or change its delivery date, address or instructions. Approval applies the change to the order itself (with an order timeline entry).',
  permissions: { view: 'sales.orderchanges.request', create: 'sales.orderchanges.request', edit: 'sales.orderchanges.request' },
  scope: { own: ['ownerId'] },
  statuses: { PENDING: S('Pending', 'warning'), APPROVED: S('Approved & applied', 'success'), REJECTED: S('Rejected', 'danger') },
  initialStatus: 'PENDING', editableIn: ['PENDING'],
  initialValues: (c) => ({ ...ownerDefault(c), changeType: 'DELIVERY_DATE' }),
  fields: [
    { key: 'orderId', label: 'Order', type: 'lookup', lookup: 'orders', required: true, filter: (o) => ['DRAFT', 'SUBMITTED', 'RETURNED', 'APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH'].includes(o.orderStatus) },
    { key: 'changeType', label: 'Change', type: 'select', required: true, options: [{ value: 'DELIVERY_DATE', label: 'Delivery date' }, { value: 'ADDRESS', label: 'Delivery address' }, { value: 'INSTRUCTIONS', label: 'Delivery instructions' }, { value: 'CANCELLATION', label: 'Cancel order' }] },
    { key: 'requestedValue', label: 'New value (date YYYY-MM-DD, address or instructions)', type: 'text', hideIf: (v) => v.changeType === 'CANCELLATION', wide: true },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true },
    { key: 'ownerId', label: 'Requested by', type: 'lookup', lookup: 'users', readOnly: true },
  ],
  validate: (v) => (v.changeType !== 'CANCELLATION' && !String(v.requestedValue || '').trim() ? { requestedValue: 'Enter the new value.' } : {}),
  listColumns: ['orderId', 'changeType', 'requestedValue', 'ownerId'], filters: ['changeType'],
  kpis: (rs) => statusKpis(rs, orderChanges, ['PENDING', 'APPROVED', 'REJECTED']),
  actions: [
    { id: 'approve', label: 'Approve & apply', from: ['PENDING'], to: 'APPROVED', permission: 'sales.orderchanges.approve', noSelf: true, effect: (r) => { const x = applyOrderChange(r); return x.ok ? { patch: { appliedAt: new Date().toISOString() } } : x } },
    { id: 'reject', label: 'Reject', from: ['PENDING'], to: 'REJECTED', permission: 'sales.orderchanges.approve', note: 'required', tone: 'danger' },
  ],
  related: (r) => [{ label: 'Order', to: `/orders/${r.orderId}` }],
}

const SLA_HOURS = { Critical: 4, High: 8, Normal: 24, Low: 72 }
export const serviceTickets = {
  id: 'service_tickets', key: K.SERVICE_TICKETS, label: 'Service ticket', plural: 'Service tickets', numberPrefix: 'TKT', idPrefix: 'tkt', basePath: '/service/tickets', auditModule: 'service',
  description: 'Complaints, delivery issues, quality issues and invoice queries — with SLA due time by priority, assignment, escalation and resolution.',
  permissions: { view: ['service.tickets.view', 'customer.app'], create: ['service.tickets.manage', 'customer.app'], edit: 'service.tickets.manage' },
  scope: { customer: 'customerId' },
  statuses: { OPEN: S('Open', 'warning'), IN_PROGRESS: S('In progress', 'info'), ESCALATED: S('Escalated', 'danger'), RESOLVED: S('Resolved', 'success'), CLOSED: S('Closed', 'neutral') },
  initialStatus: 'OPEN', editableIn: ['OPEN', 'IN_PROGRESS', 'ESCALATED'], titleField: 'subject',
  initialValues: ({ user }) => ({ priority: 'Normal', category: 'Complaint', channel: user?.customerId ? 'Customer portal' : 'Phone', customerId: user?.customerId || '', __customerLock: user?.customerId || '' }),
  fields: [
    { key: 'subject', label: 'Subject', type: 'text', required: true, wide: true },
    { key: 'customerId', label: 'Customer', type: 'lookup', lookup: 'customers', required: true, filter: (c, v) => !v.__customerLock || c.id === v.__customerLock },
    { key: 'orderId', label: 'Order', type: 'lookup', lookup: 'orders', filter: (o, v) => !v.customerId || o.customerId === v.customerId },
    { key: 'category', label: 'Category', type: 'select', options: ['Complaint', 'Delivery issue', 'Quality issue', 'Invoice query', 'Product request', 'Other'], required: true },
    { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES, required: true },
    { key: 'channel', label: 'Channel', type: 'select', options: ['Phone', 'Email', 'WhatsApp', 'Customer portal', 'Sales visit'], required: true },
    { key: 'assignedTo', label: 'Assigned to', type: 'lookup', lookup: 'users', hideIf: (v) => Boolean(v.__customerLock) },
    { key: 'slaDueAt', label: 'SLA due', type: 'datetime', readOnly: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'resolution', label: 'Resolution', type: 'textarea', readOnly: true },
  ],
  validate: (v, ctx) => (ctx.user?.customerId && v.customerId !== ctx.user.customerId ? { customerId: 'You can only raise tickets for your own account.' } : {}),
  compute: (r) => ({ slaDueAt: r.slaDueAt && r.priority === r._slaPriority ? r.slaDueAt : dayjs(r.createdAt || undefined).add(SLA_HOURS[r.priority] || 24, 'hour').toISOString(), _slaPriority: r.priority, slaBreached: !['RESOLVED', 'CLOSED'].includes(r.status) && dayjs().isAfter(dayjs(r.slaDueAt || undefined)) }),
  listColumns: ['subject', 'customerId', 'category', 'priority', 'assignedTo', 'slaDueAt'], filters: ['category', 'priority'],
  filterLabels: { overdue: 'SLA' },
  kpis: (rs) => [...statusKpis(rs, serviceTickets, ['OPEN', 'IN_PROGRESS', 'ESCALATED'], Ticket), { label: 'SLA breached (open)', value: count(rs, (r) => !['RESOLVED', 'CLOSED'].includes(r.status) && dayjs().isAfter(dayjs(r.slaDueAt))), tone: 'danger' }],
  actions: [
    { id: 'start', label: 'Start work', from: ['OPEN', 'ESCALATED'], to: 'IN_PROGRESS', permission: 'service.tickets.manage', inputs: [{ key: 'assignedTo', label: 'Assign to', type: 'lookup', lookup: 'users' }], effect: (r, { input, user }) => ({ patch: { assignedTo: input.values?.assignedTo || r.assignedTo || user.id } }) },
    { id: 'escalate', label: 'Escalate', from: ['OPEN', 'IN_PROGRESS'], to: 'ESCALATED', permission: 'service.tickets.manage', note: 'required', tone: 'danger', notify: (r) => ({ title: `Ticket ${r.number} escalated`, message: r.subject, roles: ['SALES_MANAGER', 'ADMIN'], link: `/service/tickets/${r.id}`, type: 'warning' }) },
    { id: 'resolve', label: 'Resolve', from: ['OPEN', 'IN_PROGRESS', 'ESCALATED'], to: 'RESOLVED', permission: 'service.tickets.manage', note: 'required', effect: (r, { input }) => ({ patch: { resolution: input.note, resolvedAt: new Date().toISOString() } }) },
    { id: 'close', label: 'Close', from: ['RESOLVED'], to: 'CLOSED', permission: ['service.tickets.manage', 'customer.app'] },
    { id: 'reopen', label: 'Reopen', from: ['RESOLVED'], to: 'OPEN', permission: ['service.tickets.manage', 'customer.app'], note: 'required', tone: 'secondary' },
  ],
  related: (r) => [r.orderId && { label: 'Order', to: `/orders/${r.orderId}` }, { label: 'Customer', to: `/customers/${r.customerId}` }],
}

export const horecaAccounts = {
  id: 'horeca_accounts', key: K.HORECA_ACCOUNTS, label: 'HORECA account', plural: 'HORECA accounts', numberPrefix: 'HRC', idPrefix: 'hrc', basePath: '/horeca', auditModule: 'horeca',
  description: 'HORECA profile for an existing customer: outlet type, chef / purchasing contacts, contract period, delivery window and monthly volume. The customer record itself is not duplicated.',
  permissions: { view: 'horeca.view', create: 'horeca.manage', edit: 'horeca.manage' },
  scope: { own: ['accountManagerId'] },
  statuses: { DRAFT: S('Draft', 'neutral'), PENDING_APPROVAL: S('Contract pending approval', 'warning'), ACTIVE: S('Active contract', 'success'), SUSPENDED: S('Suspended', 'danger'), EXPIRED: S('Expired', 'neutral') },
  initialStatus: 'DRAFT', editableIn: ['DRAFT', 'SUSPENDED'],
  initialValues: ({ user }) => ({ accountManagerId: user?.id, outletType: 'Hotel', contractStart: today(), contractEnd: dayjs().add(1, 'year').format('YYYY-MM-DD'), deliveryWindow: '06:00–09:00' }),
  fields: [
    { key: 'customerId', label: 'Customer', type: 'lookup', lookup: 'customers', required: true },
    { key: 'outletType', label: 'Outlet type', type: 'select', options: ['Hotel', 'Restaurant', 'Cafe', 'Catering', 'Cloud kitchen', 'QSR chain'], required: true },
    { key: 'outlets', label: 'Outlets', type: 'integer', min: 1 },
    { key: 'chefContact', label: 'Executive chef', type: 'text' },
    { key: 'purchaseContact', label: 'Purchasing contact', type: 'text' },
    { key: 'accountManagerId', label: 'Account manager', type: 'lookup', lookup: 'users', required: true },
    { key: 'priceListId', label: 'Contract price list', type: 'lookup', lookup: 'module:price_lists' },
    { key: 'contractStart', label: 'Contract start', type: 'date', required: true },
    { key: 'contractEnd', label: 'Contract end', type: 'date', required: true },
    { key: 'deliveryWindow', label: 'Delivery window', type: 'select', options: ['05:00–07:00', '06:00–09:00', '09:00–12:00', '14:00–17:00', 'Night (22:00–02:00)'], required: true },
    { key: 'monthlyVolumeTarget', label: 'Monthly volume target', type: 'money', min: 0 },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  validate: (v, ctx) => {
    const e = {}
    if (ctx.list.some((a) => a.id !== ctx.existing?.id && a.customerId === v.customerId && a.status !== 'EXPIRED')) e.customerId = 'This customer already has a HORECA account.'
    const c = recordFor('customers', v.customerId)
    if (c && c.status !== 'Active') e.customerId = `${c.name} is ${String(c.status).toLowerCase()}.`
    if (v.contractEnd && v.contractStart && v.contractEnd <= v.contractStart) e.contractEnd = 'Contract end must be after the start.'
    return e
  },
  listColumns: ['customerId', 'outletType', 'accountManagerId', 'deliveryWindow', 'contractEnd', 'monthlyVolumeTarget'], filters: ['outletType', 'accountManagerId'],
  kpis: (rs) => [...statusKpis(rs, horecaAccounts, ['ACTIVE', 'PENDING_APPROVAL']), { label: 'Contracts ending ≤ 60 days', value: count(rs, (r) => r.status === 'ACTIVE' && dayjs(r.contractEnd).diff(dayjs(), 'day') <= 60), tone: 'warning' }, { label: 'Monthly volume target', value: money(sum(rs.filter((r) => r.status === 'ACTIVE'), (r) => r.monthlyVolumeTarget)) }],
  actions: [
    { id: 'submit', label: 'Submit contract', from: ['DRAFT'], to: 'PENDING_APPROVAL', permission: 'horeca.manage' },
    { id: 'approve', label: 'Approve contract', from: ['PENDING_APPROVAL'], to: 'ACTIVE', permission: 'horeca.contracts.approve', noSelf: true },
    { id: 'return', label: 'Return to draft', from: ['PENDING_APPROVAL'], to: 'DRAFT', permission: 'horeca.contracts.approve', note: 'required', tone: 'secondary' },
    { id: 'suspend', label: 'Suspend', from: ['ACTIVE'], to: 'SUSPENDED', permission: 'horeca.contracts.approve', note: 'required', tone: 'danger' },
    { id: 'reactivate', label: 'Reactivate', from: ['SUSPENDED'], to: 'PENDING_APPROVAL', permission: 'horeca.manage' },
  ],
  related: (r) => [{ label: 'Customer', to: `/customers/${r.customerId}` }, { label: 'Standing orders', to: `/horeca/templates?customerId=${r.customerId}` }, { label: 'Create order', to: `/orders/create?customerId=${r.customerId}` }],
}

export const orderTemplates = {
  id: 'order_templates', key: K.ORDER_TEMPLATES, label: 'Standing order', plural: 'Standing orders', numberPrefix: 'TPL', idPrefix: 'tpl', basePath: '/horeca/templates', auditModule: 'horeca',
  description: 'Recurring order templates for HORECA and key accounts. "Create order" makes a normal draft order in Order Management for review and submission.',
  permissions: { view: 'horeca.view', create: 'horeca.manage', edit: 'horeca.manage' },
  filters: ['customerId', 'frequency'],
  statuses: { ACTIVE: S('Active', 'success'), PAUSED: S('Paused', 'neutral') }, initialStatus: 'ACTIVE', titleField: 'name',
  initialValues: ({ params }) => ({ frequency: 'Weekly', deliveryDay: 'Monday', customerId: params?.get('customerId') || '', lines: [] }),
  fields: [
    { key: 'name', label: 'Template name', type: 'text', required: true },
    { key: 'customerId', label: 'Customer', type: 'lookup', lookup: 'customers', required: true },
    { key: 'frequency', label: 'Frequency', type: 'select', options: ['Daily', 'Twice weekly', 'Weekly', 'Fortnightly', 'Monthly'], required: true },
    { key: 'deliveryDay', label: 'Delivery day', type: 'select', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Every day'], required: true },
    { key: 'lastOrderNumber', label: 'Last order', type: 'text', readOnly: true },
    { key: 'lines', label: 'Items', type: 'lines', required: true, columns: [productCol({ filter: (p) => p.status === 'Active' }), qtyCol()] },
  ],
  listColumns: ['name', 'customerId', 'frequency', 'deliveryDay', 'lastOrderNumber'],
  actions: [
    { id: 'order', label: 'Create order', from: ['ACTIVE'], permission: 'orders.create', note: 'none', description: 'Creates a draft order with these items for the customer. Open it in Order Management to check stock and submit.', effect: (r, { user }) => { const x = orderFromTemplate(r, user); return x.ok ? { patch: { lastOrderId: x.record.id, lastOrderNumber: 'Draft created', lastOrderAt: new Date().toISOString() } } : x } },
    { id: 'pause', label: 'Pause', from: ['ACTIVE'], to: 'PAUSED', permission: 'horeca.manage', tone: 'secondary' },
    { id: 'resume', label: 'Resume', from: ['PAUSED'], to: 'ACTIVE', permission: 'horeca.manage' },
  ],
  related: (r) => [r.lastOrderId && { label: 'Last draft order', to: `/orders/${r.lastOrderId}` }, { label: 'Customer', to: `/customers/${r.customerId}` }],
}

export const SALES_MODULES = [leads, opportunities, salesVisits, salesTargets, commissionRules, priceLists, salesReturns, orderChanges, serviceTickets, horecaAccounts, orderTemplates]
