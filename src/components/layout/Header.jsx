import { useState } from 'react'
import { Menu, Moon, PanelLeft, Search, Sun, X } from 'lucide-react'
import Breadcrumbs from './Breadcrumbs'
import GlobalSearch from './GlobalSearch'
import NotificationCenter from './NotificationCenter'
import ProfileMenu from './ProfileMenu'
import PrototypeBadge from './PrototypeBadge'
import { getUiConfig } from '../../config/runtimeConfig'
import { useTheme } from '../../hooks/useTheme'

export default function Header({ onToggleSidebar, onOpenMobile }) {
  const { isDark, toggleTheme } = useTheme()
  const [mobileSearch, setMobileSearch] = useState(false)
  const iconBtn = 'grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:text-ink hover:bg-surface-3'

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="flex h-14 items-center gap-1.5 px-3 sm:px-5 lg:px-6">
        <button type="button" onClick={onOpenMobile} className={`${iconBtn} lg:hidden`} aria-label="Open navigation menu">
          <Menu size={20} />
        </button>
        <button type="button" onClick={onToggleSidebar} className={`${iconBtn} hidden lg:grid`} aria-label="Toggle sidebar">
          <PanelLeft size={18} />
        </button>

        <Breadcrumbs className="hidden md:block flex-1 ml-1" />
        <div className="flex-1 md:hidden" />

        <GlobalSearch className="hidden md:block w-56 xl:w-64 2xl:w-80 shrink-0" />
        <button type="button" onClick={() => setMobileSearch((s) => !s)} className={`${iconBtn} md:hidden`} aria-label={mobileSearch ? 'Close search' : 'Open search'} aria-expanded={mobileSearch}>
          {mobileSearch ? <X size={18} /> : <Search size={18} />}
        </button>

        {getUiConfig().showPrototypeBadge !== false && <PrototypeBadge className="ml-1" />}
        <button type="button" onClick={toggleTheme} className={iconBtn} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'} title={isDark ? 'Light theme' : 'Dark theme'}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NotificationCenter />
        <div className="h-6 w-px bg-line mx-1 hidden sm:block" aria-hidden />
        <ProfileMenu />
      </div>
      {mobileSearch && (
        <div className="md:hidden border-t border-line px-3 py-2.5 animate-fade-in">
          <GlobalSearch autoFocus onDone={() => setMobileSearch(false)} />
        </div>
      )}
    </header>
  )
}
