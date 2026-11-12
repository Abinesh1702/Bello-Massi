import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/helpers'

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Accessible modal: portal, focus trap, Escape to close, scroll lock, focus restore. */
export default function Modal({ open, onClose, title, description, children, footer, size = 'md', dismissible = true, icon: Icon }) {
  const panelRef = useRef(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const first = panelRef.current?.querySelector('[data-autofocus]') || panelRef.current?.querySelector(FOCUSABLE)
    first?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation()
        onClose?.()
      }
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE))
        if (!nodes.length) return
        const firstEl = nodes[0]
        const lastEl = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [open, dismissible, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-[#0b1024]/45 animate-fade-in" onClick={dismissible ? onClose : undefined} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn('relative w-full bg-surface border border-line shadow-pop rounded-t-2xl sm:rounded-xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col animate-sheet-up sm:animate-scale-in pb-[env(safe-area-inset-bottom)] sm:pb-0', SIZES[size])}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <div className="flex items-start gap-3 border-b border-line px-5 pt-4 pb-3.5 sm:pt-5">
          {Icon && (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-3 text-brand">
              <Icon size={18} aria-hidden />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h2 id={titleId} className="text-[15px] font-semibold leading-6 text-ink">{title}</h2>
            {description && <p id={descId} className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {dismissible && (
            <button type="button" onClick={onClose} className="-mr-1.5 -mt-0.5 rounded-lg p-1.5 text-muted hover:text-ink hover:bg-surface-3" aria-label="Close dialog">
              <X size={18} />
            </button>
          )}
        </div>
        {children && <div className="px-5 py-4 overflow-y-auto scroll-thin">{children}</div>}
        {footer && <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-3.5 border-t border-line bg-surface-2 sm:rounded-b-xl">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
