import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/helpers'

export default function LoadingSpinner({ size = 20, label, className, fullPage = false }) {
  const spinner = (
    <div className={cn('flex items-center gap-2.5 text-muted', className)} role="status" aria-live="polite">
      <Loader2 size={size} className="animate-spin text-brand" aria-hidden />
      {label ? <span className="text-sm">{label}</span> : <span className="sr-only">Loading</span>}
    </div>
  )
  if (!fullPage) return spinner
  return <div className="min-h-[50vh] grid place-items-center">{spinner}</div>
}

