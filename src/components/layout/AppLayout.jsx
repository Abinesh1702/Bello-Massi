import { Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileSidebar from './MobileSidebar'
import JarvisFloatingButton from '../ai/JarvisFloatingButton'
import Header from './Header'
import ErrorBoundary from '../common/ErrorBoundary'
import LoadingSpinner from '../common/LoadingSpinner'
import { useSettings } from '../../hooks/useSettings'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../config/roles'
import DriverLayout from './DriverLayout'
import CustomerLayout from './CustomerLayout'
import { cn } from '../../utils/helpers'
import SessionWatcher from './SessionWatcher'
import { appConfig } from '../../config/appConfig'
import DocumentTitle from './DocumentTitle'
import { getLocaleConfig, getRuntimeVersion, getUiConfig, subscribeRuntimeConfig } from '../../config/runtimeConfig'
import { scopeOf } from '../../services/rbacService'

/** Drivers and customers get mobile-first app shells; every other role the full back-office layout. */
export default function AppLayout() {
  const { user } = useAuth()
  // Localization / numbering changes re-render pages so formatted values update everywhere.
  const runtimeVersion = useSyncExternalStore(subscribeRuntimeConfig, getRuntimeVersion)
  return (
    <>
      <SessionWatcher />
      <DocumentTitle key={runtimeVersion} />
      {scopeOf(user) === ROLES.DRIVER ? <DriverLayout key={runtimeVersion} />
        : scopeOf(user) === ROLES.CUSTOMER ? <CustomerLayout key={runtimeVersion} />
          : <OfficeLayout runtimeVersion={runtimeVersion} />}
    </>
  )
}

function OfficeLayout({ runtimeVersion = 0 }) {
  const [settings, updateSettings] = useSettings()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const collapsed = settings.sidebarCollapsed

  // Honour the "start collapsed" preference once per signed-in layout mount
  useEffect(() => {
    if (settings.sidebarStartCollapsed && !settings.sidebarCollapsed) updateSettings({ sidebarCollapsed: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Move focus/scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-full">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:shadow-pop">
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onToggle={() => updateSettings({ sidebarCollapsed: !collapsed })} />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <Header onToggleSidebar={() => updateSettings({ sidebarCollapsed: !collapsed })} onOpenMobile={() => setMobileOpen(true)} />
        <main id="main" className="flex-1 w-full max-w-[var(--content-max)] mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <ErrorBoundary resetKey={pathname}>
            {/* Suspense inside the layout keeps the sidebar/header visible while a page chunk loads */}
            <Suspense fallback={<LoadingSpinner fullPage label="Loading…" />}>
              <div key={`${pathname}:${runtimeVersion}`} className="animate-fade-in">
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
        <footer className="px-4 sm:px-6 lg:px-8 py-3.5 text-[11.5px] text-muted border-t border-line bg-surface/60 flex flex-wrap gap-x-4 gap-y-1 justify-between">
          <span>© {new Date().getFullYear()} Bellomassi · Order-to-Delivery Management System</span>
          <span>Prototype v{appConfig.prototypeVersion} · Frontend-only · Data stored in this browser · Times in {getLocaleConfig().timezone}</span>
        </footer>
        {getUiConfig().jarvisFloatingButton !== false && getUiConfig().aiFeaturesEnabled !== false && <JarvisFloatingButton sidebarCollapsed={collapsed} />}
      </div>
    </div>
  )
}
