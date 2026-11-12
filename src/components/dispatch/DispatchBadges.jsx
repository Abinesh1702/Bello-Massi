import { ShieldAlert, ShieldCheck, ShieldX, KeyRound, FlaskConical } from 'lucide-react'
import Badge from '../common/Badge'
import {
  ACTIVE_TONE, AVAILABILITY_TONE, DELIVERY_STATUS_META, DISPATCH_STATUS_META, OTP_STATUS_META, VEHICLE_STATUS_TONE,
} from '../../config/dispatchConfig'
import { licenseState } from '../../services/driverService'
import { formatDate } from '../../utils/formatters'

export const DispatchStatusBadge = ({ status }) => {
  const m = DISPATCH_STATUS_META[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

export const DeliveryStatusBadge = ({ status }) => {
  const m = DELIVERY_STATUS_META[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

export const AvailabilityBadge = ({ value }) => <Badge tone={AVAILABILITY_TONE[value] || 'neutral'} dot>{value}</Badge>
export const VehicleStatusBadge = ({ status }) => <Badge tone={VEHICLE_STATUS_TONE[status] || 'neutral'} dot>{status}</Badge>
export const ActiveStatusBadge = ({ status }) => <Badge tone={ACTIVE_TONE[status] || 'neutral'} dot>{status}</Badge>

/** Licence validity with expiry date. compact = icon + short label only. */
export const LicenseBadge = ({ driver, compact = false }) => {
  const s = licenseState(driver)
  if (s.state === 'Expired') return <Badge tone="danger" className="gap-1"><ShieldX size={11} aria-hidden /> {compact ? 'Expired' : `Expired ${formatDate(driver.licenseExpiry)}`}</Badge>
  if (s.state === 'Expiring') return <Badge tone="warning" className="gap-1"><ShieldAlert size={11} aria-hidden /> {compact ? `${s.days}d left` : `Expires ${formatDate(driver.licenseExpiry)}`}</Badge>
  if (s.state === 'Missing') return <Badge tone="danger" className="gap-1"><ShieldX size={11} aria-hidden /> No expiry</Badge>
  return <Badge tone="success" className="gap-1"><ShieldCheck size={11} aria-hidden /> {compact ? 'Valid' : `Valid to ${formatDate(driver.licenseExpiry)}`}</Badge>
}

export const OtpStatusBadge = ({ status }) => {
  const m = OTP_STATUS_META[status] || OTP_STATUS_META.NONE
  return <Badge tone={m.tone} className="gap-1"><KeyRound size={11} aria-hidden /> {m.label}</Badge>
}

/** Marks prototype-only OTP behaviour — no SMS or WhatsApp provider is involved. */
export const SimulatedOtpBadge = () => (
  <Badge tone="accent" className="gap-1 uppercase tracking-wide"><FlaskConical size={11} aria-hidden /> Simulated OTP</Badge>
)
