import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, UserCircle2, Moon, Sun } from 'lucide-react'
import Avatar from '../common/Avatar'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { useClickOutside } from '../../hooks/useClickOutside'
import { useSignOut } from '../../hooks/useSignOut'
import { getRoleLabel } from '../../config/roles'

/** compact: avatar only (driver header). */
export default function ProfileMenu({ compact = false, profilePath = '/profile' }) {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const signOut = useSignOut()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false), open)
  if (!user) return null

  const itemCls = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-surface-2'
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-lg p-1 pr-1.5 hover:bg-surface-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar name={user.name} color={user.avatarColor} image={user.avatarImage} size="sm" />
        {!compact && <span className="hidden xl:block text-left leading-tight">
          <span className="block text-sm font-medium text-ink max-w-36 truncate">{user.name}</span>
          <span className="block text-xs text-muted">{getRoleLabel(user.role)}</span>
        </span>}
        {!compact && <ChevronDown size={15} className="hidden xl:block text-muted" aria-hidden />}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-pop animate-fade-in">
          <div className="flex items-center gap-3 px-2.5 py-2.5 mb-1 border-b border-line">
            <Avatar name={user.name} color={user.avatarColor} image={user.avatarImage} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
              <p className="text-[11px] font-medium text-brand mt-0.5">{getRoleLabel(user.role)}</p>
            </div>
          </div>
          <Link role="menuitem" to={profilePath} onClick={() => setOpen(false)} className={itemCls}><UserCircle2 size={16} className="text-muted" /> My profile</Link>
          <Link role="menuitem" to="/settings" onClick={() => setOpen(false)} className={itemCls}><Settings size={16} className="text-muted" /> Preferences</Link>
          <button role="menuitem" type="button" onClick={toggleTheme} className={itemCls}>
            {isDark ? <Sun size={16} className="text-muted" /> : <Moon size={16} className="text-muted" />}
            {isDark ? 'Light theme' : 'Dark theme'}
          </button>
          <div className="my-1 border-t border-line" />
          <button role="menuitem" type="button" onClick={signOut} className={`${itemCls} text-danger`}><LogOut size={16} /> Sign out</button>
        </div>
      )}
    </div>
  )
}
