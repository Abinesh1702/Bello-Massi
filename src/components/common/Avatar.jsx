import { cn } from '../../utils/helpers'
import { getInitials } from '../../utils/formatters'

const SIZES = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl', xl: 'h-20 w-20 text-2xl' }

export default function Avatar({ name, color = '#232B5F', image, size = 'sm', className }) {
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-semibold text-white overflow-hidden ring-2 ring-surface', SIZES[size], className)}
      style={image ? undefined : { backgroundColor: color }}
      aria-hidden
    >
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
    </span>
  )
}
