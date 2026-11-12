import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import Logo from '../common/Logo'
import SidebarNav from './SidebarNav'
import SidebarUser from './SidebarUser'
import { appConfig } from '../../config/appConfig'

/** Slide-in navigation drawer for screens below lg. */
export default function MobileSidebar({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="lg:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div className="absolute inset-0 bg-[#0b1024]/55 animate-fade-in" onClick={onClose} aria-hidden />
      <aside className="absolute inset-y-0 left-0 flex w-[82vw] max-w-72 flex-col bg-sidebar text-white shadow-pop animate-slide-in">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link to="/dashboard" onClick={onClose} aria-label={`${appConfig.name} dashboard`}>
            <Logo className="h-8" />
          </Link>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-sidebar-ink hover:bg-sidebar-hover hover:text-white" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <SidebarNav onNavigate={onClose} />
        <SidebarUser />
      </aside>
    </div>,
    document.body,
  )
}
