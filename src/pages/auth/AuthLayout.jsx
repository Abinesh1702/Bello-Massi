import { ClipboardList, BadgeCheck, Truck, KeyRound } from 'lucide-react'
import Logo from '../../components/common/Logo'
import PrototypeBadge from '../../components/layout/PrototypeBadge'
import truck from '../../assets/images/login-truck.jpg'
import { appConfig } from '../../config/appConfig'

const STEPS = [
  { icon: ClipboardList, title: 'Capture', text: 'Orders by call, email or WhatsApp — entered once.' },
  { icon: BadgeCheck, title: 'Approve', text: 'Value, quantity and credit checked by the Sales Manager.' },
  { icon: Truck, title: 'Dispatch', text: 'Zone planning and the fastest route for every driver.' },
  { icon: KeyRound, title: 'Confirm', text: 'OTP handover and an instant Delivery Note.' },
]

/** Split-screen layout shared by sign-in and password recovery. */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] bg-canvas">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-navy p-10 xl:p-14 text-white">
        <img src={truck} alt="" className="absolute inset-0 h-full w-full object-cover object-right opacity-45" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-br from-[#232B5F]/95 via-[#232B5F]/80 to-[#232B5F]/40" aria-hidden />
        <div className="relative">
          <Logo className="h-11" />
        </div>
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Order-to-Delivery Platform</p>
          <h1 className="mt-3 text-3xl xl:text-4xl font-semibold leading-tight tracking-tight">
            From customer order to confirmed delivery.
          </h1>
          <p className="mt-3 text-[15px] text-white/75">
            One record for every order — approved, consolidated, dispatched by zone and confirmed by the customer's one-time password.
          </p>
          <ol className="mt-8 grid grid-cols-2 gap-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/90 text-navy"><s.icon size={15} aria-hidden /></span>
                  <span className="text-xs text-white/60">0{i + 1}</span>
                  <span className="text-sm font-semibold">{s.title}</span>
                </div>
                <p className="mt-2 text-xs text-white/70 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Bellomassi · Prototype v{appConfig.prototypeVersion}</p>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between px-5 sm:px-8 h-16">
          <span className="lg:hidden"><Logo variant="mark" withText /></span>
          <span className="hidden lg:block" />
          <PrototypeBadge />
        </div>
        <div className="flex-1 flex items-start sm:items-center justify-center px-5 sm:px-8 pb-10">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>
      </main>
    </div>
  )
}
