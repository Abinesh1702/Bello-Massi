import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, KeyRound, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { landingPathFor } from '../../services/rbacService'
import { passwordPolicyText } from '../../services/authService'
import { formatDateTime } from '../../utils/formatters'

/** Change Password — also the forced step after an administrator resets a user's demo password. */
export default function ChangePassword() {
  const { user, changePassword } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const required = Boolean(user.mustChangePassword) || params.get('required') === '1'
  const empty = { current: '', next: '', confirm: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })) }

  const onSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.current) errs.current = 'Enter your current password.'
    if (!form.next) errs.next = 'Enter a new password.'
    if (form.next && form.confirm !== form.next) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) return setErrors(errs)
    setBusy(true)
    const res = changePassword(form.current, form.next)
    setBusy(false)
    if (!res.ok) return setErrors(res.errors || {})
    setForm(empty)
    toast.success('Password changed')
    if (required) navigate(landingPathFor(user), { replace: true })
  }

  return (
    <>
      <PageHeader title="Change password" description="Choose a new demo password for your account." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] max-w-5xl">
        <Card>
          <CardHeader title="New password" subtitle={passwordPolicyText()} icon={KeyRound} />
          {required && (
            <div role="alert" className="mb-5 flex gap-2.5 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-3 text-sm text-ink">
              <AlertTriangle size={17} className="shrink-0 mt-0.5 text-accent" aria-hidden />
              <span>An administrator reset your password. Choose a new password to continue — other pages open after this step.</span>
            </div>
          )}
          <form onSubmit={onSubmit} noValidate className="grid gap-4 max-w-md">
            {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
            <Input label={required ? 'Temporary password' : 'Current password'} icon={Lock} type="password" autoComplete="current-password" value={form.current} onChange={set('current')} error={errors.current} required />
            <Input label="New password" icon={Lock} type="password" autoComplete="new-password" value={form.next} onChange={set('next')} error={errors.next} hint={passwordPolicyText()} required />
            <Input label="Confirm new password" icon={Lock} type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} required />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" icon={KeyRound} loading={busy}>Change password</Button>
              {!required && <Button variant="secondary" to="/profile">Cancel</Button>}
              {required && <Button variant="ghost" to="/logout">Sign out instead</Button>}
            </div>
          </form>
        </Card>
        <Card>
          <CardHeader title="About demo passwords" icon={ShieldCheck} />
          <ul className="space-y-2 text-sm text-muted list-disc pl-4">
            <li>Passwords are kept as a non-cryptographic demo fingerprint in this browser's LocalStorage. This is not real password security.</li>
            <li>The password rules come from Application Settings › Security.</li>
            <li>Last changed: {formatDateTime(user.passwordChangedAt || user.passwordResetAt) }</li>
          </ul>
        </Card>
      </div>
    </>
  )
}
