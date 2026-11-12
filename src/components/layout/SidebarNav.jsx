import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { findNavItemByPath, getNavigationForRole } from '../../config/navigation'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/helpers'

const itemClasses = (active, collapsed) =>
  cn(
    'group relative flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors duration-150',
    collapsed ? 'h-10 w-10 justify-center mx-auto' : 'h-8 px-2.5',
    active ? 'bg-sidebar-active text-white' : 'text-sidebar-ink hover:bg-sidebar-hover hover:text-white',
  )

function ActiveBar({ active }) {
  if (!active) return null
  return <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-accent" aria-hidden />
}

function Leaf({ item, collapsed, onNavigate, nested, activeId }) {
  const Icon = item.icon
  // Detail/create/edit pages highlight the list they belong to
  const isActive = activeId === item.id
  return (
    <NavLink
      to={item.path}
      end
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(itemClasses(isActive, collapsed), nested && !collapsed && 'ml-[18px] pl-3 rounded-l-none border-l border-white/10', nested && !collapsed && isActive && 'border-accent/80')}
    >
      {(
        <>
          {!nested && <ActiveBar active={isActive} />}
          {!nested && <ActiveBar active={false} />}
          {(!nested || collapsed) && <Icon size={17} strokeWidth={1.9} className={cn('shrink-0', isActive ? 'text-accent' : 'opacity-75 group-hover:opacity-100')} aria-hidden />}
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  )
}

/** Role-filtered navigation tree, shared by the desktop sidebar and the mobile drawer. */
export default function SidebarNav({ collapsed = false, onNavigate }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const nav = useMemo(() => getNavigationForRole(user), [user])
  const current = findNavItemByPath(pathname)
  const activeId = current ? current.parent || current.id : null
  const activeGroup = nav.find((g) => g.children?.some((c) => c.id === activeId))?.id
  const [open, setOpen] = useState(() => new Set(activeGroup ? [activeGroup] : ['orders']))

  // Keep the active group expanded when navigating from elsewhere (search, links)
  if (activeGroup && !open.has(activeGroup)) setOpen(new Set([...open, activeGroup]))

  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <nav aria-label="Main navigation" className={cn('flex-1 overflow-y-auto scroll-thin py-3', collapsed ? 'px-2' : 'px-3')}>
      {!collapsed && <p className="px-2.5 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sidebar-ink/55">Workspace</p>}
      <ul className="space-y-0.5">
        {nav.map((entry) => {
          if (!entry.children) {
            return (
              <li key={entry.id}>
                <Leaf item={entry} collapsed={collapsed} onNavigate={onNavigate} activeId={activeId} />
              </li>
            )
          }
          if (collapsed) {
            return (
              <li key={entry.id} className="pt-2 mt-2 border-t border-white/10 space-y-1">
                {entry.children.map((child) => (
                  <Leaf key={child.id} item={child} collapsed onNavigate={onNavigate} activeId={activeId} />
                ))}
              </li>
            )
          }
          const isOpen = open.has(entry.id)
          const GroupIcon = entry.icon
          const containsActive = entry.id === activeGroup
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => toggle(entry.id)}
                aria-expanded={isOpen}
                className={cn(itemClasses(false, false), 'w-full', containsActive && 'text-white')}
              >
                <GroupIcon size={17} strokeWidth={1.9} className={cn('shrink-0', containsActive ? 'text-accent' : 'opacity-75')} aria-hidden />
                <span className="flex-1 truncate text-left">{entry.label}</span>
                <ChevronDown size={15} className={cn('opacity-60 transition-transform', isOpen && 'rotate-180')} aria-hidden />
              </button>
              {isOpen && (
                <ul className="mt-0.5 mb-1.5 space-y-px animate-fade-in">
                  {entry.children.map((child) => (
                    <li key={child.id}>
                      <Leaf item={child} nested onNavigate={onNavigate} activeId={activeId} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
