import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Info, KeyRound, Lock, User } from 'lucide-react'
import { toast } from 'sonner'
import AuthLayout from './AuthLayout'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { passwordPolicyText, resetPasswordWithCode } from '../../services/authService'

/** Reset Password Demo — step 2: enter the on-screen code and choose a new demo password. */
export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: params.get('user') || '', code: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined, form: undefined })) }

  const onSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.identifier.trim()) errs.identifier = 'Enter your email address or username.'
    if (form.next && form.confirm !== form.next) errs.confirm = 'Passwords do not match.'
    if (!form.next) errs.next = 'Enter a new password.'
    if (Object.keys(errs).length) return setErrors(errs)
    setBusy(true)
    const res = resetPasswordWithCode(form.identifier, form.code, form.next)
    setBusy(false)
    if (!res.ok) return setErrors(res.errors || {})
    toast.success('Password reset', { description: 'Sign in with your new demo password.' })
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout>
      <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6">
        <ArrowLeft size={15} /> Back
      </Link>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Reset password</h2>
      <p className="mt-1.5 text-sm text-muted">Enter the 6-digit demo code and choose a new password.</p>
      <div className="mt-5 flex gap-2.5 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-3 text-xs text-ink">
        <Info size={16} className="shrink-0 text-accent mt-px" aria-hidden />
        <span>Reset Password Demo — the code comes from the Forgot password screen, not from an email. Passwords are stored as a demo fingerprint in this browser only.</span>
      </div>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
        <Input label="Email or username" icon={User} autoComplete="username" value={form.identifier} onChange={set('identifier')} error={errors.identifier} required />
        <Input label="Reset code" icon={KeyRound} inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="6-digit code" value={form.code} onChange={set('code')} error={errors.code} required />
        <Input label="New password" icon={Lock} type="password" autoComplete="new-password" value={form.next} onChange={set('next')} error={errors.next} hint={passwordPolicyText()} required />
        <Input label="Confirm new password" icon={Lock} type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} required />
        <Button type="submit" size="lg" fullWidth loading={busy}>Reset password</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">No code? <Link to="/forgot-password" className="font-medium text-brand hover:underline">Request one</Link></p>
    </AuthLayout>
  )
}
