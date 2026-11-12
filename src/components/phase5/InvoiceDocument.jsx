import Logo from '../common/Logo'
import { PAGE_FORMATS, CURRENCIES } from '../../config/invoiceConfig'

const SYMBOL = Object.fromEntries(CURRENCIES.map((c) => [c.value, c.symbol]))
const fmtDate = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

/**
 * Printable invoice rendered only from the invoice's own snapshot (template + customer + totals),
 * so an issued invoice always looks the way it did when issued. Always a light "paper" document.
 */
export default function InvoiceDocument({ invoice, preview = false, className = '' }) {
  const t = invoice.templateSnapshot
  const c = invoice.customerSnapshot
  const tot = invoice.totals
  const vis = Object.fromEntries((t.fields || []).map((f) => [f.key, f.visible]))
  const order = (t.fields || []).map((f) => f.key)
  const nf = new Intl.NumberFormat(t.numberFormat || 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const money = (v) => `${SYMBOL[t.currency] || ''}${nf.format(Number(v) || 0)}`
  const qty = (v) => new Intl.NumberFormat(t.numberFormat || 'en-IN', { maximumFractionDigits: 3 }).format(Number(v) || 0)
  const page = PAGE_FORMATS.find((p) => p.value === t.pageFormat) || PAGE_FORMATS[0]
  const widthMm = t.pageFormat === 'CUSTOM' ? Number(t.customWidth) : page.width
  const heightMm = t.pageFormat === 'CUSTOM' ? Number(t.customHeight) : page.height
  const primary = t.primaryColor
  const accent = t.accentColor
  const muted = '#5b6478'
  const cancelled = invoice.status === 'CANCELLED'

  const itemCols = [
    { key: 'productSku', label: 'SKU', nowrap: true, cell: (l) => l.sku || l.productCode },
    { key: 'productDescription', label: 'Description', cell: (l) => l.description || '—' },
    { key: 'quantity', label: 'Qty', align: 'right', cell: (l) => `${qty(l.quantity)} ${l.unit || ''}` },
    { key: 'unitPrice', label: 'Rate', align: 'right', cell: (l) => money(l.unitPrice) },
    { key: 'discount', label: 'Disc.', align: 'right', cell: (l) => (l.itemDiscount + l.orderDiscountShare ? `−${money(l.itemDiscount + l.orderDiscountShare)}` : '—') },
    { key: 'tax', label: 'Tax', align: 'right', cell: (l) => `${l.taxRate}% · ${money(l.taxAmount)}` },
    { key: 'subtotal', label: 'Amount', align: 'right', cell: (l) => money(l.lineTotal) },
  ].filter((col) => vis[col.key] !== false).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))

  const refs = [
    { key: 'orderReference', label: 'Order', value: invoice.orderNumber },
    { key: 'dispatchReference', label: 'Dispatch', value: invoice.dispatchNumber || '—' },
    { key: 'deliveryNoteReference', label: 'Delivery note', value: invoice.deliveryNoteNumber || '—' },
    { key: 'hubDetails', label: 'Dispatched from', value: invoice.hubSnapshot ? `${invoice.hubSnapshot.name}${invoice.hubSnapshot.address ? `, ${invoice.hubSnapshot.address}` : ''}` : '—' },
  ].filter((r) => vis[r.key] !== false).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))

  const logo = vis.companyLogo === false ? null : t.company?.logo === 'builtin'
    ? <div style={{ background: '#232B5F', borderRadius: 10, padding: 8, display: 'inline-flex' }}><Logo className="h-9 w-auto" /></div>
    : t.company?.logo ? <img src={t.company.logo} alt={`${t.company.name} logo`} style={{ maxHeight: 52, maxWidth: 160, objectFit: 'contain' }} /> : null

  const titleBlock = (
    <div style={{ textAlign: t.headerLayout === 'centered' ? 'center' : 'right', flex: '0 0 auto' }}>
      <p style={{ fontSize: '0.75em', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.headerLayout === 'banner' ? '#ffffffcc' : muted, fontWeight: 600 }}>{t.invoiceTitle}</p>
      <p style={{ fontSize: '1.6em', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }} data-testid="invoice-number">{invoice.invoiceNumber}</p>
      <p style={{ fontSize: '0.85em', color: t.headerLayout === 'banner' ? '#ffffffcc' : muted }}>Date {fmtDate(invoice.invoiceDate)}{invoice.dueDate ? ` · Due ${fmtDate(invoice.dueDate)}` : ''}</p>
    </div>
  )
  const companyBlock = (
    <div style={{ textAlign: t.headerLayout === 'centered' ? 'center' : 'left' }}>
      <p style={{ fontSize: '1.15em', fontWeight: 700 }}>{t.company?.name}</p>
      <p style={{ fontSize: '0.85em', whiteSpace: 'pre-line', color: t.headerLayout === 'banner' ? '#ffffffdd' : muted }}>{t.company?.address}</p>
      <p style={{ fontSize: '0.8em', color: t.headerLayout === 'banner' ? '#ffffffdd' : muted }}>
        {[vis.gstNumber !== false && t.company?.gstNumber && `GSTIN ${t.company.gstNumber}`, vis.panNumber !== false && t.company?.panNumber && `PAN ${t.company.panNumber}`, t.company?.phone, t.company?.email].filter(Boolean).join(' · ')}
      </p>
    </div>
  )

  return (
    <article className={`print-area invoice-paper relative mx-auto ${className}`} aria-label={`Invoice ${invoice.invoiceNumber}`}
      style={{ fontFamily: `${t.font}, Inter, system-ui, sans-serif`, fontSize: `${t.fontSize}pt`, color: '#1b2236', background: '#ffffff', width: '100%', maxWidth: `${widthMm * 3.78}px`, minHeight: preview ? undefined : `${heightMm * 3.78}px`, padding: '28px 30px', borderRadius: 12, boxShadow: '0 1px 3px rgba(16,24,40,.12)', border: '1px solid #e3e7ef', '--inv-page': `${widthMm}mm ${heightMm}mm` }}>
      {cancelled && <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}><span style={{ transform: 'rotate(-24deg)', fontSize: '5em', fontWeight: 800, color: '#dc262622', border: '6px solid #dc262622', padding: '0 24px', borderRadius: 16 }}>CANCELLED</span></div>}
      <header style={{ display: t.headerLayout === 'centered' ? 'grid' : 'flex', justifyItems: 'center', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', paddingBottom: 14, borderBottom: `3px solid ${primary}`, ...(t.headerLayout === 'banner' ? { background: primary, color: '#fff', margin: '-28px -30px 0', padding: '22px 30px', borderRadius: '12px 12px 0 0', borderBottom: `4px solid ${accent}` } : {}) }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexDirection: t.headerLayout === 'centered' ? 'column' : 'row', flex: t.headerLayout === 'centered' ? undefined : '1 1 0', minWidth: 0 }}>{logo}<div style={{ minWidth: 0 }}>{companyBlock}</div></div>
        {titleBlock}
      </header>
      {t.headerText && <p style={{ marginTop: 10, fontSize: '0.85em', color: muted }}>{t.headerText}</p>}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 18 }}>
        <div style={{ background: '#f5f7fb', borderRadius: 10, padding: 12 }}>
          <p style={{ fontSize: '0.7em', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: primary }}>Bill to</p>
          <p style={{ fontWeight: 700, marginTop: 4 }}>{c.name}</p>
          {vis.billingAddress !== false && <p style={{ fontSize: '0.85em', color: muted }}>{c.billingAddress}</p>}
          {vis.customerAddress !== false && vis.billingAddress === false && <p style={{ fontSize: '0.85em', color: muted }}>{c.billingAddress}</p>}
          {vis.customerGst !== false && c.gstNumber && <p style={{ fontSize: '0.8em', color: muted }}>GSTIN {c.gstNumber}</p>}
          <p style={{ fontSize: '0.8em', color: muted }}>{[c.contactPerson, c.mobile].filter(Boolean).join(' · ')}</p>
        </div>
        {vis.shippingAddress !== false && (
          <div style={{ background: '#f5f7fb', borderRadius: 10, padding: 12 }}>
            <p style={{ fontSize: '0.7em', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: primary }}>Ship to</p>
            <p style={{ fontWeight: 700, marginTop: 4 }}>{c.name}</p>
            <p style={{ fontSize: '0.85em', color: muted }}>{c.shippingAddress}</p>
          </div>
        )}
        {refs.length > 0 && (
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '0.85em', alignContent: 'start', padding: 12 }}>
            {refs.map((r) => [<dt key={`${r.key}-t`} style={{ color: muted }}>{r.label}</dt>, <dd key={`${r.key}-d`} style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.value}</dd>])}
          </dl>
        )}
      </section>

      <div style={{ overflowX: 'auto', marginTop: 18 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em' }}>
          <thead>
            <tr style={{ background: primary, color: '#fff' }}>
              <th style={{ textAlign: 'left', padding: '7px 8px', borderRadius: '6px 0 0 6px' }}>#</th>
              <th style={{ textAlign: 'left', padding: '7px 8px' }}>Product</th>
              {itemCols.map((col, i) => <th key={col.key} style={{ textAlign: col.align || 'left', padding: '7px 8px', whiteSpace: 'nowrap', borderRadius: i === itemCols.length - 1 ? '0 6px 6px 0' : 0 }}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {tot.lines.map((l, i) => (
              <tr key={`${l.productId}-${i}`} style={{ borderBottom: '1px solid #e3e7ef' }}>
                <td style={{ padding: '7px 8px', color: muted }}>{i + 1}</td>
                <td style={{ padding: '7px 8px', fontWeight: 600 }}>{l.productName}</td>
                {itemCols.map((col) => <td key={col.key} style={{ padding: '7px 8px', textAlign: col.align || 'left', fontVariantNumeric: 'tabular-nums', whiteSpace: col.align || col.nowrap ? 'nowrap' : 'normal' }}>{col.cell(l)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginTop: 16 }}>
        <div style={{ flex: '1 1 240px', fontSize: '0.85em' }}>
          {vis.amountInWords !== false && <p><span style={{ color: muted }}>Amount in words: </span><strong>{tot.amountInWords}</strong></p>}
          {invoice.quantityBasis === 'DELIVERED' && <p style={{ color: muted, marginTop: 6 }}>Billed on delivered quantities ({invoice.deliveryNoteNumber}).</p>}
          {invoice.notes && <p style={{ marginTop: 6 }}>{invoice.notes}</p>}
          {vis.qrCode !== false && <div style={{ marginTop: 10, width: 84, height: 84, border: `2px dashed ${muted}`, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: '0.7em', color: muted, textAlign: 'center' }}>QR code<br />placeholder</div>}
        </div>
        <dl style={{ flex: '0 1 300px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '5px 16px', fontSize: '0.9em', fontVariantNumeric: 'tabular-nums' }}>
          {vis.subtotal !== false && <><dt style={{ color: muted }}>Subtotal</dt><dd style={{ textAlign: 'right' }}>{money(tot.subtotal)}</dd></>}
          {vis.discount !== false && tot.itemDiscount > 0 && <><dt style={{ color: muted }}>Item discount</dt><dd style={{ textAlign: 'right' }}>−{money(tot.itemDiscount)}</dd></>}
          {vis.discount !== false && tot.orderDiscount > 0 && <><dt style={{ color: muted }}>Order discount</dt><dd style={{ textAlign: 'right' }}>−{money(tot.orderDiscount)}</dd></>}
          <dt style={{ color: muted }}>Taxable amount</dt><dd style={{ textAlign: 'right' }}>{money(tot.taxableAmount)}</dd>
          {vis.tax !== false && <><dt style={{ color: muted }}>Tax (demo)</dt><dd style={{ textAlign: 'right' }}>{money(tot.taxAmount)}</dd></>}
          {tot.shippingCharges > 0 && <><dt style={{ color: muted }}>Shipping</dt><dd style={{ textAlign: 'right' }}>{money(tot.shippingCharges)}</dd></>}
          {tot.additionalCharges > 0 && <><dt style={{ color: muted }}>Additional charges</dt><dd style={{ textAlign: 'right' }}>{money(tot.additionalCharges)}</dd></>}
          <dt style={{ fontWeight: 700, borderTop: `2px solid ${primary}`, paddingTop: 6 }}>Grand total</dt>
          <dd style={{ fontWeight: 800, textAlign: 'right', borderTop: `2px solid ${primary}`, paddingTop: 6, fontSize: '1.15em', color: primary }} data-testid="invoice-total">{money(tot.grandTotal)}</dd>
        </dl>
      </section>

      <footer style={{ marginTop: 22, paddingTop: 12, borderTop: `1px solid #e3e7ef`, display: t.footerLayout === 'columns' ? 'grid' : 'block', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, fontSize: '0.8em' }}>
        {vis.termsAndConditions !== false && t.terms && <div><p style={{ fontWeight: 700, color: primary }}>Terms &amp; conditions</p><p style={{ whiteSpace: 'pre-line', color: muted }}>{t.terms}</p></div>}
        {vis.paymentInstructions !== false && t.paymentInstructions && <div style={{ marginTop: t.footerLayout === 'columns' ? 0 : 8 }}><p style={{ fontWeight: 700, color: primary }}>Payment</p><p style={{ color: muted }}>{t.paymentInstructions}</p></div>}
        {vis.signature !== false && <div style={{ textAlign: 'right', marginTop: t.footerLayout === 'columns' ? 0 : 12 }}><div style={{ height: 40 }} /><p style={{ borderTop: '1px solid #9aa3b5', paddingTop: 4, display: 'inline-block', minWidth: 160 }}>{t.signatureLabel || 'Authorised signatory'}</p></div>}
      </footer>
      <p style={{ marginTop: 14, fontSize: '0.72em', color: muted, borderTop: `3px solid ${accent}`, paddingTop: 6 }}>{t.footerText} Tax shown is a configurable demo calculation, not a GST-compliant tax invoice.</p>
    </article>
  )
}
