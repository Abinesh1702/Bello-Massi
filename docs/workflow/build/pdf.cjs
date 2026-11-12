// Render cover / body / toc HTML to PDF with Playwright (Chromium).
const { chromium } = require('playwright')
const path = require('path')
const [,, input, output, mode] = process.argv
;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('file://' + path.resolve(input), { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  const hdr = `<div style="width:100%;font:7.5pt Inter,Arial,sans-serif;color:#6B7285;padding:0 15mm;display:flex;justify-content:space-between;border-bottom:0.5pt solid #DCE0EA;padding-bottom:3px;margin-top:6mm"><span style="color:#232B5F;font-weight:700">BELLOMASSI</span><span>Complete Application Workflow Documentation · v1.0</span></div>`
  const ftr = mode === 'body'
    ? `<div style="width:100%;font:7.5pt Inter,Arial,sans-serif;color:#6B7285;padding:0 15mm;display:flex;justify-content:space-between;margin-bottom:5mm"><span>Prepared from the application source · documentation only</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`
    : `<div style="width:100%;font:7.5pt Inter,Arial,sans-serif;color:#6B7285;padding:0 15mm;text-align:right;margin-bottom:5mm">Contents</div>`
  const opts = { path: output, format: 'A4', printBackground: true }
  if (mode === 'cover') Object.assign(opts, { margin: { top: 0, bottom: 0, left: 0, right: 0 }, pageRanges: '1' })
  else Object.assign(opts, { displayHeaderFooter: true, headerTemplate: hdr, footerTemplate: ftr, margin: { top: '20mm', bottom: '18mm', left: '15mm', right: '15mm' } })
  await page.pdf(opts)
  await browser.close()
})()
