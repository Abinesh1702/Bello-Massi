/**
 * Demo natural-language understanding: ordered patterns that map a question or command to a tool
 * call, a page, or a confirmation-gated hand-off. Deterministic and explainable — no model involved.
 * When a real AI provider is connected it still runs first, so the provider only ever receives
 * permission-filtered tool results, never raw application data.
 */
import dayjs from 'dayjs'
import { NAV_ITEMS, canAccessPath } from '../../config/navigation'
import { getNumberingPrefix } from '../../config/runtimeConfig'

const norm = (t) => String(t || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()

/** Strip the wake word ("Jarvis, …") and polite filler. */
export const stripWakeWord = (text, wake = 'jarvis') => String(text || '').replace(new RegExp(`^\\s*(hey |ok |okay )?${wake}[,!.: ]*`, 'i'), '').replace(/^(please|can you|could you|would you)\s+/i, '').replace(/\s*please[.!?]*$/i, '').trim()

export const extractPeriod = (t) => {
  if (/\btoday\b|\btoday's\b/.test(t)) return 'today'
  if (/\byesterday\b/.test(t)) return 'yesterday'
  if (/last month|previous month/.test(t)) return 'last_month'
  if (/this month|month to date|monthly|for the month|this month's|month's/.test(t)) return 'month'
  if (/this week|last 7 days|past week|last week/.test(t)) return 'week'
  if (/this year|year to date|ytd/.test(t)) return 'year'
  if (/last 30 days|past 30 days|30 days/.test(t)) return '30d'
  return null
}

export const extractDays = (t, fallback = 7) => {
  const m = t.match(/(next|within|in|coming)\s+(\d{1,3})\s+days?/) || t.match(/(\d{1,3})\s+days?/)
  if (m) return Math.min(90, Number(m[2] || m[1]))
  if (/next week|this week|7 days|a week/.test(t)) return 7
  if (/two weeks|fortnight|14 days/.test(t)) return 14
  if (/next month|30 days|a month/.test(t)) return 30
  if (/quarter|90 days/.test(t)) return 90
  return fallback
}

export const extractOrderNumber = (raw) => {
  const prefix = getNumberingPrefix('order').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = String(raw).match(new RegExp(`${prefix}-\\d{4}-\\d{5}`, 'i')) || String(raw).match(/BM-ORD-\d{4}-\d{5}/i)
  if (m) return m[0].toUpperCase()
  const n = String(raw).match(/order\s*(?:number|no\.?|#)?\s*(\d{1,5})\b/i)
  return n ? `${getNumberingPrefix('order')}-${dayjs().year()}-${String(n[1]).padStart(5, '0')}` : null
}

const findHub = (t, hubs = []) => hubs.find((h) => {
  const first = norm(h.name).split(' ')[0]
  return first.length > 3 && new RegExp(`\\b${first}\\b`).test(t)
})

const findProduct = (t, products = []) => [...products].sort((a, b) => b.name.length - a.name.length).find((p) => {
  const n = norm(p.name).replace(/\(.*?\)/g, '').trim()
  return n.length > 3 && t.includes(n)
})

/** Match "open inventory" / "go to dispatch planning" against the navigation labels the role can open. */
export const matchPage = (phrase, role) => {
  const q = norm(phrase).replace(/^(the|my)\s+/, '').replace(/\s+(page|screen|module|section)$/, '')
  if (!q) return null
  const items = NAV_ITEMS.filter((i) => !i.hidden && !i.redirectTo && !i.path.includes(':') && canAccessPath(i.path, role))
  const exact = items.find((i) => norm(i.label) === q)
  if (exact) return exact
  const starts = items.filter((i) => norm(i.label).startsWith(q) || q.startsWith(norm(i.label)))
  if (starts.length) return starts.sort((a, b) => a.path.split('/').length - b.path.split('/').length)[0]
  const kw = items.find((i) => (i.keywords || []).some((k) => norm(k) === q) || norm(i.label).includes(q))
  return kw || null
}

/** Actions that change data and are only handed to their screen after confirmation. */
const HANDOFFS = [
  { re: /\bcancel\b.*\border\b/, label: 'Order cancellation', why: 'Orders are never cancelled by the assistant. Open the order to reject it (if pending) or contact the approver.', path: (raw) => ({ orderNumber: extractOrderNumber(raw), base: '/orders' }) },
  { re: /\b(adjust|correct|write off|reduce|increase)\b.*\b(inventory|stock)\b|\bstock adjustment\b/, label: 'Inventory adjustment', why: 'Stock adjustments change on-hand quantity and are recorded only through the Stock Adjustment form.', path: () => ({ base: '/inventory/stock-adjustments/create' }) },
  { re: /\b(modify|edit|change|update|cancel)\b.*\binvoice\b/, label: 'Invoice modification', why: 'Issued invoices are immutable snapshots; corrections are made by cancelling and re-issuing on the invoice screen.', path: () => ({ base: '/invoices' }) },
  { re: /\b(delete|remove)\b.*\bcustomer\b/, label: 'Customer deletion', why: 'Customers are only deleted from the customer screen, which checks for linked orders first.', path: () => ({ base: '/customers' }) },
  { re: /\bassign\b.*\b(vehicle|driver|truck)\b/, label: 'Vehicle / driver assignment', why: 'Assignments are validated for compliance and availability on the Driver Assignment screen.', path: () => ({ base: '/dispatch/assignments' }) },
  { re: /\b(create|new|plan|make)\b.*\bdispatch\b/, label: 'Dispatch creation', why: 'Dispatches are created on the dispatch form, which checks stock, vehicle capacity and compliance.', path: () => ({ base: '/dispatch/create' }) },
  { re: /\b(send|email|mail)\b.*\b(email|mail)\b|\bsend an? email\b/, label: 'Email sending', why: 'Emails are composed and sent from the Email module so you can review the recipient and content.', path: () => ({ base: '/communication/email/compose' }) },
  { re: /\b(send|message)\b.*\bwhats ?app\b|\bwhats ?app\b.*\bsend\b/, label: 'WhatsApp sending', why: 'WhatsApp messages are sent from the WhatsApp module after you review the recipient and text.', path: () => ({ base: '/communication/whatsapp/compose' }) },
  { re: /\b(refund|payment|pay|credit note|write-?off|collect)\b/, label: 'Financial transaction', why: 'Financial transactions are never executed by the assistant. Open customer credit to review.', path: () => ({ base: '/customers/credit' }) },
]

/**
 * @returns { kind: 'tool', tool, args, label } | { kind: 'handoff', ... } | { kind: 'help' } | { kind: 'smalltalk', text } | { kind: 'unknown' }
 */
export const parseIntent = (rawText, { role, hubs = [], products = [], wakeWord = 'jarvis' } = {}) => {
  const raw = stripWakeWord(rawText, wakeWord)
  const t = norm(raw)
  if (!t) return { kind: 'unknown', raw }
  const tool = (name, args = {}, label = '') => ({ kind: 'tool', tool: name, args, label, raw })
  const period = extractPeriod(t)
  const hub = findHub(t, hubs)

  if (/^(help|what can you do|what can i ask|commands|\?)$/.test(t) || /what can (you|jarvis) do/.test(t)) return { kind: 'help', raw }
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|thanks|thank you)\b/.test(t) && t.split(' ').length <= 4) return { kind: 'smalltalk', raw }

  // Approval decisions (write tools — confirmation required)
  if (/\bapprove\b/.test(t) && extractOrderNumber(raw)) return tool('approve_order', { orderNumber: extractOrderNumber(raw) }, 'Approve order')
  if (/\breject\b/.test(t) && extractOrderNumber(raw)) {
    const reason = (raw.match(/\b(?:because|reason[:\s]+|as)\s+(.+)$/i) || [])[1] || ''
    return tool('reject_order', { orderNumber: extractOrderNumber(raw), reason }, 'Reject order')
  }
  if (/\b(create|make|raise|generate|prepare|draft)\b.*\b(replenishment|purchase|reorder|restock)\b/.test(t)) return tool('create_replenishment_draft', { hubId: hub?.id || '' }, 'Create replenishment draft')

  for (const h of HANDOFFS) {
    if (h.re.test(t)) {
      const p = h.path(raw)
      return { kind: 'handoff', label: h.label, why: h.why, path: p.base, orderNumber: p.orderNumber || null, raw }
    }
  }

  if (/\b(run out|runs out|stock[- ]?outs?|stockouts?|out of stock (soon|next|in)|may run out)\b/.test(t)) return tool('get_stockout_predictions', { days: extractDays(t, 7), hubId: hub?.id }, 'Stock-out predictions')
  if (/\b(reorder\w*|replenish\w*|restock\w*|re-order)\b|should we (order|buy)|what (should|do) we need to (order|buy)/.test(t)) return tool('get_reorder_recommendations', { hubId: hub?.id }, 'Reorder recommendations')
  if (/(why|explain|reason).*(inventory|stock).*(decreas|reduc|drop|down|fall|declin|low)/.test(t)) return tool('get_inventory', { explain: true, hubId: hub?.id }, 'Explain inventory')
  if (/\blow (in )?stock\b|\blow-stock\b|running low|short of stock|stock shortage/.test(t)) return tool('get_low_stock', { hubId: hub?.id }, 'Low stock')
  if (/(which|what) hub.*(most|highest|largest|biggest|maximum).*(inventory|stock)|inventory by hub|stock by hub/.test(t)) return tool('get_inventory', { groupBy: 'hub' }, 'Inventory by hub')
  if (/inventory by category|stock by category/.test(t)) return tool('get_inventory', { groupBy: 'category' }, 'Inventory by category')
  if (/how much (inventory|stock)|inventory (is )?available|available (inventory|stock)|stock (level|position)s?|inventory (summary|overview|status)/.test(t)) return tool('get_inventory', { groupBy: 'hub', hubId: hub?.id }, 'Inventory')

  if (/(pending|awaiting|waiting for|need|needing) approval|to approve|approval queue|pending approvals?/.test(t)) return tool('get_orders', { status: 'SUBMITTED' }, 'Orders awaiting approval')
  if (/orders? (pending|awaiting|waiting for|ready for|not yet) (dispatch|dispatched)|ready for dispatch/.test(t)) return tool('get_orders', { status: 'APPROVED,CONSOLIDATED,READY_FOR_DISPATCH' }, 'Orders pending dispatch')
  if (/pending dispatch(es)?|dispatch(es)? (pending|planned|today)|show dispatch(es)?|dispatch status/.test(t)) return tool('get_dispatches', { status: 'pending' }, 'Pending dispatches')
  if (/(on the road|in transit|out for delivery)/.test(t)) return tool('get_dispatches', { status: 'active' }, 'Dispatches in transit')
  if (/customers?.*(overdue|delayed|late).*(deliver)|(overdue|delayed|late) deliver.*customers?/.test(t)) return tool('get_deliveries', { delayed: true, groupBy: 'customer' }, 'Customers with overdue deliveries')
  if (/(delay|late|overdue|behind).*(deliver)|deliver.*(delay|late|overdue)/.test(t)) return tool('get_deliveries', { delayed: true }, 'Delayed deliveries')

  if (/(vehicle|truck|fleet).*(expir|document|insurance|permit|fitness|puc|rc)|(expir|document).*(vehicle|truck)/.test(t)) return tool('get_vehicle_status', { expiring: true, days: /\b(\d{1,3}) days\b/.test(t) ? extractDays(t, 30) : 30 }, 'Vehicle document expiry')
  if (/\b(vehicle|vehicles|fleet|trucks?)\b/.test(t)) return tool('get_vehicle_status', {}, 'Fleet status')

  if (/\b(forecast|predict|projection|project)\b/.test(t) && !/stock|inventory/.test(t)) {
    const target = /\border(s| count)\b/.test(t) && !/value|revenue/.test(t) ? 'orders' : /\b(units|demand|quantity|volume)\b/.test(t) ? 'quantity' : 'revenue'
    const product = findProduct(t, products)
    return tool('generate_sales_forecast', { target: product ? 'quantity' : target, horizonDays: extractDays(t, 30), granularity: /week/.test(t) && !/next week/.test(t) ? 'week' : 'day', productId: product?.id, hubId: hub?.id }, 'Sales forecast')
  }
  if (/(monthly|month[- ]on[- ]month|per month|by month).*(sales|revenue|trend)|sales trend|revenue trend/.test(t)) return tool('get_sales_summary', { groupBy: 'month' }, 'Monthly sales trend')
  if (/(top|highest|best|biggest|largest|most)\b.*\bcustomers?\b|customers?.*(highest|most|largest|top).*(order|volume|sales|value)/.test(t)) return tool('get_sales_summary', { groupBy: 'customer', period: period || '30d' }, 'Top customers')
  if (/(top|best)[- ]?selling|most (sold|ordered|popular)|top products|best products|fast[- ]moving/.test(t)) return tool('get_sales_summary', { groupBy: 'product', period: period || '30d' }, 'Top-selling products')
  if (/sales by hub|revenue by hub|which hub.*(sales|revenue|orders)/.test(t)) return tool('get_sales_summary', { groupBy: 'hub', period: period || '30d' }, 'Sales by hub')
  if (/\breport\b/.test(t)) {
    const report = /deliver/.test(t) ? 'delivery' : /inventory|stock/.test(t) ? 'inventory' : /invoice/.test(t) ? 'invoices' : /forecast/.test(t) ? 'forecast' : 'sales'
    return tool('generate_report', { report, period: period || 'month' }, 'Generate report')
  }
  if (/summar(y|ise|ize)|brief me|how (is|are) (we|things|business) (doing|going)|business (today|update)|daily (summary|brief)/.test(t)) {
    if (/sales/.test(t)) return tool('get_sales_summary', { period: period || 'month' }, 'Sales summary')
    return tool('get_dashboard_summary', {}, 'Business summary')
  }
  if (/(total|value|worth|revenue|sales|turnover).*(today|this week|this month|yesterday|this year)|(today|yesterday)'?s? (total|order value|sales|revenue)/.test(t)) return tool('get_sales_summary', { period: period || 'today' }, 'Sales')

  const cust = raw.match(/(?:find|search|look ?up|lookup|show|open|who is)\s+(?:the\s+)?customer\s+(.+)/i) || raw.match(/customer\s+(?:named|called)\s+(.+)/i)
  if (cust) return tool('search_customer', { q: cust[1].replace(/[?.!]+$/, '').trim() }, 'Find customer')
  const prod = raw.match(/(?:find|search|look ?up|lookup|show)\s+(?:the\s+)?products?\s+(.+)/i)
  if (prod && !/low|stock/.test(norm(prod[1]))) return tool('search_product', { q: prod[1].replace(/[?.!]+$/, '').trim() }, 'Find product')
  if (/notification|alerts? for me|anything new/.test(t)) return tool('get_notifications', { unreadOnly: true }, 'Notifications')

  const ord = extractOrderNumber(raw)
  if (ord && /\border\b|bm-ord/.test(t)) return tool('get_orders', { q: ord, period: 'all' }, 'Order lookup')
  if (/\borders?\b/.test(t) && (period || /show|list|what|which|how many/.test(t))) {
    const statusMap = [[/delivered/, 'DELIVERED'], [/rejected/, 'REJECTED'], [/returned/, 'RETURNED'], [/draft/, 'DRAFT'], [/submitted/, 'SUBMITTED'], [/approved/, 'APPROVED']]
    const st = statusMap.find(([re]) => re.test(t))
    return tool('get_orders', { period: period || 'all', status: st ? st[1] : undefined }, 'Orders')
  }

  const nav = t.match(/^(?:open|go to|goto|navigate to|take me to|show me the|show me|show|launch|bring up)\s+(.+)$/)
  if (nav) {
    const page = matchPage(nav[1], role)
    if (page) return tool('navigate_to_page', { path: page.path }, `Open ${page.label}`)
  }
  const pageOnly = matchPage(t, role)
  if (pageOnly && t.split(' ').length <= 3) return tool('navigate_to_page', { path: pageOnly.path }, `Open ${pageOnly.label}`)
  return { kind: 'unknown', raw }
}

export const EXAMPLE_QUESTIONS = [
  'How many orders are pending approval?',
  "What is today's total order value?",
  'Which customers have the highest order volume?',
  'Which products are low in stock?',
  'Show orders pending dispatch.',
  'Which deliveries are delayed?',
  'Which vehicles are expiring their documents?',
  'What is the monthly sales trend?',
  'Which hub has the highest inventory?',
  'Which customers have overdue deliveries?',
  'What are the top-selling products?',
  'Which products may run out next week?',
  'Generate a sales summary for this month.',
  'Explain why inventory is decreasing.',
  'Recommend products for replenishment.',
]

export const JARVIS_EXAMPLES = [
  "Jarvis, show today's orders.",
  'Jarvis, how much inventory is available?',
  'Jarvis, show pending dispatches.',
  'Jarvis, find customer ABC.',
  'Jarvis, show delayed deliveries.',
  "Jarvis, generate this month's sales report.",
  'Jarvis, which products should we reorder?',
  'Jarvis, show vehicles with expiring documents.',
  "Jarvis, summarize today's business.",
  'Open inventory.',
  'Show low stock products.',
]
