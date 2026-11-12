import { KeyRound } from 'lucide-react'
import { OtpStatusBadge, SimulatedOtpBadge } from './DispatchBadges'
import { effectiveOtpStatus } from '../../services/otpService'
import { formatDateTime } from '../../utils/formatters'

/**
 * Prototype-only view of the simulated delivery OTP for Admin / Dispatcher testing.
 * In production the code would only ever reach the customer.
 */
export default function OtpInspector({ otp, compact = false }) {
  if (!otp) return compact ? <OtpStatusBadge status="NONE" /> : <p className="text-sm text-muted">No OTP generated yet. The driver requests it at the customer's door.</p>
  const status = effectiveOtpStatus(otp)
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-accent/60 bg-accent/10 px-2 py-1 text-xs" title="Simulated OTP — visible for prototype testing only">
        <KeyRound size={12} aria-hidden /> <span className="font-mono font-semibold tracking-widest" data-testid="inspect-otp">{status === 'ACTIVE' ? otp.otp : '••••••'}</span>
        <span className="text-muted">{status === 'ACTIVE' ? `${otp.maxAttempts - otp.attempts} tries` : status.toLowerCase()}</span>
      </span>
    )
  }
  return (
    <div className="rounded-xl border border-dashed border-accent/60 bg-accent/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><SimulatedOtpBadge /><OtpStatusBadge status={status} /></div>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-[0.4em] text-ink" data-testid="inspect-otp">{status === 'ACTIVE' ? otp.otp : '••••••'}</p>
      <p className="mt-2 text-xs text-muted">Generated {formatDateTime(otp.generatedAt)} · expires {formatDateTime(otp.expiresAt)} · {otp.attempts}/{otp.maxAttempts} attempts used{otp.verifiedAt ? ` · verified ${formatDateTime(otp.verifiedAt)}` : ''}</p>
      <p className="mt-1 text-xs text-muted">Shown for prototype testing only. No SMS or WhatsApp message is sent.</p>
    </div>
  )
}
