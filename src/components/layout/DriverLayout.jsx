import { Suspense, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { House, ListChecks, UserRound, Map as MapIcon, History } from 'lucide-react'
import Logo from '../common/Logo'
import ErrorBoundary from '../common/ErrorBoundary'
import LoadingSpinner from '../common/LoadingSpinner'
import NotificationCenter from './NotificationCenter'
import ProfileMenu from './ProfileMenu'
import PrototypeBadge from './PrototypeBadge'
import { cn } from '../../utils/helpers'

const TABS = [
  { to: '/driver/dashboard', label: 'Home', icon: House },
  { to: '/driver/deliveries', label: 'Deliveries', icon: ListChecks },
  { to: '/driver/route', label: 'Route', icon: MapIcon },
  { to: '/driver/completed', label: 'History', icon: History, also: ['/driver/delivery-notes'] },
  { to: '/driver/profile', label: 'Profile', icon: UserRound, also: ['/driver/documents', '/driver/expenses', '/drivers/expenses', '/fleet/fuel', '/finance/payments', '/logistics/reschedules', '/notifications', '/settings'] },
]

/**
 * Mobile-first shell for the Driver role: a compact header and a bottom tab bar —
 * no sidebar, global search or administrative menus.
 */
export default function DriverLayout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return (
    <div className="min-h-full bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:shadow-pop">Skip to content</a>
      <header className="no-print sticky top-0 z-20 bg-navy text-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-3 sm:px-4">
          <Logo className="h-8" />
          <span className="ml-1 hidden sm:inline text-xs font-medium uppercase tracking-wider text-white/60">Driver</span>
          <div className="flex-1" />
          <PrototypeBadge className="[&_button]:bg-white/10 [&_button]:text-accent [&_button]:border-accent/60" />
          <div className="rounded-lg bg-white/0 [&_button]:text-white/80 [&_button:hover]:text-white [&_button:hover]:bg-white/10"><NotificationCenter /></div>
          <div className="[&>div>button:hover]:bg-white/10"><ProfileMenu compact profilePath="/driver/profile" /></div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl px-3 pt-4 pb-28 sm:px-4 sm:pt-6">
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<LoadingSpinner fullPage label="Loading…" />}>
            <div key={pathname} className="animate-fade-in"><Outlet /></div>
          </Suspense>
        </ErrorBoundary>
      </main>
      <nav aria-label="Driver navigation" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {TABS.map(({ to, label, icon: Icon, also = [] }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => cn('relative flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium', isActive || (to !== '/driver/dashboard' && pathname.startsWith(to)) || also.some((a) => pathname.startsWith(a)) ? 'text-brand before:absolute before:inset-x-5 before:top-0 before:h-[3px] before:rounded-b-full before:bg-brand' : 'text-muted hover:text-ink')}>
                <Icon size={20} aria-hidden />{label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
