const { chromium } = require('playwright'); const path = require('path');
const OUT = process.argv[2]; const BASE = 'http://localhost:4173';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); const page = await ctx.newPage();
  const snap = async (n, full) => { await page.waitForTimeout(900); await page.screenshot({ path: path.join(OUT, n + '.png'), fullPage: !!full }); console.log('shot', n, new URL(page.url()).pathname); };
  await page.goto(BASE + '/customer/login'); await page.waitForTimeout(1000);
  await page.locator('input:not([type=password]):not([type=checkbox])').first().fill('customer');
  await page.locator('input[type=password]').first().fill('Customer@123'); await page.keyboard.press('Enter'); await page.waitForTimeout(1800);
  await page.goto(BASE + '/customer/catalog'); await page.waitForTimeout(1000);
  const add = page.getByRole('button', { name: /add/i }); console.log('add buttons', await add.count());
  for (let i = 0; i < Math.min(2, await add.count()); i++) { await add.nth(i).click(); await page.waitForTimeout(500); }
  await snap('MAN-CUS-01-catalog-added');
  await page.goto(BASE + '/customer/cart'); await snap('MAN-CUS-02-cart'); await snap('MAN-CUS-03-cart-full', true);
  const tid = await page.evaluate(() => { const g = k => JSON.parse(localStorage.getItem(k) || '[]'); const s = JSON.parse(localStorage.getItem('bellomassi_session') || '{}');
    const u = g('bellomassi_demo_users').find(x => x.id === (s.userId || s.user?.id)) || {}; const o = g('bellomassi_orders').filter(o => o.customerId === u.customerId);
    const dl = g('bellomassi_deliveries'); const a = o.find(o => dl.some(d => d.orderId === o.id && ['OUT_FOR_DELIVERY', 'DISPATCHED'].includes(d.status))); return (a || o[0] || {}).id; });
  await page.goto(BASE + '/customer/tracking/' + tid); await snap('MAN-CUS-04-tracking'); await snap('MAN-CUS-05-tracking-full', true);
  await b.close();
})();
