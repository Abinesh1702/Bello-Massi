import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Info, KeyRound, RotateCcw, User } from 'lucide-react'
import { toast } from 'sonner'
import AuthLayout from './AuthLayout'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { findUserByIdentifier, requestPasswordReset, restoreDefaultDemoPassword } from '../../services/authService'
import { getRoleLabel } from '../../config/roles'
import { isValidEmail, sleep } from '../../utils/helpers'
import { formatTime } from '../../utils/formatters'

/**
 * Prototype password recovery. No email is sent (no backend). Two demo options:
 * 1. Reset Password Demo — a 6-digit code is generated and SHOWN ON SCREEN, then entered on /reset-password.
 * 2. Restore the account's published demo password.
 */
export default function ForgotPassword() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState(null)
  const [restored, setRestored] = useState(null)
  const [code, setCode] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    const id = identifier.trim()
    if (!id) return setError('Enter your email address or username.')
    if (id.includes('@') && !isValidEmail(id)) return setError('Enter a valid email address.')
    setLoading(true)
    await sleep(400)
    setLoading(false)
    const user = findUserByIdentifier(id)
    if (!user) return setError('No demo account uses that email address or username.')
    setAccount(user)
  }

  const sendCode = () => {
    const res = requestPasswordReset(account.email)
    if (!res.ok) return toast.error(res.error)
    setCode(res)
    toast.success('Demo reset code created')
  }

  const restore = () => {
    const res = restoreDefaultDemoPassword(account.email)
    if (!res.ok) return toast.error(res.error)
    setRestored(res.password)
    toast.success('Default demo password restored')
  }

  const reset = () => { setAccount(null); setRestored(null); setCode(null) }

  return (
    <AuthLayout>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6">
        <ArrowLeft size={15} /> Back to sign in
      </Link>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Forgot password</h2>
      <p className="mt-1.5 text-sm text-muted">Enter the email address or username of your demo account.</p>

      <div className="mt-5 flex gap-2.5 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-3 text-xs text-ink">
        <Info size={16} className="shrink-0 text-accent mt-px" aria-hidden />
        <span>
          Prototype mode: no reset email is sent because there is no server. The reset code is shown on this screen instead, or you
          can restore the account's published demo password.
        </span>
      </div>

      {!account ? (
        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <Input
            label="Email or username"
            icon={User}
            autoComplete="username"
            autoCapitalize="none"
            placeholder="you@bellomassi.demo"
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setError('') }}
            error={error}
            required
            autoFocus
          />
          <Button type="submit" size="lg" fullWidth loading={loading}>Continue</Button>
        </form>
      ) : (
        <div className="mt-6 rounded-xl border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-muted">Account found</p>
          <p className="mt-1 font-semibold text-ink">{account.name}</p>
          <p className="text-sm text-muted">{account.email} · {getRoleLabel(account.role)}</p>

          {code && (
            <div className="mt-4 rounded-lg border border-brand/30 bg-surface-2 px-3.5 py-3 text-sm" role="status">
              <p className="text-ink">Demo reset code: <code className="ml-1 rounded bg-surface px-2 py-0.5 text-base font-semibold tracking-widest" data-testid="reset-code">{code.code}</code></p>
              <p className="mt-1 text-xs text-muted">Valid until {formatTime(code.expiresAt)} ({code.minutes} minutes). In production this would be emailed to {code.email}.</p>
              <Button className="mt-3" size="sm" icon={KeyRound} onClick={() => navigate(`/reset-password?user=${encodeURIComponent(account.email)}`)}>Enter code and new password</Button>
            </div>
          )}
          {restored && (
            <div className="mt-4 flex gap-2.5 rounded-lg bg-success/10 px-3.5 py-3 text-sm text-success" role="status">
              <CheckCircle2 size={17} className="shrink-0 mt-0.5" aria-hidden />
              <span>Password restored to <code className="font-semibold">{restored}</code>. You can sign in now.</span>
            </div>
          )}
          {!code && !restored && (
            <div className="mt-4 grid gap-2">
              <Button variant="primary" icon={KeyRound} onClick={sendCode} fullWidth>Get a reset code (demo)</Button>
              <Button variant="accent" icon={RotateCcw} onClick={restore} fullWidth>Restore default demo password</Button>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" fullWidth onClick={reset}>Use another account</Button>
            <Button to="/login" variant="ghost" fullWidth>Go to sign in</Button>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
