// Real screenshots of the running prototype (vite preview on :4173). Usage: node shots.cjs <outdir>
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:4173';
const DESK = { width: 1440, height: 900 }, MOB = { width: 390, height: 844 };
const PLAN = [
 ['superadmin', 'Super@123', '/login', DESK, [
   ['UX-LOGIN', null], ['UX-DASH-SA', '/dashboard'], ['UX-USERS', '/admin/users'], ['UX-ROLES', '/admin/roles'], ['UX-PERMS', '/admin/permissions'],
   ['UX-AUDIT', '/admin/audit-logs'], ['UX-SETTINGS', '/admin/settings'], ['UX-COMPANY', '/admin/organization/company'],
   ['UX-CUSTOMERS', '/customers'], ['UX-CUSTOMER-DETAIL', '/customers/:customer'], ['UX-CREDIT', '/customers/credit'],
   ['UX-PRODUCTS', '/products'], ['UX-HUBS', '/hubs'], ['UX-SUPPLIERS', '/suppliers'],
   ['UX-ORDERS', '/orders'], ['UX-ORDER-DETAIL', '/orders/:order'], ['UX-REPORTS', '/reports/center'],
   ['UX-INVENTORY', '/inventory'], ['UX-STOCK', '/inventory/stock'], ['UX-MOVEMENTS', '/inventory/movements'], ['UX-SCRAP', '/inventory/scrap/requests'],
   ['UX-WAREHOUSE', '/warehouse'], ['UX-QUALITY', '/quality'], ['UX-VMS', '/vms'], ['UX-VMS-EXPIRY', '/vms/document-expiry'],
   ['UX-DOCUMENTS', '/documents'], ['UX-OCR', '/documents/ocr-queue'], ['UX-INVOICES', '/invoices'], ['UX-INVOICE-TPL', '/invoices/templates'],
   ['UX-EMAIL', '/communication/email'], ['UX-WHATSAPP', '/communication/whatsapp'], ['UX-CALLS', '/communication/calls'],
   ['UX-AI', '/ai'], ['UX-FORECAST', '/ai/forecasting'], ['UX-NOTIFICATIONS', '/notifications']]],
 ['salesman', 'Sales@123', '/login', DESK, [['UX-DASH-SE', '/dashboard'], ['UX-ORDER-CREATE', '/orders/create'], ['UX-MY-ORDERS', '/orders/my-orders']]],
 ['manager', 'Manager@123', '/login', DESK, [['UX-DASH-SM', '/dashboard'], ['UX-APPROVAL', '/orders/approval'], ['UX-APPROVAL-DETAIL', '/orders/approval/:submitted']]],
 ['cs', 'Cs@123', '/login', DESK, [['UX-DASH-CS', '/dashboard'], ['UX-CONSOLIDATION', '/orders/consolidation']]],
 ['dispatcher', 'Dispatch@123', '/login', DESK, [['UX-DASH-DP', '/dashboard'], ['UX-READY', '/dispatch/ready-orders'], ['UX-PLANNING', '/dispatch/planning'],
   ['UX-DISPATCH-LIST', '/dispatch'], ['UX-DISPATCH-DETAIL', '/dispatch/:dispatch'], ['UX-DISPATCH-CREATE', '/dispatch/create'], ['UX-ZONES', '/dispatch/zones'],
   ['UX-DRIVERS', '/dispatch/drivers'], ['UX-VEHICLES', '/dispatch/vehicles'], ['UX-TRACKING', '/dispatch/delivery-tracking'], ['UX-LIVE', '/dispatch/live-tracking'],
   ['UX-DELIVERY-REVIEW', '/dispatch/deliveries/:delivery'], ['UX-DN', '/dispatch/delivery-notes/:note'], ['UX-DELIVERY-HISTORY', '/dispatch/delivery-history']]],
 ['finance', 'Finance@123', '/login', DESK, [['UX-DASH-FI', '/dashboard'], ['UX-INVOICE-DASH', '/invoices/dashboard']]],
 ['driver', 'Driver@123', '/driver/login', MOB, [['UX-DRV-LOGIN', null], ['UX-DRV-DASH', '/driver/dashboard'], ['UX-DRV-DELIVERIES', '/driver/deliveries'],
   ['UX-DRV-DELIVERY', '/driver/deliveries/:mydelivery'], ['UX-DRV-ROUTE', '/driver/route'], 
   ['UX-DRV-COMPLETED', '/driver/completed'], ['UX-DRV-NOTES', '/driver/delivery-notes'], ['UX-DRV-PROFILE', '/driver/profile']]],
 ['customer', 'Customer@123', '/customer/login', MOB, [['UX-CUS-LOGIN', null], ['UX-CUS-DASH', '/customer/dashboard'], ['UX-CUS-CATALOG', '/customer/catalog'],
   ['UX-CUS-CART', '/customer/cart'], ['UX-CUS-ORDERS', '/customer/orders'], ['UX-CUS-ORDER', '/customer/orders/:myorder'], ['UX-CUS-NOTES', '/customer/delivery-notes'],
   ['UX-CUS-INVOICES', '/customer/invoices'], ['UX-CUS-PROFILE', '/customer/profile']]],
];
const ids = async (page) => page.evaluate(() => {
  const g = (k) => { try { return JSON.parse(localStorage.getItem(k)) || [] } catch { return [] } };
  const sess = (() => { try { return JSON.parse(localStorage.getItem('bellomassi_session')) || {} } catch { return {} } })();
  const users = g('bellomassi_demo_users'); const me = users.find(u => u.id === (sess.userId || sess.user?.id)) || {};
  const orders = g('bellomassi_orders'), dels = g('bellomassi_deliveries'), drivers = g('bellomassi_drivers');
  const drv = drivers.find(d => d.userId === me.id || d.email === me.email) || {};
  const myd = dels.find(d => d.driverId === drv.id && !['delivered', 'completed'].includes(d.status)) || dels.find(d => d.driverId === drv.id) || dels[0] || {};
  return { customer: g('bellomassi_customers')[0]?.id, order: orders[0]?.id, submitted: (orders.find(o => o.status === 'submitted') || orders[0])?.id,
    dispatch: g('bellomassi_dispatches')[0]?.id, delivery: (dels.find(d => ['failed', 'partial', 'partially_delivered'].includes(d.status)) || dels[0])?.id,
    note: g('bellomassi_delivery_notes')[0]?.id, mydelivery: myd.id, myorder: (orders.find(o => o.customerId === me.customerId) || {}).id };
});
(async () => {
  const b = await chromium.launch(); const log = []; const meta = {};
  for (const [user, pw, login, vp, shots] of PLAN) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const page = await ctx.newPage(); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(BASE + login); await page.waitForTimeout(1200);
    const l0 = shots.find(s => s[1] === null); if (l0) await page.screenshot({ path: path.join(OUT, l0[0] + '.png') });
    await page.locator('input:not([type=password]):not([type=checkbox])').first().fill(user);
    await page.locator('input[type=password]').first().fill(pw); await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    if (page.url().includes('change-password')) log.push(user + ' must change password');
    const I = await ids(page);
    for (const [name, route] of shots) {
      if (!route) continue;
      const r = route.replace(/:([a-z]+)/g, (_, k) => I[k] || 'missing');
      try {
        await page.goto(BASE + r); await page.waitForTimeout(1300);
        const fin = new URL(page.url()).pathname;
        await page.screenshot({ path: path.join(OUT, name + '.png') });
        meta[name] = await page.evaluate(() => {
          const main = document.querySelector('main') || document.body;
          const t = (els) => [...new Set([...els].map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')).filter(x => x && x.length < 60))];
          return { h1: t(main.querySelectorAll('h1')), h2: t(main.querySelectorAll('h2,h3')).slice(0, 25), buttons: t(main.querySelectorAll('button,a[role=button]')).slice(0, 40),
            th: t(main.querySelectorAll('th')).slice(0, 30), labels: t(main.querySelectorAll('label')).slice(0, 40), tabs: t(main.querySelectorAll('[role=tab]')).slice(0, 20) };
        });
        log.push([name, user, r, fin, fin === r ? 'ok' : 'REDIRECTED'].join('\t'));
      } catch (e) { log.push([name, user, r, 'ERROR ' + e.message.split('\n')[0]].join('\t')) }
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, '_log.tsv'), log.join('\n')); fs.writeFileSync(path.join(OUT, '_meta.json'), JSON.stringify(meta, null, 1)); console.log(log.join('\n')); await b.close();
})();
