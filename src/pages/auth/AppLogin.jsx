import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, LogIn, Smartphone, Truck, ShoppingBag, FlaskConical, KeyRound } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Checkbox from '../../components/common/Checkbox'
import Modal from '../../components/common/Modal'
import Logo from '../../components/common/Logo'
import { useAuth } from '../../hooks/useAuth'
import { getRememberedUsername } from '../../services/authService'
import { scopeOf } from '../../services/rbacService'
import { DEMO_CREDENTIALS } from '../../services/seed/demoSeed'

const VARIANTS = {
  driver: { title: 'Driver app', subtitle: 'Sign in with the mobile number or email your dispatcher registered.', icon: Truck, scope: 'DRIVER', demo: 'u-driver', contact: 'your Dispatcher' },
  customer: { title: 'Customer app', subtitle: 'Order, track deliveries and download your documents.', icon: ShoppingBag, scope: 'CUSTOMER', demo: 'u-customer', contact: 'your Bellomassi account manager' },
}

/**
 * Mobile sign-in for the driver and customer apps — the same demo authentication as the office login.
 * Accounts are created by an administrator; there is no self-registration.
 */
export default function AppLogin({ variant = 'driver' }) {
  const v = VARIANTS[variant]
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => ({ id: getRememberedUsername() || '', password: '', remember: true }))
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgot, setForgot] = useState(false)
  const demo = DEMO_CREDENTIALS.find((c) => c.id === v.demo)
  const Icon = v.icon

  const submit = async (e) => {
    e.preventDefault()
    if (!form.id.trim() || !form.password) { setError('Enter your mobile number or email and your password.'); return }
    setLoading(true)
    const res = await login(form.id, form.password, { remember: form.remember, rememberUsername: form.remember })
    setLoading(false)
    if (!res.ok) { setError(res.error); return }
    if (scopeOf(res.user) !== v.scope) toast.info(`Signed in as ${res.user.name}`, { description: `This account is not a ${variant} account — opening your own workspace.` })
    else toast.success(`Welcome, ${res.user.name.split(' ')[0]}`)
    navigate(res.mustChangePassword ? '/account/change-password?required=1' : res.landing, { replace: true })
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="bg-navy px-5 pb-16 pt-10 text-white">
        <div className="mx-auto max-w-md">
          <Logo className="h-9" />
          <div className="mt-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><Icon size={22} aria-hidden /></span>
            <div>
              <h1 className="text-2xl font-semibold">{v.title}</h1>
              <p className="text-sm text-white/70">{v.subtitle}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto -mt-10 max-w-md px-4 pb-10">
        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-pop">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-accent/70 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink"><FlaskConical size={12} aria-hidden />Demo prototype · data stays in this browser</p>
          <Input label="Mobile number or email" icon={Smartphone} autoComplete="username" value={form.id} onChange={(e) => { setForm((f) => ({ ...f, id: e.target.value })); setError('') }} placeholder="+91 98400 11206 or name@company.com" />
          <Input label="Password" icon={Lock} type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setError('') }}
            rightElement={<button type="button" onClick={() => setShow((s) => !s)} className="rounded p-1.5 text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
          <div className="flex items-center justify-between gap-2">
            <Checkbox label="Remember me" checked={form.remember} onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))} />
            <button type="button" onClick={() => setForgot(true)} className="text-sm font-medium text-brand hover:underline">Forgot password?</button>
          </div>
          {error && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          <Button type="submit" icon={LogIn} size="lg" fullWidth loading={loading}>Sign in</Button>
          <p className="text-center text-xs text-muted">No self-registration — accounts are created by {v.contact}.</p>
        </form>
        {demo && (
          <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Demo account</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm"><p className="font-medium text-ink truncate">{demo.name}</p><p className="text-xs text-muted tabular truncate">{demo.phone} · {demo.password}</p></div>
              <Button size="sm" variant="secondary" onClick={() => { setForm((f) => ({ ...f, id: demo.phone, password: demo.password })); setError('') }}>Use</Button>
            </div>
          </div>
        )}
        <p className="mt-6 text-center text-xs text-muted">Office staff? <Link to="/login" className="font-medium text-brand hover:underline">Use the office sign-in</Link></p>
      </div>
      <Modal open={forgot} onClose={() => setForgot(false)} title="Reset your password" icon={KeyRound} size="sm" footer={<Button onClick={() => setForgot(false)}>OK</Button>}>
        <p className="text-sm text-muted">In this prototype no SMS or email is sent. Ask {v.contact} to reset your password from User Management, or use the demo account shown on this screen.</p>
      </Modal>
    </div>
  )
}

export const DriverLogin = () => <AppLogin variant="driver" />
export const CustomerLogin = () => <AppLogin variant="customer" />
