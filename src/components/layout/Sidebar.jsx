import { Link } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import Logo from '../common/Logo'
import SidebarNav from './SidebarNav'
import SidebarUser from './SidebarUser'
import { appConfig } from '../../config/appConfig'
import { cn } from '../../utils/helpers'

/** Desktop sidebar (lg and up). */
export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={cn(
        'hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col bg-sidebar text-white transition-[width] duration-200 border-r border-white/[0.04]',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
      aria-label="Sidebar"
    >
      <div className={cn('flex h-16 shrink-0 items-center border-b border-white/[0.08]', collapsed ? 'justify-center px-2' : 'px-5 gap-3')}>
        <Link to="/dashboard" className="flex items-center gap-3 min-w-0" aria-label={`${appConfig.name} dashboard`}>
          {collapsed ? <Logo variant="mark" /> : (
            <span className="min-w-0">
              <Logo className="h-8" />
              <span className="block text-[10.5px] uppercase tracking-[0.14em] text-sidebar-ink/80 mt-1 truncate">Order-to-Delivery</span>
            </span>
          )}
        </Link>
      </div>
      <SidebarNav collapsed={collapsed} />
      <div className={cn('px-3', collapsed && 'px-2')}>
        <button
          type="button"
          onClick={onToggle}
          className={cn('flex w-full items-center gap-2.5 rounded-md h-8 text-[12.5px] text-sidebar-ink/80 hover:bg-sidebar-hover hover:text-white', collapsed ? 'justify-center' : 'px-2.5')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <><PanelLeftClose size={17} /> Collapse sidebar</>}
        </button>
      </div>
      <SidebarUser collapsed={collapsed} />
    </aside>
  )
}
