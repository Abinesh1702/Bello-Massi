// Driver stop flow screenshots (real interactions on the prototype). Usage: node shots_flow.cjs <outdir>
const { chromium } = require('playwright'); const path = require('path');
const OUT = process.argv[2]; const BASE = 'http://localhost:4173';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); const page = await ctx.newPage();
  const snap = async (n, full) => { await page.waitForTimeout(900); await page.screenshot({ path: path.join(OUT, n + '.png'), fullPage: !!full }); console.log('shot', n, new URL(page.url()).pathname); };
  await page.goto(BASE + '/driver/login'); await page.waitForTimeout(1000);
  await page.locator('input:not([type=password]):not([type=checkbox])').first().fill('driver');
  await page.locator('input[type=password]').first().fill('Driver@123'); await page.keyboard.press('Enter'); await page.waitForTimeout(1800);
  const id = await page.evaluate(() => {
    const g = k => JSON.parse(localStorage.getItem(k) || '[]'); const s = JSON.parse(localStorage.getItem('bellomassi_session') || '{}');
    const u = g('bellomassi_demo_users').find(x => x.id === (s.userId || s.user?.id)) || {}; const drv = g('bellomassi_drivers').find(d => d.userId === u.id || d.email === u.email) || {};
    const ds = g('bellomassi_dispatches'); const dl = g('bellomassi_deliveries').filter(d => d.driverId === drv.id);
    const act = dl.find(d => d.status === 'OUT_FOR_DELIVERY'); if (act) return act.id;
    const ok = dl.filter(d => d.status === 'DISPATCHED' && ['CONFIRMED', 'IN_TRANSIT'].includes((ds.find(x => x.id === d.dispatchId) || {}).status)).sort((a, c) => (a.sequence || 0) - (c.sequence || 0));
    return ok[0] && ok[0].id;
  });
  console.log('delivery', id);
  await page.goto(BASE + '/driver/deliveries/' + id); await snap('MAN-DRV-01-stop');
  const start = page.getByRole('button', { name: 'Start delivery' });
  if (await start.count()) { await start.first().click(); await snap('MAN-DRV-02-start-dialog'); await page.getByRole('dialog').getByRole('button', { name: 'Start delivery' }).click(); await snap('MAN-DRV-03-out-for-delivery'); }
  const reach = page.getByRole('button', { name: 'Reach location' });
  if (await reach.count()) { await reach.first().click(); await snap('MAN-DRV-04-reach-dialog'); const dlg = page.getByRole('dialog'); await dlg.getByRole('button').last().click(); await snap('MAN-DRV-05-arrived'); }
  await page.goto(BASE + '/driver/deliveries/' + id + '/confirm'); await snap('MAN-DRV-06-pod-form'); await snap('MAN-DRV-07-pod-form-full', true);
  await b.close();
})();
