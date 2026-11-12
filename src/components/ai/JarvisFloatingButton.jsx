import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Mic, X } from 'lucide-react'
import JarvisConsole, { JarvisOrb } from './JarvisConsole'
import { usePermission } from '../../hooks/usePermission'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { cn } from '../../utils/helpers'

/**
 * Optional floating Jarvis launcher. Hidden on the Jarvis and Assistant pages, for roles without
 * Jarvis, and when switched off in Jarvis settings. Sits above the page footer, clear of the sidebar.
 */
export default function JarvisFloatingButton({ sidebarCollapsed }) {
  const { pathname } = useLocation()
  const allowed = usePermission('jarvis.view')
  const { jarvisSettings: s } = usePhase6Data()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  if (!allowed || !s.floatingButton || pathname.startsWith('/ai/jarvis') || pathname.startsWith('/ai/assistant')) return null
  const left = s.floatingPosition === 'bottom-left'
  const side = left ? cn('left-4', sidebarCollapsed ? 'lg:left-[calc(72px+1rem)]' : 'lg:left-[calc(16rem+1rem)]') : 'right-4'
  return (
    <>
      {/* In-flow spacer so the last row of any page can scroll clear of the floating button */}
      <div aria-hidden className="h-16" />
      {open && (
        <div role="dialog" aria-label="Jarvis" className={cn('fixed bottom-20 z-50 flex h-[min(72vh,580px)] w-[min(calc(100vw-2rem),400px)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-scale-in', side)}>
          <div className="flex items-center justify-between border-b border-line bg-brand px-4 py-2.5 text-white">
            <span className="text-sm font-semibold">Jarvis</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/10" aria-label="Close Jarvis"><X size={16} /></button>
          </div>
          <div className="min-h-0 flex-1"><JarvisConsole compact onNavigate={() => setOpen(false)} /></div>
        </div>
      )}
      <button
        type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Close Jarvis' : 'Open Jarvis'} data-testid="jarvis-fab"
        className={cn('fixed bottom-5 z-50 grid h-12 w-12 place-items-center rounded-full shadow-pop ring-2 ring-surface transition-transform hover:scale-105 focus-visible:outline-2', side)}
      >
        {open ? <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-white"><X size={20} /></span> : <span className="relative grid place-items-center"><JarvisOrb status="idle" size={48} /><Mic size={18} className="absolute text-white" aria-hidden /></span>}
      </button>
    </>
  )
}
