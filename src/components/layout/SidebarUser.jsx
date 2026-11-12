import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useSignOut } from '../../hooks/useSignOut'
import Avatar from '../common/Avatar'
import { useAuth } from '../../hooks/useAuth'
import { getRoleLabel } from '../../config/roles'
import { cn } from '../../utils/helpers'

export default function SidebarUser({ collapsed }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const signOut = useSignOut()
  if (!user) return null
  return (
    <div className={cn('border-t border-white/[0.08] p-3', collapsed && 'px-2')}>
      <div className={cn('flex items-center gap-3 rounded-lg', collapsed ? 'flex-col' : 'p-1.5')}>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className={cn('flex items-center gap-3 min-w-0 flex-1 rounded-lg text-left hover:bg-sidebar-hover', collapsed ? 'p-1' : 'p-1 -m-1')}
          title={collapsed ? `${user.name} · ${getRoleLabel(user.role)}` : 'My profile'}
          aria-label="Open my profile"
        >
          <Avatar name={user.name} color={user.avatarColor} image={user.avatarImage} size="sm" className="ring-white/20" />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{user.name}</span>
              <span className="block truncate text-xs text-sidebar-ink">{getRoleLabel(user.role)}</span>
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={signOut}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sidebar-ink hover:bg-sidebar-hover hover:text-white"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}
