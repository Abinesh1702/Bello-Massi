import { FlaskConical, KeyRound, ScanText } from 'lucide-react'
import Badge from '../common/Badge'
import { DOCUMENT_STATUS_META } from '../../config/documentConfig'
import { EXPIRY_META } from '../../config/vmsConfig'
import { MESSAGE_STATUS_META } from '../../config/communicationConfig'
import { INTEGRATION_MODE_META } from '../../config/integrationConfig'
import { INVOICE_STATUS_META } from '../../config/invoiceConfig'
import { expiryState } from '../../services/documentService'

export const DocumentStatusBadge = ({ status }) => {
  const m = DOCUMENT_STATUS_META[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

export const ExpiryBadge = ({ date, state: given, showDays = true }) => {
  const e = given ? { state: given, days: null } : expiryState(date)
  const m = EXPIRY_META[e.state]
  const suffix = showDays && e.days !== null && e.state !== 'VALID' ? (e.days < 0 ? ` · ${-e.days}d ago` : e.days > 0 ? ` · ${e.days}d` : '') : ''
  return <Badge tone={m.tone} dot>{m.label}{suffix}</Badge>
}

export const MessageStatusBadge = ({ status }) => {
  const m = MESSAGE_STATUS_META[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

export const IntegrationModeBadge = ({ mode }) => {
  const m = INTEGRATION_MODE_META[mode] || INTEGRATION_MODE_META.DEMO
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

export const InvoiceStatusBadge = ({ status }) => {
  const m = INVOICE_STATUS_META[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

const pill = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide'
export const SimulatedOcrBadge = () => <span className={`${pill} border-accent/60 bg-accent/10 text-[#8A5A00] dark:text-accent`} title="Values are pre-filled from records — the image is not read"><FlaskConical size={11} aria-hidden /> Simulated OCR</span>
export const OcrProviderBadge = ({ provider }) => (provider === 'MOCK' ? <SimulatedOcrBadge /> : provider ? <span className={`${pill} border-info/40 bg-info/10 text-info`}><ScanText size={11} aria-hidden /> {provider === 'BACKEND' ? 'Backend OCR' : provider}</span> : null)
export const SecretFieldNote = () => <p className="flex items-start gap-1.5 text-xs text-muted"><KeyRound size={13} className="mt-0.5 shrink-0" aria-hidden />Passwords and tokens are never saved in this browser. In backend mode they are sent once to the integration gateway, which keeps them in its own secret store.</p>
