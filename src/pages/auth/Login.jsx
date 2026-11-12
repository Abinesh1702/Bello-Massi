import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, Eye, EyeOff, Lock, LogIn, User } from 'lucide-react'
import { toast } from 'sonner'
import AuthLayout from './AuthLayout'
import DemoAccounts from './DemoAccounts'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Checkbox from '../../components/common/Checkbox'
import { useAuth } from '../../hooks/useAuth'
import { canAccessPath } from '../../config/navigation'
import { appConfig } from '../../config/appConfig'
import { isValidEmail } from '../../utils/helpers'
import { getRememberedUsername } from '../../services/authService'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(() => {
    const remembered = getRememberedUsername()
    return { email: remembered, password: '', remember: true, rememberUsername: Boolean(remembered) }
  })
  const timedOut = location.state?.reason === 'timeout'
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }))
    if (formError) setFormError('')
  }

  const validate = () => {
    const next = {}
    if (!form.email.trim()) next.email = 'Enter your email address or username.'
    else if (form.email.includes('@') && !isValidEmail(form.email)) next.email = 'Enter a valid email address.'
    if (!form.password) next.password = 'Enter your password.'
    setErrors(next)
    if (next.email) emailRef.current?.focus()
    else if (next.password) passwordRef.current?.focus()
    return !Object.keys(next).length
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (loading || !validate()) return
    setLoading(true)
    const res = await login(form.email, form.password, { remember: form.remember, rememberUsername: form.rememberUsername })
    setLoading(false)
    if (!res.ok) {
      if (res.field) setErrors({ [res.field]: res.error })
      else setFormError(res.error)
      return
    }
    toast.success(`Welcome back, ${res.user.name.split(' ')[0]}`)
    if (res.mustChangePassword) {
      navigate('/account/change-password?required=1', { replace: true })
      return
    }
    // Role-based redirect: the page the user tried to open (if allowed), otherwise the role's landing page.
    const from = location.state?.from
    const target = from && !['/login', '/logout'].includes(from) && canAccessPath(from.split('?')[0], res.user) ? from : res.landing
    navigate(target, { replace: true })
  }

  const pick = (account) => {
    setForm((f) => ({ ...f, email: account.username || account.email, password: account.password }))
    setErrors({})
    setFormError('')
    passwordRef.current?.focus()
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Sign in to {appConfig.name}</h2>
        <p className="mt-1.5 text-sm text-muted">{appConfig.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby={formError ? 'login-error' : undefined}>
        {timedOut && !formError && (
          <div role="status" className="flex gap-2.5 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-3 text-sm text-ink">
            <Clock size={17} className="shrink-0 mt-0.5 text-accent" aria-hidden />
            <span>You were signed out after a period of inactivity. Sign in again to continue.</span>
          </div>
        )}
        {formError && (
          <div id="login-error" role="alert" className="flex gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
            <AlertCircle size={17} className="shrink-0 mt-0.5" aria-hidden />
            <span>{formError}</span>
          </div>
        )}
        <Input
          ref={emailRef}
          label="Email or username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          icon={User}
          placeholder="you@bellomassi.demo or username"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <Input
          ref={passwordRef}
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          icon={Lock}
          placeholder="Enter your password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
          labelAction={<Link to="/forgot-password" className="text-xs font-medium text-brand hover:underline underline-offset-4">Forgot password?</Link>}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="grid h-8 w-8 place-items-center rounded-md text-muted hover:text-ink hover:bg-surface-2"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox
            label="Remember username"
            description="Prefill it next time on this browser."
            checked={form.rememberUsername}
            onChange={set('rememberUsername')}
          />
          <Checkbox
            label="Keep me signed in"
            description="Stay signed in after the browser closes."
            checked={form.remember}
            onChange={set('remember')}
          />
        </div>
        <Button type="submit" size="lg" fullWidth loading={loading} icon={LogIn}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-4 text-xs text-muted">
        Prototype sign-in: demo accounts and passwords are checked in this browser only (LocalStorage) — this is a session simulation, not secure authentication.
      </p>
      <DemoAccounts onSelect={pick} selectedEmail={form.email} />
    </AuthLayout>
  )
}
