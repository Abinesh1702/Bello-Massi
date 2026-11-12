/**
 * Enterprise expansion demo data (data v9). Built from the base data that exists (fresh seed or the live snapshot
 * during migration), so every reference points at a real customer, product, hub, order, invoice, vehicle or user.
 * Only records whose references exist are created. Amounts are prototype values; finance figures shown in the app
 * are always calculated from these records.
 */
import dayjs from 'dayjs'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { buildOpeningBatches } from './batchSeed'

/* ---------- Organization additions (17 departments, designations) ---------- */
export const ENTERPRISE_DEPARTMENTS = [
  ['dep-horeca', 'HRC', 'HORECA Sales', 'bu-food', 'br-dxb'], ['dep-vansales', 'VAN', 'Van Sales', 'bu-food', 'br-dxb'], ['dep-procurement', 'PRC', 'Procurement', 'bu-shared', 'br-dxb'],
  ['dep-import', 'IMX', 'Import & Export', 'bu-shared', 'br-dxb'], ['dep-inventory', 'INV', 'Inventory Control', 'bu-cold', 'br-ind'], ['dep-fleet', 'FLT', 'Fleet Management', 'bu-cold', 'br-ind'],
  ['dep-drivers', 'DRV', 'Drivers', 'bu-cold', 'br-ind'], ['dep-hr', 'HRM', 'Human Resources', 'bu-shared', 'br-dxb'], ['dep-operations', 'OPS', 'Operations', 'bu-cold', 'br-dxb'], ['dep-management', 'MGT', 'Management', 'bu-shared', 'br-dxb'],
]
export const ENTERPRISE_DESIGNATIONS = [
  ['des-ceo', 'CEO', 'Chief Executive Officer', 'dep-management', 'Executive'], ['des-ops-manager', 'OPM', 'Operations Manager', 'dep-operations', 'Manager'],
  ['des-horeca-exec', 'HSE', 'HORECA Sales Executive', 'dep-horeca', 'Staff'], ['des-van-exec', 'VSE', 'Van Sales Executive', 'dep-vansales', 'Staff'],
  ['des-proc-manager', 'PRM', 'Procurement Manager', 'dep-procurement', 'Manager'], ['des-proc-exec', 'PRE', 'Procurement Executive', 'dep-procurement', 'Staff'],
  ['des-import-exec', 'IME', 'Import Executive', 'dep-import', 'Staff'], ['des-wh-exec', 'WHE', 'Warehouse Executive', 'dep-warehouse', 'Staff'],
  ['des-qa-inspector', 'QAI', 'QA Inspector', 'dep-qa', 'Staff'], ['des-fleet-manager', 'FLM', 'Fleet Manager', 'dep-fleet', 'Manager'],
  ['des-fin-manager', 'FIM', 'Finance Manager', 'dep-finance', 'Manager'], ['des-accountant', 'ACC', 'Accountant', 'dep-finance', 'Staff'],
  ['des-hr-manager', 'HRM', 'HR Manager', 'dep-hr', 'Manager'], ['des-hr-exec', 'HRE', 'HR Executive', 'dep-hr', 'Staff'],
]
export const mergeOrganization = (org, now = dayjs()) => {
  if (!org) return org
  const at = now.toISOString()
  const deps = [...(org.departments || [])]
  ENTERPRISE_DEPARTMENTS.forEach(([id, code, name, bu, br]) => { if (!deps.some((d) => d.id === id || d.name === name)) deps.push({ id, code, name, status: 'active', description: 'Added with the enterprise departments.', businessUnitId: bu, branchId: br, createdAt: at, updatedAt: at }) })
  const des = [...(org.designations || [])]
  ENTERPRISE_DESIGNATIONS.forEach(([id, code, name, dep, level]) => { if (!des.some((d) => d.id === id)) des.push({ id, code, name, status: 'active', description: '', departmentId: dep, level, createdAt: at, updatedAt: at }) })
  return deps.length === (org.departments || []).length && des.length === (org.designations || []).length ? org : { ...org, departments: deps, designations: des }
}

/* ---------- Demo users added in v9 (published demo credentials) ---------- */
export const ENTERPRISE_DEMO_CREDENTIALS = [
  { id: 'u-ceo', username: 'ceo', email: 'ceo@bellomassi.demo', password: 'Ceo@123', role: 'CEO', name: 'Khalid Al Suwaidi', title: 'Chief Executive Officer', color: '#111827', phone: '+971 50 100 2001', hubId: null, department: 'dep-management', designation: 'des-ceo', employeeId: 'EMP-0101' },
  { id: 'u-opsmgr', username: 'operations', email: 'operations@bellomassi.demo', password: 'Ops@123', role: 'OPERATIONS_DIRECTOR', name: 'Sanjay Pillai', title: 'Operations Manager', color: '#0F766E', phone: '+971 50 100 2002', hubId: 'hub-che', department: 'dep-operations', designation: 'des-ops-manager', employeeId: 'EMP-0102' },
  { id: 'u-horeca', username: 'horeca', email: 'horeca@bellomassi.demo', password: 'Horeca@123', role: 'HORECA_SALES_EXEC', name: 'Meera Krishnan', title: 'HORECA Sales Executive', color: '#BE185D', phone: '+91 98400 12003', hubId: 'hub-che', department: 'dep-horeca', designation: 'des-horeca-exec', employeeId: 'EMP-0103' },
  { id: 'u-vansales', username: 'vansales', email: 'vansales@bellomassi.demo', password: 'Van@123', role: 'VAN_SALES_EXEC', name: 'Rahul Das', title: 'Van Sales Executive', color: '#A16207', phone: '+91 98400 12004', hubId: 'hub-che', department: 'dep-vansales', designation: 'des-van-exec', employeeId: 'EMP-0104' },
  { id: 'u-procmgr', username: 'procurement', email: 'procurement@bellomassi.demo', password: 'Procure@123', role: 'PROCUREMENT_MANAGER', name: 'Nadia Farouk', title: 'Procurement Manager', color: '#1D4ED8', phone: '+971 50 100 2005', hubId: null, department: 'dep-procurement', designation: 'des-proc-manager', employeeId: 'EMP-0105' },
  { id: 'u-procexec', username: 'buyer', email: 'buyer@bellomassi.demo', password: 'Buyer@123', role: 'PROCUREMENT_EXEC', name: 'Vikram Shetty', title: 'Procurement Executive', color: '#2563EB', phone: '+971 50 100 2006', hubId: null, department: 'dep-procurement', designation: 'des-proc-exec', employeeId: 'EMP-0106' },
  { id: 'u-import', username: 'import', email: 'import@bellomassi.demo', password: 'Import@123', role: 'IMPORT_EXEC', name: 'Omar Haddad', title: 'Import Executive', color: '#0E7490', phone: '+971 50 100 2007', hubId: null, department: 'dep-import', designation: 'des-import-exec', employeeId: 'EMP-0107' },
  { id: 'u-whexec', username: 'whexec', email: 'whexec@bellomassi.demo', password: 'Whexec@123', role: 'WAREHOUSE_EXEC', name: 'Prakash Nair', title: 'Warehouse Executive — Chennai', color: '#0369A1', phone: '+91 98400 12008', hubId: 'hub-che', department: 'dep-warehouse', designation: 'des-wh-exec', employeeId: 'EMP-0108' },
  { id: 'u-qainsp', username: 'qainspector', email: 'qainspector@bellomassi.demo', password: 'Inspect@123', role: 'QA_INSPECTOR', name: 'Aisha Rahman', title: 'QA Inspector', color: '#9F1239', phone: '+91 98400 12009', hubId: 'hub-che', department: 'dep-qa', designation: 'des-qa-inspector', employeeId: 'EMP-0109' },
  { id: 'u-fleet', username: 'fleet', email: 'fleet@bellomassi.demo', password: 'Fleet@123', role: 'FLEET_MANAGER', name: 'George Thomas', title: 'Fleet Manager', color: '#4D7C0F', phone: '+91 98400 12010', hubId: 'hub-che', department: 'dep-fleet', designation: 'des-fleet-manager', employeeId: 'EMP-0110' },
  { id: 'u-finmgr', username: 'financemanager', email: 'financemanager@bellomassi.demo', password: 'FinMgr@123', role: 'FINANCE_MANAGER', name: 'Rania Saleh', title: 'Finance Manager', color: '#92400E', phone: '+971 50 100 2011', hubId: null, department: 'dep-finance', designation: 'des-fin-manager', employeeId: 'EMP-0111' },
  { id: 'u-accountant', username: 'accountant', email: 'accountant@bellomassi.demo', password: 'Account@123', role: 'ACCOUNTANT', name: 'Deepa Menon', title: 'Accountant', color: '#B45309', phone: '+971 50 100 2012', hubId: null, department: 'dep-finance', designation: 'des-accountant', employeeId: 'EMP-0112' },
  { id: 'u-hrmgr', username: 'hr', email: 'hr@bellomassi.demo', password: 'Hr@123', role: 'HR_MANAGER', name: 'Sara Al Hashimi', title: 'HR Manager', color: '#7C3AED', phone: '+971 50 100 2013', hubId: null, department: 'dep-hr', designation: 'des-hr-manager', employeeId: 'EMP-0113' },
  { id: 'u-hrexec', username: 'hrexec', email: 'hrexec@bellomassi.demo', password: 'HrExec@123', role: 'HR_EXEC', name: 'Lina Joseph', title: 'HR Executive', color: '#6D28D9', phone: '+971 50 100 2014', hubId: null, department: 'dep-hr', designation: 'des-hr-exec', employeeId: 'EMP-0114' },
]

export const ENTERPRISE_SUPPLIERS = [
  { id: 'sup-04', name: 'Gulf Seafood Trading LLC', leadTimeDays: 12, minOrderValue: 40000, categories: ['Frozen Food'], contactEmail: 'sales@gulfseafood.demo', contactPhone: '+971 4 555 0400', country: 'United Arab Emirates' },
  { id: 'sup-05', name: 'Emirates Packaging Industries', leadTimeDays: 5, minOrderValue: 8000, categories: ['Consumables'], contactEmail: 'orders@emiratespack.demo', contactPhone: '+971 6 555 0500', country: 'United Arab Emirates' },
  { id: 'sup-06', name: 'Rio Verde Poultry Exports', leadTimeDays: 28, minOrderValue: 120000, categories: ['Frozen Food'], contactEmail: 'export@rioverde.demo', contactPhone: '+55 11 5550 0600', country: 'Brazil' },
]
export const mergeSuppliers = (fs) => {
  if (!fs || !Array.isArray(fs.suppliers)) return fs
  const add = ENTERPRISE_SUPPLIERS.filter((s) => !fs.suppliers.some((x) => x.id === s.id))
  return add.length ? { ...fs, suppliers: [...fs.suppliers, ...add] } : fs
}

/* ---------- helpers ---------- */
const meta = (now, ageDays, by = 'system', byName = 'System (demo seed)') => {
  const at = now.subtract(ageDays, 'day').toISOString()
  return { createdAt: at, createdBy: by, createdByName: byName, updatedAt: at, updatedBy: by }
}
const hist = (now, ageDays, steps) => steps.map(([action, from, to, byName, d = 0, note = '']) => ({ at: now.subtract(Math.max(0, ageDays - d), 'day').toISOString(), by: 'system', byName, action, from, to, note }))
const num = (prefix, year, n) => `${prefix}-${year}-${String(n).padStart(5, '0')}`
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100

/* ---------- Locations ---------- */
const buildLocations = (hubs, now) => {
  const out = []
  const at = now.subtract(60, 'day').toISOString()
  const base = { history: [], createdAt: at, createdBy: 'system', createdByName: 'System (demo seed)', updatedAt: at, updatedBy: 'system', status: 'ACTIVE' }
  hubs.forEach((h) => {
    ;[['FRZ', 'Frozen'], ['CHL', 'Chilled'], ['AMB', 'Ambient']].forEach(([z, type]) => {
      const zc = `${h.code}-${z}`
      out.push({ ...base, id: `loc-${zc}`.toLowerCase(), code: zc, hubId: h.id, level: 'ZONE', parentCode: '', storageType: type, capacityPallets: type === 'Frozen' ? 200 : 120 })
      const ac = `${zc}-A`
      out.push({ ...base, id: `loc-${ac}`.toLowerCase(), code: ac, hubId: h.id, level: 'AISLE', parentCode: zc, storageType: type, capacityPallets: 80 })
      ;['01', '02'].forEach((r) => {
        const rc = `${ac}-${r}`
        out.push({ ...base, id: `loc-${rc}`.toLowerCase(), code: rc, hubId: h.id, level: 'RACK', parentCode: ac, storageType: type, capacityPallets: 24 })
        const sc = `${rc}-1`
        out.push({ ...base, id: `loc-${sc}`.toLowerCase(), code: sc, hubId: h.id, level: 'SHELF', parentCode: rc, storageType: type, capacityPallets: 8 })
        ;['B1', 'B2'].forEach((b) => { const bc = `${sc}-${b}`; out.push({ ...base, id: `loc-${bc}`.toLowerCase(), code: bc, hubId: h.id, level: 'BIN', parentCode: sc, storageType: type, capacityPallets: 4 }) })
      })
    })
  })
  return out
}

/**
 * Build every enterprise collection from base data.
 * data: { products, hubs, inventory, movements, customers, orders, invoices, vehicles, drivers, users, receipts, dispatches }
 */
export const buildEnterpriseData = (data, now = dayjs()) => {
  const Y = now.year()
  const P = Object.fromEntries((data.products || []).map((p) => [p.id, p]))
  const C = Object.fromEntries((data.customers || []).map((c) => [c.id, c]))
  const H = Object.fromEntries((data.hubs || []).map((h) => [h.id, h]))
  const U = Object.fromEntries((data.users || []).map((u) => [u.id, u]))
  const V = Object.fromEntries((data.vehicles || []).map((v) => [v.id, v]))
  const D = Object.fromEntries((data.drivers || []).map((d) => [d.id, d]))
  const has = (map, id) => Boolean(id && map[id])
  const uname = (id) => U[id]?.name || 'System (demo seed)'
  const price = (pid) => P[pid]?.purchasePrice || 1000
  const sell = (pid) => P[pid]?.sellingPrice || 1500

  const locations = buildLocations(data.hubs || [], now)
  const { batches, state } = buildOpeningBatches({ inventory: data.inventory || [], products: data.products || [], movements: data.movements || [], locations, now })
  // Put a few lots on QA hold / quarantine so QA, recall and FEFO have real cases
  // Put a few lots on QA hold so QA, recall and FEFO have real cases — only where the hub keeps enough releasable
  // stock for every open order, so existing demo flows (consolidation, dispatch) are not starved
  const demand = {}
  ;(data.orders || []).filter((o) => ['SUBMITTED', 'APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH'].includes(o.orderStatus)).forEach((o) => (o.items || []).forEach((it) => { demand[`${it.productId}|${o.hubId}`] = (demand[`${it.productId}|${o.hubId}`] || 0) + (Number(it.orderedQuantity) || 0) }))
  const invOf = Object.fromEntries((data.inventory || []).map((r) => [`${r.productId}|${r.hubId}`, r]))
  const heldSoFar = {}
  const qaHeld = []
  batches.forEach((b, i) => {
    const k = `${b.productId}|${b.hubId}`
    const r = invOf[k]
    const spare = r ? (r.totalQuantity - (r.reservedQuantity || 0) - (r.damagedQuantity || 0) - (heldSoFar[k] || 0) - b.quantity) - (demand[k] || 0) - (r.reorderLevel || 0) : -1
    if (i % 23 === 5 && spare >= 0) {
      heldSoFar[k] = (heldSoFar[k] || 0) + b.quantity
      b.qaStatus = 'QA_HOLD'; b.qaHistory = [{ at: now.subtract(1, 'day').toISOString(), by: 'Fatima Sheikh', from: 'AVAILABLE', to: 'QA_HOLD', reason: 'Seal damage seen at cycle count — awaiting inspection', source: 'QA' }]; qaHeld.push(b) }
  })

  /* CRM */
  const leads = [
    ['Spice Route Restaurants', 'Anand Kumar', '+91 98410 55101', 'HORECA', 'Exhibition', 'Chennai', 180000, 'QUALIFIED', 'u-salesman'],
    ['FreshMart Supermarkets', 'Leela Iyer', '+91 98410 55102', 'Modern Trade', 'Referral', 'Coimbatore', 420000, 'CONTACTED', 'u-salesman'],
    ['Hotel Coral Bay', 'Chef Mathew', '+91 98410 55103', 'HORECA', 'Field visit', 'Chennai', 260000, 'NEW', 'u-horeca'],
    ['Campus Catering Co.', 'R. Venkat', '+91 98410 55104', 'Institutional', 'Phone call', 'Bengaluru', 150000, 'LOST', 'u-salesman'],
    ['Quick Bites QSR', 'Farah Ali', '+971 55 300 1105', 'HORECA', 'Website', 'Dubai', 300000, 'NEW', 'u-horeca'],
    ['Daily Needs Grocers', 'Suresh B', '+91 98410 55106', 'Retail', 'Walk-in', 'Madurai', 60000, 'CONVERTED', 'u-salesman'],
  ].map(([company, contactName, phone, segment, source, city, val, status, owner], i) => ({ id: `lead-seed-${i + 1}`, number: num('LEAD', Y, i + 1), company, contactName, phone, email: '', segment, source, city, estimatedValue: val, ownerId: has(U, owner) ? owner : 'u-salesman', nextFollowUp: now.add(i - 1, 'day').format('YYYY-MM-DD'), notes: '', status, ...meta(now, 20 - i * 2, owner, uname(owner)), history: hist(now, 20 - i * 2, [['Created', null, 'NEW', uname(owner)], ...(status !== 'NEW' ? [[status === 'LOST' ? 'Mark lost' : 'Updated', 'NEW', status, uname(owner), 3, status === 'LOST' ? 'Chose a local supplier on price.' : '']] : [])]) }))
  const opportunities = [
    ['Spice Route — frozen range listing', null, 'lead-seed-1', 'HORECA', 180000, 50, 'PROPOSAL'],
    ['ABC Enterprises — chilled dairy add-on', 'c-001', null, 'Wholesale', 240000, 70, 'NEGOTIATION'],
    ['Marina Hotels — seafood contract', 'c-010', null, 'HORECA', 520000, 100, 'WON'],
    ['Daily Needs Grocers — first order', 'c-014', 'lead-seed-6', 'Retail', 60000, 25, 'PROSPECTING'],
  ].map(([title, cust, lead, segment, value, prob, status], i) => ({ id: `opp-seed-${i + 1}`, number: num('OPP', Y, i + 1), title, customerId: has(C, cust) ? cust : '', leadId: lead || '', segment, value, probability: prob, expectedClose: now.add(10 + i * 7, 'day').format('YYYY-MM-DD'), ownerId: 'u-salesman', competitor: '', notes: '', status, ...meta(now, 15 - i, 'u-salesman', uname('u-salesman')), history: hist(now, 15 - i, [['Created', null, 'PROSPECTING', uname('u-salesman')]]) }))
  const visits = ['c-001', 'c-010', 'c-002', 'c-008', 'c-012'].filter((c) => has(C, c)).map((c, i) => ({ id: `act-seed-${i + 1}`, number: num('ACT', Y, i + 1), activityType: i % 2 ? 'Call' : 'Visit', customerId: c, leadId: '', activityDate: now.add(i - 2, 'day').format('YYYY-MM-DD'), purpose: ['Monthly review', 'Seafood tasting', 'Collection follow-up', 'New range presentation', 'Credit review'][i], ownerId: i === 1 ? 'u-horeca' : 'u-salesman', outcome: i < 2 ? 'Customer interested; follow up with prices.' : '', status: i < 2 ? 'COMPLETED' : 'PLANNED', ...meta(now, 6 - i), history: [] }))
  const period = now.format('YYYY-MM')
  const targets = ['u-salesman', 'u-horeca', 'u-vansales'].filter((u) => has(U, u)).map((u, i) => ({ id: `tgt-seed-${i + 1}`, number: num('TGT', Y, i + 1), ownerId: u, period, targetValue: [1500000, 900000, 400000][i], status: 'ACTIVE', ...meta(now, now.date() - 1), history: [] }))
  const commission = [['Standard trade', 'All', 1.5, 80], ['HORECA contracts', 'HORECA', 2.5, 90], ['Van sales', 'Van Sales', 3, 75]].map(([name, segment, rate, min], i) => ({ id: `com-seed-${i + 1}`, number: num('COM', Y, i + 1), name, segment, ratePercent: rate, minAchievementPct: min, notes: '', status: 'ACTIVE', ...meta(now, 40), history: [] }))
  const plProducts = ['p-13', 'p-14', 'p-17', 'p-11', 'p-21'].filter((p) => P[p])
  const priceLists = [
    { id: 'pl-seed-1', number: num('PL', Y, 1), name: 'HORECA contract prices H2', segment: 'HORECA', customerId: '', validFrom: now.subtract(30, 'day').format('YYYY-MM-DD'), validTo: now.add(150, 'day').format('YYYY-MM-DD'), lines: plProducts.map((p) => ({ productId: p, listPrice: sell(p), price: r2(sell(p) * 0.95), minQty: 5 })), status: 'ACTIVE', approvedBy: 'u-manager', ...meta(now, 32, 'u-salesman', uname('u-salesman')), history: hist(now, 32, [['Created', null, 'DRAFT', uname('u-salesman')], ['Submit for approval', 'DRAFT', 'PENDING_APPROVAL', uname('u-salesman'), 1], ['Approve', 'PENDING_APPROVAL', 'ACTIVE', uname('u-manager'), 2]]) },
    { id: 'pl-seed-2', number: num('PL', Y, 2), name: 'Marina Hotels seafood contract', segment: 'HORECA', customerId: has(C, 'c-010') ? 'c-010' : '', validFrom: now.format('YYYY-MM-DD'), validTo: now.add(1, 'year').format('YYYY-MM-DD'), lines: plProducts.slice(0, 2).map((p) => ({ productId: p, listPrice: sell(p), price: r2(sell(p) * 0.93), minQty: 10 })), status: 'PENDING_APPROVAL', ...meta(now, 2, 'u-horeca', uname('u-horeca')), history: hist(now, 2, [['Created', null, 'DRAFT', uname('u-horeca')], ['Submit for approval', 'DRAFT', 'PENDING_APPROVAL', uname('u-horeca'), 1]]) },
  ]
  const delivered = (data.orders || []).filter((o) => o.orderStatus === 'DELIVERED')
  const ret1 = delivered[0]
  const salesReturns = ret1 ? [{ id: 'srn-seed-1', number: num('SRN', Y, 1), customerId: ret1.customerId, orderId: ret1.id, hubId: ret1.hubId, returnDate: now.subtract(1, 'day').format('YYYY-MM-DD'), reason: 'Damaged in transit', ownerId: 'u-cs', lines: [{ productId: ret1.items[0].productId, quantity: Math.min(2, ret1.items[0].orderedQuantity), unitPrice: ret1.items[0].unitPrice, condition: 'Damaged' }], value: r2(Math.min(2, ret1.items[0].orderedQuantity) * ret1.items[0].unitPrice), notes: 'Cartons crushed on arrival.', status: 'REQUESTED', ...meta(now, 1, 'u-cs', uname('u-cs')), history: hist(now, 1, [['Created', null, 'REQUESTED', uname('u-cs')]]) }] : []
  const changeOrder = (data.orders || []).find((o) => o.orderStatus === 'APPROVED')
  const orderChanges = changeOrder ? [{ id: 'ocr-seed-1', number: num('OCR', Y, 1), orderId: changeOrder.id, changeType: 'DELIVERY_DATE', requestedValue: now.add(3, 'day').format('YYYY-MM-DD'), reason: 'Customer kitchen closed for renovation until later this week.', ownerId: 'u-cs', status: 'PENDING', ...meta(now, 0, 'u-cs', uname('u-cs')), history: hist(now, 0, [['Created', null, 'PENDING', uname('u-cs')]]) }] : []
  const tickets = [
    ['Late delivery on last order', 'c-010', 'Delivery issue', 'High', 'Customer portal', 'OPEN', 0.2],
    ['Invoice amount query', 'c-001', 'Invoice query', 'Normal', 'Email', 'IN_PROGRESS', 1],
    ['Fish fillets thawed on arrival', 'c-002', 'Quality issue', 'Critical', 'Phone', 'ESCALATED', 0.5],
    ['Request for halal certificate copy', 'c-008', 'Product request', 'Low', 'WhatsApp', 'RESOLVED', 3],
  ].filter(([, c]) => has(C, c)).map(([subject, cust, category, priority, channel, status, age], i) => {
    const created = now.subtract(age * 24, 'hour')
    const sla = { Critical: 4, High: 8, Normal: 24, Low: 72 }[priority]
    const ord = (data.orders || []).find((o) => o.customerId === cust && o.orderNumber)
    return { id: `tkt-seed-${i + 1}`, number: num('TKT', Y, i + 1), subject, customerId: cust, orderId: ord?.id || '', category, priority, channel, assignedTo: status === 'OPEN' ? '' : 'u-cs', description: subject, resolution: status === 'RESOLVED' ? 'Certificate shared by email.' : '', slaDueAt: created.add(sla, 'hour').toISOString(), _slaPriority: priority, status, createdAt: created.toISOString(), createdBy: 'u-cs', createdByName: uname('u-cs'), updatedAt: created.toISOString(), updatedBy: 'u-cs', history: [{ at: created.toISOString(), by: 'u-cs', byName: uname('u-cs'), action: 'Created', from: null, to: 'OPEN', note: '' }] }
  })
  const horecaCust = (data.customers || []).filter((c) => /HoReCa|Catering/i.test(c.category || ''))
  const horeca = horecaCust.slice(0, 4).map((c, i) => ({ id: `hrc-seed-${i + 1}`, number: num('HRC', Y, i + 1), customerId: c.id, outletType: ['Hotel', 'Catering', 'Restaurant', 'Cloud kitchen'][i], outlets: [3, 1, 2, 4][i], chefContact: ['Chef Arvind', 'Chef Nisha', 'Chef Rohan', 'Chef Salma'][i], purchaseContact: c.contactPerson || '', accountManagerId: i % 2 ? 'u-salesman' : 'u-horeca', priceListId: i === 0 ? 'pl-seed-1' : '', contractStart: now.subtract(90 - i * 10, 'day').format('YYYY-MM-DD'), contractEnd: now.add(i === 1 ? 45 : 270, 'day').format('YYYY-MM-DD'), deliveryWindow: ['06:00–09:00', '05:00–07:00', '09:00–12:00', 'Night (22:00–02:00)'][i], monthlyVolumeTarget: [450000, 220000, 160000, 300000][i], notes: '', status: i === 3 ? 'PENDING_APPROVAL' : 'ACTIVE', ...meta(now, 90 - i * 10, 'u-horeca', uname('u-horeca')), history: [] }))
  const templates = horeca.slice(0, 2).map((h, i) => ({ id: `tpl-seed-${i + 1}`, number: num('TPL', Y, i + 1), name: `${C[h.customerId]?.name || 'Customer'} — weekly standing order`, customerId: h.customerId, frequency: 'Weekly', deliveryDay: ['Monday', 'Thursday'][i], lastOrderNumber: '', lines: (i ? ['p-05', 'p-15', 'p-21'] : ['p-13', 'p-14', 'p-17']).filter((p) => P[p]).map((p, k) => ({ productId: p, quantity: [10, 6, 8][k] })), status: 'ACTIVE', ...meta(now, 30), history: [] }))

  /* Van sales */
  const van = V['veh-09'] ? 'veh-09' : Object.keys(V)[0]
  // Load the van with products that have unreserved, releasable stock at its hub (a third of what is available)
  const vanHub = V[van]?.hubId || 'hub-che'
  const heldAt = (pid) => qaHeld.filter((b) => b.productId === pid && b.hubId === vanHub).reduce((x, b) => x + b.quantity, 0)
  const vanLines = (data.inventory || []).filter((r) => r.hubId === vanHub && P[r.productId]?.status === 'Active')
    .map((r) => ({ productId: r.productId, avail: (r.totalQuantity || 0) - (r.reservedQuantity || 0) - (r.damagedQuantity || 0) - heldAt(r.productId) }))
    .filter((x) => x.avail >= 12).sort((a, b) => b.avail - a.avail).slice(0, 4)
    .map((x) => ({ productId: x.productId, loadedQty: Math.min(15, Math.floor(x.avail / 3)) }))
  const vanAssignments = van && vanLines.length ? [{ id: 'van-seed-1', number: num('VAN', Y, 1), routeName: 'Chennai South retail loop', routeDate: now.format('YYYY-MM-DD'), hubId: vanHub, vehicleId: van, salesExecId: has(U, 'u-vansales') ? 'u-vansales' : 'u-salesman', lines: vanLines, status: 'PLANNED', ...meta(now, 0, 'u-manager', uname('u-manager')), history: hist(now, 0, [['Created', null, 'PLANNED', uname('u-manager')]]) }] : []

  /* Procurement */
  const reqs = [
    { title: 'Seafood restock — Chennai', hubId: 'hub-che', lines: [['p-13', 60], ['p-14', 40]], status: 'APPROVED', by: 'u-warehouse' },
    { title: 'Packaging consumables Q4', hubId: 'hub-che', lines: [['p-23', 80], ['p-24', 300], ['p-25', 150]], status: 'SUBMITTED', by: 'u-warehouse' },
    { title: 'Dairy top-up Bengaluru', hubId: 'hub-blr', lines: [['p-11', 30], ['p-12', 30], ['p-21', 25]], status: 'PO_CREATED', by: 'u-inventory' },
    { title: 'Poultry import — Q1 programme', hubId: 'hub-che', lines: [['p-01', 300], ['p-17', 200]], status: 'RFQ_ISSUED', by: 'u-procexec' },
  ].map((r, i) => ({ id: `pr-seed-${i + 1}`, number: num('PR', Y, i + 1), title: r.title, hubId: has(H, r.hubId) ? r.hubId : 'hub-che', requiredBy: now.add(10 + i * 5, 'day').format('YYYY-MM-DD'), priority: i === 0 ? 'High' : 'Normal', requestedBy: has(U, r.by) ? r.by : 'u-warehouse', justification: 'Stock below reorder level on the planning report.', lines: r.lines.filter(([p]) => P[p]).map(([p, q]) => ({ productId: p, quantity: q, estimatedPrice: price(p) })), total: r2(r.lines.filter(([p]) => P[p]).reduce((s, [p, q]) => s + q * price(p), 0)), status: r.status, ...meta(now, 12 - i * 2, r.by, uname(r.by)), history: hist(now, 12 - i * 2, [['Created', null, 'DRAFT', uname(r.by)], ['Submit', 'DRAFT', 'SUBMITTED', uname(r.by), 1], ...(r.status !== 'SUBMITTED' ? [['Approve', 'SUBMITTED', 'APPROVED', uname('u-procmgr'), 2]] : [])]) }))
  reqs[3].rfqId = 'rfq-seed-1'; reqs[3].rfqNumber = num('RFQ', Y, 1)
  reqs[2].poId = 'po-seed-2'; reqs[2].poNumber = num('PO', Y, 2)
  const rfqLines = reqs[3].lines.map((l) => ({ productId: l.productId, quantity: l.quantity }))
  const rfqs = [{ id: 'rfq-seed-1', number: num('RFQ', Y, 1), title: reqs[3].title, requisitionId: reqs[3].id, hubId: 'hub-che', responseDue: now.add(3, 'day').format('YYYY-MM-DD'), supplierIds: ['sup-01', 'sup-04', 'sup-06'], lines: rfqLines, status: 'ISSUED', ...meta(now, 4, 'u-procexec', uname('u-procexec')), history: hist(now, 4, [['Created', null, 'DRAFT', uname('u-procexec')], ['Issue to suppliers', 'DRAFT', 'ISSUED', uname('u-procexec'), 0]]) }]
  const quotes = [['sup-04', 1.04, 14], ['sup-06', 0.94, 30]].map(([s, f, lead], i) => ({ id: `sq-seed-${i + 1}`, number: num('SQ', Y, i + 1), rfqId: 'rfq-seed-1', supplierId: s, validUntil: now.add(30, 'day').format('YYYY-MM-DD'), leadTimeDays: lead, paymentTerms: i ? 'Net 60' : 'Net 30', incoterm: i ? 'CFR' : 'DAP', lines: rfqLines.map((l) => ({ ...l, unitPrice: r2(price(l.productId) * f) })), total: r2(rfqLines.reduce((x, l) => x + l.quantity * price(l.productId) * f, 0)), status: 'SUBMITTED', ...meta(now, 2 - i), history: [] }))
  const poOf = (id, n, supplierId, hubId, lines, status, age, extra = {}) => {
    const subtotal = r2(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0))
    const vat = r2(lines.reduce((s, l) => s + (l.quantity * l.unitPrice * (l.taxPercent ?? 5)) / 100, 0))
    return { id, number: num('PO', Y, n), supplierId, hubId, orderDate: now.subtract(age, 'day').format('YYYY-MM-DD'), expectedDate: now.subtract(age, 'day').add(7, 'day').format('YYYY-MM-DD'), currency: 'Base currency', incoterm: 'DAP', paymentTerms: 'Net 30', requisitionId: '', supplierRef: '', notes: '', lines, subtotal, vatAmount: vat, total: r2(subtotal + vat), status, ...meta(now, age, 'u-procexec', uname('u-procexec')), history: hist(now, age, [['Created', null, 'DRAFT', uname('u-procexec')], ...(status !== 'DRAFT' && status !== 'PENDING_APPROVAL' ? [['Approve', 'PENDING_APPROVAL', 'APPROVED', uname('u-procmgr'), 1]] : [])]), ...extra }
  }
  const histReceipt = (data.receipts || [])[0]
  const pos = [
    poOf('po-seed-1', 1, 'sup-01', 'hub-che', reqs[0].lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: price(l.productId), taxPercent: 5, receivedQty: 0 })), 'CONFIRMED', 5, { requisitionId: reqs[0].id, supplierRef: 'CFF-SO-88231' }),
    poOf('po-seed-2', 2, 'sup-02', 'hub-blr', reqs[2].lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: price(l.productId), taxPercent: 5, receivedQty: 0 })), 'PENDING_APPROVAL', 2, { requisitionId: reqs[2].id }),
    poOf('po-seed-3', 3, 'sup-05', 'hub-che', [['p-23', 50], ['p-24', 200]].filter(([p]) => P[p]).map(([p, q]) => ({ productId: p, quantity: q, unitPrice: price(p), taxPercent: 5, receivedQty: 0 })), 'DRAFT', 1),
  ]
  if (histReceipt && P[histReceipt.productId]) {
    pos.push(poOf('po-seed-4', 4, 'sup-03', histReceipt.hubId, [{ productId: histReceipt.productId, quantity: histReceipt.quantity + 16, unitPrice: price(histReceipt.productId), taxPercent: 5, receivedQty: histReceipt.quantity }], 'PARTIALLY_RECEIVED', 30, { supplierRef: histReceipt.referenceNumber }))
  }
  const grns = [{ id: 'rcv-seed-1', number: num('RCV', Y, 1), purchaseOrderId: 'po-seed-1', supplierId: 'sup-01', hubId: 'hub-che', receivedDate: now.format('YYYY-MM-DD'), deliveryNoteRef: 'CFF-DN-55120', vehicleTemperature: -19, qaRequired: true, lines: pos[0].lines.map((l, i) => ({ productId: l.productId, orderedQty: l.quantity, receivedQty: l.quantity, rejectedQty: i === 1 ? 2 : 0, batchNumber: `CFF${now.format('YYMM')}-${101 + i}`, expiryDate: now.add(270 + i * 30, 'day').format('YYYY-MM-DD'), mfgDate: now.subtract(20, 'day').format('YYYY-MM-DD'), locationId: `loc-che-frz-a-0${i + 1}-1-b1`, unitCost: l.unitPrice })), notes: 'Truck arrived at dock 2.', status: 'DRAFT', ...meta(now, 0, 'u-warehouse', uname('u-warehouse')), history: hist(now, 0, [['Created', null, 'DRAFT', uname('u-warehouse')]]) }]
  if (pos[3]) grns.push({ id: 'rcv-seed-2', number: num('RCV', Y, 2), purchaseOrderId: 'po-seed-4', supplierId: 'sup-03', hubId: histReceipt.hubId, receivedDate: histReceipt.receiptDate, deliveryNoteRef: histReceipt.referenceNumber, vehicleTemperature: -18, qaRequired: false, lines: [{ productId: histReceipt.productId, orderedQty: histReceipt.quantity + 16, receivedQty: histReceipt.quantity, rejectedQty: 0, acceptedQty: histReceipt.quantity, batchNumber: `AFP-${histReceipt.receiptNumber.slice(-4)}`, expiryDate: now.add(200, 'day').format('YYYY-MM-DD'), mfgDate: now.subtract(40, 'day').format('YYYY-MM-DD'), locationId: '', unitCost: price(histReceipt.productId), receiptNumber: histReceipt.receiptNumber }], notes: 'Historical receipt linked to the stock ledger.', status: 'POSTED', acceptedTotal: histReceipt.quantity, value: r2(histReceipt.quantity * price(histReceipt.productId)), ...meta(now, 30, 'u-warehouse', uname('u-warehouse')), history: hist(now, 30, [['Created', null, 'DRAFT', uname('u-warehouse')], ['Post receipt', 'DRAFT', 'POSTED', uname('u-warehouse'), 0]]) })
  const supInvoices = []
  if (pos[3]) {
    const sub = r2(histReceipt.quantity * price(histReceipt.productId))
    supInvoices.push({ id: 'sinv-seed-1', number: num('SINV', Y, 1), supplierId: 'sup-03', purchaseOrderId: 'po-seed-4', supplierInvoiceNo: 'AFP/INV/2231', supplierTrn: '100234567800003', invoiceDate: now.subtract(28, 'day').format('YYYY-MM-DD'), dueDate: now.add(2, 'day').format('YYYY-MM-DD'), subtotal: sub, vatAmount: r2(sub * 0.05), total: r2(sub * 1.05), notes: '', status: 'APPROVED', ...meta(now, 28, 'u-accountant', uname('u-accountant')), history: hist(now, 28, [['Created', null, 'RECEIVED', uname('u-accountant')], ['Run 3-way match', 'RECEIVED', 'MATCHED', uname('u-accountant'), 1], ['Approve for payment', 'MATCHED', 'APPROVED', uname('u-finmgr'), 2]]) })
  }
  supInvoices.push({ id: 'sinv-seed-2', number: num('SINV', Y, 2), supplierId: 'sup-05', purchaseOrderId: '', supplierInvoiceNo: 'EPI-77812', supplierTrn: '100567890100003', invoiceDate: now.subtract(50, 'day').format('YYYY-MM-DD'), dueDate: now.subtract(20, 'day').format('YYYY-MM-DD'), subtotal: 18400, vatAmount: 920, total: 19320, notes: 'Pallet wrap and labels (non-stock).', status: 'APPROVED', ...meta(now, 50, 'u-accountant', uname('u-accountant')), history: [] })

  /* Import */
  const shipments = [
    { id: 'shp-seed-1', number: num('SHP', Y, 1), direction: 'Import', mode: 'Sea', purchaseOrderId: 'po-seed-1', supplierId: 'sup-01', originPort: 'Kochi (INCOK)', destinationPort: 'Chennai (INMAA)', incoterm: 'CFR', blNumber: 'MAEU2290831', containerNumbers: 'MSKU 776120-4', containerType: '40ft Reefer', etd: now.subtract(9, 'day').format('YYYY-MM-DD'), eta: now.add(2, 'day').format('YYYY-MM-DD'), ata: '', customsDeclarationNo: '', docCommercialInvoice: true, docPackingList: true, docBillOfLading: true, docCertificateOfOrigin: true, docHealthCertificate: false, docHalalCertificate: true, freightCost: 42000, insuranceCost: 3500, dutyCost: 0, clearingCost: 12000, otherCost: 2500, allocationBasis: 'WEIGHT', lines: pos[0].lines.map((l) => ({ productId: l.productId, quantity: l.quantity, weightKg: l.quantity * 12, unitValue: l.unitPrice })), notes: 'Reefer set point −20 °C.', status: 'IN_TRANSIT' },
    { id: 'shp-seed-2', number: num('SHP', Y, 2), direction: 'Import', mode: 'Sea', purchaseOrderId: '', supplierId: 'sup-06', originPort: 'Santos (BRSSZ)', destinationPort: 'Jebel Ali (AEJEA)', incoterm: 'CFR', blNumber: 'HLCU8812004', containerNumbers: 'HLXU 554310-1, HLXU 554311-7', containerType: '40ft Reefer', etd: now.subtract(25, 'day').format('YYYY-MM-DD'), eta: now.subtract(1, 'day').format('YYYY-MM-DD'), ata: now.subtract(1, 'day').format('YYYY-MM-DD'), customsDeclarationNo: '', docCommercialInvoice: true, docPackingList: true, docBillOfLading: true, docCertificateOfOrigin: true, docHealthCertificate: true, docHalalCertificate: true, freightCost: 96000, insuranceCost: 8000, dutyCost: 54000, clearingCost: 18000, otherCost: 4000, allocationBasis: 'VALUE', lines: [['p-01', 600], ['p-17', 400]].filter(([p]) => P[p]).map(([p, q]) => ({ productId: p, quantity: q, weightKg: q * 12, unitValue: r2(price(p) * 0.9) })), notes: '', status: 'ARRIVED' },
  ].map((s, i) => { const goods = r2(s.lines.reduce((x, l) => x + l.quantity * l.unitValue, 0)); return { ...s, goodsValue: goods, extraCost: r2(s.freightCost + s.insuranceCost + s.dutyCost + s.clearingCost + s.otherCost), docsComplete: ['docCommercialInvoice', 'docPackingList', 'docBillOfLading', 'docCertificateOfOrigin', 'docHealthCertificate', 'docHalalCertificate'].filter((k) => s[k]).length, ...meta(now, 9 + i * 15, 'u-import', uname('u-import')), history: [] } })

  /* Warehouse tasks */
  const pickOrders = (data.orders || []).filter((o) => ['CONSOLIDATED', 'READY_FOR_DISPATCH'].includes(o.orderStatus)).slice(0, 2)
  const picking = pickOrders.map((o, i) => ({ id: `pick-seed-${i + 1}`, number: num('PICK', Y, i + 1), orderId: o.id, hubId: o.hubId, method: 'FEFO', waveRef: `W${now.format('MMDD')}-0700`, assignedTo: i === 0 ? 'u-whexec' : '', lines: o.items.map((it) => { const lot = batches.filter((b) => b.productId === it.productId && b.hubId === o.hubId && b.qaStatus === 'AVAILABLE' && b.quantity > 0).sort((a, b) => String(a.expiryDate).localeCompare(b.expiryDate))[0]; return { productId: it.productId, batchId: lot?.id || '', batchNumber: lot?.batchNumber || '', expiryDate: lot?.expiryDate || '', locationId: lot?.locationId || '', quantity: it.orderedQuantity, pickedQty: it.orderedQuantity } }), status: i === 0 ? 'PICKING' : 'OPEN', ...meta(now, 0), history: [] }))
  const dsp = (data.dispatches || []).find((d) => ['PLANNED', 'ASSIGNED', 'CONFIRMED'].includes(d.status))
  const loading = dsp ? [{ id: 'load-seed-1', number: num('LOAD', Y, 1), dispatchId: dsp.id, vehicleId: dsp.vehicleId || van, hubId: dsp.hubId, plannedQty: dsp.totalQuantity || 0, dockDoor: 'D2', sealNumber: '', loadingTemperature: null, status: 'PLANNED', ...meta(now, 0), history: [] }] : []

  /* Inventory control & QA */
  const ccProducts = (data.inventory || []).filter((r) => r.hubId === 'hub-che' && r.totalQuantity > 0).slice(0, 4)
  const cycleCounts = ccProducts.length ? [{ id: 'cc-seed-1', number: num('CC', Y, 1), hubId: 'hub-che', countDate: now.format('YYYY-MM-DD'), scopeNote: 'Frozen zone A, racks 01–02', lines: ccProducts.map((r, i) => ({ productId: r.productId, systemQty: r.totalQuantity, countedQty: i === 2 ? Math.max(0, r.totalQuantity - 2) : r.totalQuantity })), status: 'SUBMITTED', varianceLines: 1, netVariance: -2, ...meta(now, 0, 'u-inventory', uname('u-inventory')), history: hist(now, 0, [['Created', null, 'DRAFT', uname('u-inventory')], ['Submit count', 'DRAFT', 'SUBMITTED', uname('u-inventory')]]) }] : []
  const qaInspections = [
    ...qaHeld.slice(0, 2).map((b, i) => ({ id: `qai-seed-${i + 1}`, number: num('QAI', Y, i + 1), sourceType: 'Routine', grnId: '', hubId: b.hubId, productId: b.productId, batchIds: [b.id], batchNumbers: b.batchNumber, plannedDate: now.format('YYYY-MM-DD'), inspectorId: 'u-qainsp', packagingOk: false, labelOk: true, temperatureOk: true, sensoryOk: true, documentsOk: true, measuredTemp: -18.5, notes: 'Outer carton seal damaged — check product integrity.', checksPassed: 4, status: i ? 'PENDING' : 'IN_PROGRESS', ...meta(now, 1, 'u-qa', uname('u-qa')), history: [] })),
  ]
  const tempLogs = []
  ;['hub-che', 'hub-blr', 'hub-cbe'].filter((h) => H[h]).forEach((h, hi) => {
    for (let k = 0; k < 6; k += 1) {
      const area = k % 2 ? 'Chilled store' : 'Frozen store'
      const [mn, mx] = area === 'Frozen store' ? [-25, -18] : [0, 5]
      const reading = area === 'Frozen store' ? r2(-21 + ((k * 7 + hi * 3) % 5) * 0.6 + (hi === 1 && k === 4 ? 5.5 : 0)) : r2(2 + ((k + hi) % 3) * 0.7)
      const st = reading < mn || reading > mx ? 'EXCURSION' : 'IN_RANGE'
      const at = now.subtract(k * 4 + hi, 'hour')
      tempLogs.push({ id: `tmp-seed-${hi}-${k}`, number: num('TMP', Y, hi * 6 + k + 1), hubId: h, area, vehicleId: '', reading, minAllowed: mn, maxAllowed: mx, recordedAt: at.toISOString(), source: k % 3 === 0 ? 'MANUAL' : 'SIMULATED', notes: '', status: st, createdAt: at.toISOString(), createdBy: 'system', createdByName: 'System (demo seed)', updatedAt: at.toISOString(), updatedBy: 'system', history: [] })
    }
  })
  const ncrs = [{ id: 'ncr-seed-1', number: num('NCR', Y, 1), title: 'Temperature excursion in Bangalore frozen store', sourceType: 'Temperature excursion', referenceNumber: tempLogs.find((t) => t.status === 'EXCURSION')?.number || '', productId: '', supplierId: '', severity: 'Major', ownerId: 'u-qa', dueDate: now.add(5, 'day').format('YYYY-MM-DD'), description: 'Door left ajar during loading; store rose above −18 °C for ~40 minutes.', rootCause: 'Strip curtain damaged; no door alarm.', correctiveAction: '', preventiveAction: '', status: 'INVESTIGATION', ...meta(now, 1, 'u-qa', uname('u-qa')), history: [] }]

  /* Logistics, fleet, drivers */
  const failed = (data.orders || []).find((o) => o.orderStatus === 'DELIVERY_FAILED')
  const reschedules = failed ? [{ id: 'rsc-seed-1', number: num('RSC', Y, 1), orderId: failed.id, customerId: failed.customerId, hubId: failed.hubId, currentDate: failed.requestedDeliveryDate, newDate: now.add(1, 'day').format('YYYY-MM-DD'), newWindow: '09:00–12:00', reason: 'Customer closed', driverId: failed.driverId || 'drv-01', notes: 'Shop shutter down at 10:40.', status: 'REQUESTED', ...meta(now, 0, 'u-driver', uname('u-driver')), history: [] }] : []
  const rpOrders = (data.orders || []).filter((o) => o.hubId === 'hub-che' && ['READY_FOR_DISPATCH', 'CONSOLIDATED'].includes(o.orderStatus)).slice(0, 3)
  const routePlans = rpOrders.length && D['drv-03'] && V['veh-03'] ? [{ id: 'rte-seed-1', number: num('RTE', Y, 1), name: 'Chennai central morning', routeDate: now.add(1, 'day').format('YYYY-MM-DD'), hubId: 'hub-che', vehicleId: 'veh-03', driverId: 'drv-03', lines: rpOrders.map((o, i) => ({ orderId: o.id, window: '06:00–09:00', sequence: i + 1, eta: '' })), stops: rpOrders.length, plannedQty: rpOrders.reduce((s, o) => s + (o.totalQuantity || 0), 0), status: 'DRAFT', ...meta(now, 0, 'u-dispatcher', uname('u-dispatcher')), history: [] }] : []
  const maintenance = [['veh-10', 'Reefer unit', 'IN_PROGRESS', 38000, 'Compressor service and gas top-up'], ['veh-02', 'Preventive service', 'APPROVED', 9500, '40,000 km service'], ['veh-05', 'Tyres', 'REQUESTED', 22000, 'Replace rear tyres (2)'], ['veh-01', 'Inspection / fitness', 'COMPLETED', 4200, 'Annual fitness inspection']].filter(([v]) => V[v]).map(([v, type, status, est, desc], i) => ({ id: `mnt-seed-${i + 1}`, number: num('MNT', Y, i + 1), vehicleId: v, jobType: type, scheduledDate: now.add(i * 3 - 3, 'day').format('YYYY-MM-DD'), odometer: 42000 + i * 9000, vendor: ['CoolTech Reefer Services', 'Eicher Authorised Service', 'MRF Tyre Point', 'RTO Fitness Centre'][i], estimatedCost: est, actualCost: status === 'COMPLETED' ? est - 300 : null, description: desc, status, completedAt: status === 'COMPLETED' ? now.subtract(5, 'day').toISOString() : undefined, ...meta(now, 8 - i, 'u-fleet', uname('u-fleet')), history: [] }))
  const fuel = []
  ;['veh-01', 'veh-02', 'veh-03'].filter((v) => V[v]).forEach((v, vi) => {
    const drv = (data.drivers || []).find((d) => d.vehicleId === v)?.id || ['drv-01', 'drv-02', 'drv-03'][vi]
    for (let k = 0; k < 4; k += 1) fuel.push({ id: `fuel-seed-${vi}-${k}`, number: num('FUEL', Y, vi * 4 + k + 1), vehicleId: v, driverId: drv, date: now.subtract(24 - k * 7, 'day').format('YYYY-MM-DD'), odometer: 40000 + vi * 10000 + k * 620, litres: 70 + ((k + vi) % 3) * 8, pricePerLitre: 94.5, amount: r2((70 + ((k + vi) % 3) * 8) * 94.5), station: 'IndianOil, Guindy', paymentMode: 'Fuel card', status: k < 3 ? 'VERIFIED' : 'SUBMITTED', ...meta(now, 24 - k * 7), history: [] })
  })
  const dexp = [['Toll', 180, 'APPROVED'], ['Parking', 60, 'SUBMITTED'], ['Meals', 250, 'REIMBURSED'], ['Loading charges', 400, 'SUBMITTED']].map(([t, a, st], i) => ({ id: `dex-seed-${i + 1}`, number: num('DEX', Y, i + 1), driverId: i % 2 ? 'drv-02' : 'drv-01', expenseType: t, date: now.subtract(i, 'day').format('YYYY-MM-DD'), amount: a, dispatchId: '', receiptRef: `RC-${7710 + i}`, notes: '', status: st, ...meta(now, i, 'u-driver', uname('u-driver')), history: [] }))

  /* Finance */
  const banks = [
    { id: 'bank-seed-1', bankName: 'Emirates NBD — Operating', accountType: 'Current account', accountNumber: '1015 4422 8801', iban: 'AE070260001015442288010', currency: 'Base currency', openingBalance: 2500000 },
    { id: 'bank-seed-2', bankName: 'HDFC Bank — Chennai collections', accountType: 'Current account', accountNumber: '5020 0011 7782', iban: '', currency: 'Base currency', openingBalance: 1200000 },
    { id: 'bank-seed-3', bankName: 'Petty cash — Chennai hub', accountType: 'Petty cash', accountNumber: 'PC-CHE', iban: '', currency: 'Base currency', openingBalance: 50000 },
  ].map((b) => ({ ...b, status: 'ACTIVE', ...meta(now, 120), history: [] }))
  const invs = (data.invoices || []).filter((i) => i.status !== 'CANCELLED' && i.status !== 'DRAFT')
  const payments = []
  if (invs[0]) payments.push({ id: 'rcpt-seed-1', number: num('RCPT', Y, 1), customerId: invs[0].customerId, paymentDate: now.subtract(2, 'day').format('YYYY-MM-DD'), amount: 150000, method: 'Bank transfer', bankAccountId: 'bank-seed-2', reference: 'NEFT-UTR-889120', collectedByDriverId: '', allocations: [{ invoiceId: invs[0].id, amount: 150000 }], allocated: 150000, unallocated: 0, status: 'POSTED', postedAt: now.subtract(2, 'day').toISOString(), ...meta(now, 2, 'u-accountant', uname('u-accountant')), history: [] })
  if (invs[2]) payments.push({ id: 'rcpt-seed-2', number: num('RCPT', Y, 2), customerId: invs[2].customerId, paymentDate: now.format('YYYY-MM-DD'), amount: 25000, method: 'Driver cash collection', bankAccountId: '', reference: 'Cash receipt 0091', collectedByDriverId: 'drv-01', allocations: [{ invoiceId: invs[2].id, amount: 25000 }], allocated: 25000, unallocated: 0, status: 'PENDING_DEPOSIT', ...meta(now, 0, 'u-driver', uname('u-driver')), history: [] })
  const creditNotes = invs[1] ? [{ id: 'cn-seed-1', number: num('CN', Y, 1), customerId: invs[1].customerId, invoiceId: invs[1].id, salesReturnId: '', date: now.subtract(1, 'day').format('YYYY-MM-DD'), reason: 'Price correction — contract price not applied on 2 lines', amount: 4200, vatAmount: 210, total: 4410, status: 'DRAFT', ...meta(now, 1, 'u-accountant', uname('u-accountant')), history: [] }] : []
  const expensesSeed = [['Utilities', 'DEWA electricity — Dubai office', 'Dubai Electricity & Water Authority', '100000000000003', 28500, 'PAID'], ['Rent', 'Chennai cold store rent', 'SIDCO Estates', '', 185000, 'APPROVED'], ['Repairs & maintenance', 'Dock leveller repair', 'Loading Systems LLC', '100345678900003', 12400, 'SUBMITTED'], ['Telecom', 'Mobile plans — drivers', 'du Telecom', '100023456700003', 6200, 'APPROVED']].map(([cat, desc, vendor, trn, amt, st], i) => ({ id: `exp-seed-${i + 1}`, number: num('EXP', Y, i + 1), category: cat, description: desc, vendor, vendorTrn: trn, date: now.subtract(3 + i * 4, 'day').format('YYYY-MM-DD'), departmentId: 'dep-admin', amount: amt, vatApplicable: Boolean(trn), vatAmount: trn ? r2(amt * 0.05) : 0, total: trn ? r2(amt * 1.05) : amt, paidFromAccountId: st === 'PAID' ? 'bank-seed-1' : '', status: st, ...meta(now, 3 + i * 4, 'u-accountant', uname('u-accountant')), history: [] }))
  const vouchersSeed = [{ id: 'vch-seed-1', number: num('VCH', Y, 1), voucherType: 'Payment', date: now.subtract(6, 'day').format('YYYY-MM-DD'), bankAccountId: 'bank-seed-1', counterparty: 'Emirates NBD', amount: 350, narration: 'Monthly bank charges', status: 'POSTED', ...meta(now, 6), history: [] }]

  /* HR */
  const branchOf = (u) => (u.hubId && String(u.hubId).startsWith('hub-') ? 'br-ind' : 'br-dxb')
  const staff = (data.users || []).filter((u) => !['CUSTOMER', 'SUPPLIER'].includes(u.role) && !u.customerId && !u.supplierId)
  const managerOf = { SALESMAN: 'u-manager', CUSTOMER_SERVICE: 'u-manager', DISPATCHER: 'u-opsmgr', DRIVER: 'u-dispatcher', INVENTORY_EXECUTIVE: 'u-warehouse', WAREHOUSE_EXEC: 'u-warehouse', QA_INSPECTOR: 'u-qa', ACCOUNTANT: 'u-finmgr', FINANCE: 'u-finmgr', HR_EXEC: 'u-hrmgr', PROCUREMENT_EXEC: 'u-procmgr', IMPORT_EXEC: 'u-procmgr', HORECA_SALES_EXEC: 'u-manager', VAN_SALES_EXEC: 'u-manager' }
  const empId = (uid) => `emp-${uid}`
  const employees = staff.map((u, i) => ({ id: empId(u.id), name: u.name, employeeCode: u.employeeId || `EMP-${String(500 + i).padStart(4, '0')}`, userId: u.id, email: u.email, phone: u.phone || '', nationality: String(u.phone || '').startsWith('+971') ? 'United Arab Emirates (resident)' : 'India', joinDate: dayjs(u.createdAt || now).subtract(400 + i * 37, 'day').format('YYYY-MM-DD'), employmentType: 'Full-time', departmentId: u.department || 'dep-admin', designationId: u.designation || '', branchId: branchOf(u), businessUnitId: '', reportingManagerId: managerOf[u.role] && staff.some((x) => x.id === managerOf[u.role]) ? empId(managerOf[u.role]) : (u.role === 'SUPER_ADMIN' || u.role === 'CEO' ? '' : empId(staff.some((x) => x.id === 'u-ceo') ? 'u-ceo' : 'u-superadmin')), workLocationHubId: u.hubId || '', primaryRole: u.role, additionalRoles: u.additionalRoles || [], passportExpiry: now.add(400 + i * 50, 'day').format('YYYY-MM-DD'), visaExpiry: branchOf(u) === 'br-dxb' ? now.add(i % 5 === 0 ? 40 : 300 + i * 10, 'day').format('YYYY-MM-DD') : '', emiratesIdExpiry: branchOf(u) === 'br-dxb' ? now.add(i % 5 === 0 ? 40 : 300 + i * 10, 'day').format('YYYY-MM-DD') : '', labourCardExpiry: '', status: 'ACTIVE', ...meta(now, 200), history: [] }))
  const jobReqs = [{ id: 'jr-seed-1', number: num('JR', Y, 1), title: 'Reefer Truck Driver', departmentId: 'dep-drivers', designationId: 'des-driver', headcount: 2, employmentType: 'Full-time', salaryBudget: 28000, justification: 'Second shift for Chennai deliveries.', hired: 0, status: 'OPEN', ...meta(now, 15, 'u-hrmgr', uname('u-hrmgr')), history: [] }, { id: 'jr-seed-2', number: num('JR', Y, 2), title: 'Procurement Executive — Imports', departmentId: 'dep-procurement', designationId: 'des-proc-exec', headcount: 1, employmentType: 'Full-time', salaryBudget: 9000, justification: 'Growth in Brazil poultry programme.', hired: 0, status: 'PENDING_APPROVAL', ...meta(now, 3, 'u-hrexec', uname('u-hrexec')), history: [] }]
  const cands = [['Manoj Kumar', 'INTERVIEW', 4], ['Selvaraj P', 'SCREENING', 3], ['Imran Sheikh', 'APPLIED', null]].map(([n, st, rating], i) => ({ id: `can-seed-${i + 1}`, name: n, email: `${n.split(' ')[0].toLowerCase()}@candidates.demo`, phone: `+91 9000 1100 ${10 + i}`, jobRequisitionId: 'jr-seed-1', source: ['Referral', 'Job portal', 'Walk-in'][i], expectedSalary: 26000 + i * 1000, interviewDate: st === 'INTERVIEW' ? now.add(2, 'day').format('YYYY-MM-DD') : '', rating, notes: '', status: st, ...meta(now, 10 - i * 2, 'u-hrexec', uname('u-hrexec')), history: [] }))
  const att = []
  employees.forEach((e, i) => {
    for (let d = 1; d <= 5; d += 1) {
      const date = now.subtract(d, 'day')
      if (date.day() === 0) continue
      const absent = (i + d) % 17 === 0
      const late = !absent && (i + d) % 7 === 0
      const ci = absent ? '' : late ? '08:34' : '07:5' + ((i + d) % 9)
      const co = absent ? '' : '17:0' + ((i * d) % 9)
      const h = ci && co ? r2(dayjs(`2000-01-01T${co}`).diff(dayjs(`2000-01-01T${ci}`), 'minute') / 60) : 0
      att.push({ id: `att-seed-${i}-${d}`, employeeId: e.id, userId: e.userId, date: date.format('YYYY-MM-DD'), checkIn: ci, checkOut: co, source: d % 2 ? 'DEMO_DEVICE' : 'MANUAL', remarks: '', hoursWorked: h, status: absent ? 'ABSENT' : late ? 'LATE' : 'PRESENT', ...meta(now, d), history: [] })
    }
  })
  const leaveSeed = employees.slice(2, 5).map((e, i) => ({ id: `lv-seed-${i + 1}`, number: num('LV', Y, i + 1), employeeId: e.id, userId: e.userId, leaveType: ['Annual leave', 'Sick leave', 'Annual leave'][i], fromDate: now.add([10, -2, 20][i], 'day').format('YYYY-MM-DD'), toDate: now.add([14, -1, 24][i], 'day').format('YYYY-MM-DD'), days: [5, 2, 5][i], reason: ['Family visit', 'Fever', 'Personal travel'][i], status: ['PENDING', 'APPROVED', 'PENDING'][i], ...meta(now, 3 - i, e.userId, e.name), history: [] }))
  const salary = employees.map((e, i) => { const basic = e.branchId === 'br-dxb' ? 9000 + (i % 5) * 1500 : 30000 + (i % 5) * 6000; const housing = r2(basic * 0.4); const transport = r2(basic * 0.1); const gross = r2(basic + housing + transport); return { id: `sal-${e.id}`, employeeId: e.id, effectiveFrom: now.startOf('year').format('YYYY-MM-DD'), basic, housing, transport, otherAllowances: 0, fixedDeductions: 0, gross, net: gross, status: 'ACTIVE', ...meta(now, 200), history: [] } })

  /* Operational exceptions */
  const exc = []
  if (failed) exc.push({ id: 'exc-seed-1', number: num('EXC', Y, 1), title: `Failed delivery — ${failed.orderNumber}`, type: 'Failed delivery', severity: 'High', referenceLabel: failed.orderNumber, link: `/orders/${failed.id}`, assignedTo: 'u-dispatcher', dueAt: now.add(3, 'hour').toISOString(), description: 'Customer closed on arrival; reschedule requested by driver.', resolution: '', sourceKey: `failed:${failed.id}`, status: 'ASSIGNED', ...meta(now, 0), history: [] })
  const excursion = tempLogs.find((t) => t.status === 'EXCURSION')
  if (excursion) exc.push({ id: 'exc-seed-2', number: num('EXC', Y, 2), title: `Temperature excursion ${excursion.number}`, type: 'Temperature excursion', severity: 'Critical', referenceLabel: excursion.number, link: `/qa/temperature/${excursion.id}`, assignedTo: '', dueAt: now.add(1, 'hour').toISOString(), description: `${excursion.area}: ${excursion.reading} °C (allowed ${excursion.minAllowed} to ${excursion.maxAllowed}).`, resolution: '', sourceKey: `temp:${excursion.id}`, status: 'OPEN', ...meta(now, 0), history: [] })

  return {
    [K.ENTERPRISE_SETTINGS]: { version: 1, finance: { vatRate: 5, matchTolerancePct: 1, currencyNote: 'Amounts use the application currency (Settings › Localization).' }, warehouse: { pickingRule: 'FEFO' }, approvals: { poApprovalThreshold: 0 } },
    [K.WAREHOUSE_LOCATIONS]: locations,
    [K.BATCHES]: batches,
    [K.BATCH_LEDGER_STATE]: state,
    [K.LEADS]: leads, [K.OPPORTUNITIES]: opportunities, [K.SALES_VISITS]: visits, [K.SALES_TARGETS]: targets, [K.COMMISSION_RULES]: commission,
    [K.PRICE_LISTS]: priceLists, [K.SALES_RETURNS]: salesReturns, [K.ORDER_CHANGE_REQUESTS]: orderChanges, [K.SERVICE_TICKETS]: tickets,
    [K.HORECA_ACCOUNTS]: horeca, [K.ORDER_TEMPLATES]: templates, [K.VAN_ASSIGNMENTS]: vanAssignments, [K.VAN_SALES]: [], [K.VAN_SETTLEMENTS]: [],
    [K.PURCHASE_REQUISITIONS]: reqs, [K.RFQS]: rfqs, [K.SUPPLIER_QUOTES]: quotes, [K.PURCHASE_ORDERS]: pos, [K.GOODS_RECEIPTS]: grns,
    [K.SUPPLIER_INVOICES]: supInvoices, [K.SUPPLIER_PAYMENTS]: [], [K.IMPORT_SHIPMENTS]: shipments,
    [K.PUTAWAY_TASKS]: [], [K.PICKING_TASKS]: picking, [K.PACKING_TASKS]: [], [K.LOADING_TASKS]: loading,
    [K.CYCLE_COUNTS]: cycleCounts, [K.PRODUCT_RECALLS]: [], [K.QA_INSPECTIONS]: qaInspections, [K.TEMPERATURE_LOGS]: tempLogs, [K.NONCONFORMANCES]: ncrs,
    [K.DELIVERY_RESCHEDULES]: reschedules, [K.ROUTE_PLANS]: routePlans, [K.VEHICLE_MAINTENANCE]: maintenance, [K.FUEL_LOGS]: fuel, [K.DRIVER_EXPENSES]: dexp,
    [K.CUSTOMER_PAYMENTS]: payments, [K.CREDIT_NOTES]: creditNotes, [K.EXPENSES]: expensesSeed, [K.BANK_ACCOUNTS]: banks, [K.VOUCHERS]: vouchersSeed, [K.CASH_CLOSINGS]: [],
    [K.EMPLOYEES]: employees, [K.JOB_REQUISITIONS]: jobReqs, [K.CANDIDATES]: cands, [K.EMPLOYEE_ATTENDANCE]: att, [K.LEAVE_REQUESTS]: leaveSeed, [K.SALARY_STRUCTURES]: salary, [K.PAYROLL]: [],
    [K.OPERATIONAL_EXCEPTIONS]: exc,
  }
}

/** Base-data view of a storage snapshot (key → value) for buildEnterpriseData. */
export const enterpriseInputFromSnapshot = (snap) => ({
  products: snap[K.PRODUCTS] || [], hubs: snap[K.HUBS] || [], inventory: snap[K.INVENTORY] || [], movements: snap[K.STOCK_MOVEMENTS] || [],
  customers: snap[K.CUSTOMERS] || [], orders: snap[K.ORDERS] || [], invoices: snap[K.INVOICES] || [], vehicles: snap[K.VEHICLES] || [],
  drivers: snap[K.DRIVERS] || [], users: snap[K.DEMO_USERS] || [], receipts: snap[K.STOCK_RECEIPTS] || [], dispatches: snap[K.DISPATCHES] || [],
})
