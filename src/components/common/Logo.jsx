import logoWhite from '../../assets/images/bellomassi-logo-white.png'
import { Snowflake } from 'lucide-react'
import { cn } from '../../utils/helpers'

/**
 * Brand mark.
 * variant="image": official white logo (for dark/navy surfaces)
 * variant="mark": compact snowflake tile for collapsed sidebars and light surfaces
 */
export default function Logo({ variant = 'image', className, withText = false }) {
  if (variant === 'image') {
    return <img src={logoWhite} alt="Bellomassi" className={cn('h-9 w-auto select-none', className)} draggable={false} />
  }
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy text-accent shadow-sm">
        <Snowflake size={18} strokeWidth={2.25} aria-hidden />
      </span>
      {withText && <span className="text-lg font-semibold tracking-tight text-ink">Bellomassi</span>}
    </span>
  )
}
