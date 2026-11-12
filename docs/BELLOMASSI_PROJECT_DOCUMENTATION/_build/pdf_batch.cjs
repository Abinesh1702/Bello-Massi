// Render a batch of HTML documents to PDF (cover page without header/footer is page 1).
const { chromium } = require('playwright')
const fs = require('fs')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
;(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
  const browser = await chromium.launch()
  const page = await browser.newPage()
  for (const j of jobs) {
    await page.goto('file://' + j.html, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    const hdr = `<div style="width:100%;font:7.5pt Inter,Arial,sans-serif;color:#6B7285;padding:0 15mm;display:flex;justify-content:space-between;border-bottom:0.5pt solid #DCE0EA;padding-bottom:3px;margin-top:6mm"><span style="color:#232B5F;font-weight:700">BELLOMASSI</span><span>${esc(j.ref)}</span></div>`
    const ftr = `<div style="width:100%;font:7.5pt Inter,Arial,sans-serif;color:#6B7285;padding:0 15mm;display:flex;justify-content:space-between;margin-bottom:5mm"><span>Draft for client review · not approved</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`
    await page.pdf({ path: j.pdf + '.body', format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: hdr, footerTemplate: ftr, margin: { top: '20mm', bottom: '18mm', left: '15mm', right: '15mm' } })
    await page.goto('file://' + j.cover, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.pdf({ path: j.pdf + '.cover', format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 }, pageRanges: '1' })

  }
  await browser.close()
})()
