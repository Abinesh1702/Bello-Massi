import { useRef, useState } from 'react'
import { FlaskConical, Info } from 'lucide-react'
import { appConfig } from '../../config/appConfig'
import { useClickOutside } from '../../hooks/useClickOutside'
import { cn } from '../../utils/helpers'

/** Subtle global "DEMO PROTOTYPE" indicator with an explanation popover. */
export default function PrototypeBadge({ className, placement = 'below' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false), open)
  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 text-[10.5px] font-semibold tracking-wider text-[#8A5A00] dark:text-accent hover:bg-accent/20"
        title="About this prototype"
      >
        <FlaskConical size={12} aria-hidden />
        <span className="hidden sm:inline">{appConfig.mode}</span>
        <span className="sm:hidden">DEMO</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Prototype information"
          className={cn(
            'absolute z-50 w-72 rounded-xl border border-line bg-surface p-4 shadow-pop animate-fade-in',
            placement === 'below' ? 'right-0 top-full mt-2' : 'left-0 bottom-full mb-2',
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Info size={15} className="text-accent" />
            <p className="text-sm font-semibold text-ink">Prototype mode · v{appConfig.prototypeVersion}</p>
          </div>
          <ul className="space-y-1.5 text-xs text-muted list-disc pl-4">
            {appConfig.prototypeNotes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
