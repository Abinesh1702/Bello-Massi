import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { findNavItemById, findNavItemByPath } from '../../config/navigation'
import { cn } from '../../utils/helpers'

const EXTRA = {
  '/unauthorized': { label: 'Access restricted' },
}

export const getBreadcrumbs = (pathname) => {
  const item = findNavItemByPath(pathname)
  if (item) {
    if (item.path === '/dashboard') return [{ label: 'Dashboard' }]
    const parent = item.parent ? findNavItemById(item.parent) : null
    return [
      { label: 'Dashboard', to: '/dashboard' },
      ...(item.group ? [{ label: item.group.label }] : []),
      ...(parent ? [{ label: parent.label, to: parent.path }] : []),
      { label: item.label },
    ]
  }
  return [{ label: 'Dashboard', to: '/dashboard' }, { label: EXTRA[pathname]?.label || 'Page not found' }]
}

export default function Breadcrumbs({ className }) {
  const { pathname } = useLocation()
  const crumbs = getBreadcrumbs(pathname)
  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex items-center gap-1.5 text-sm text-muted min-w-0">
        <li className="shrink-0">
          <Link to="/dashboard" className="grid place-items-center rounded p-0.5 hover:text-ink" aria-label="Home">
            <Home size={15} />
          </Link>
        </li>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={`${c.label}-${i}`} className={cn('flex items-center gap-1.5', last ? 'min-w-0' : 'shrink-0', !last && i < crumbs.length - 2 && 'hidden xl:flex')}>
              <ChevronRight size={14} className="shrink-0 opacity-60" aria-hidden />
              {c.to && !last ? (
                <Link to={c.to} className="hover:text-ink truncate">{c.label}</Link>
              ) : (
                <span className={cn('truncate', last && 'text-ink font-medium')} aria-current={last ? 'page' : undefined}>{c.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
