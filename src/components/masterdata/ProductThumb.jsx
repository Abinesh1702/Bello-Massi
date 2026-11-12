import { Package, Snowflake, Thermometer, Wrench, Zap, Cog, Box } from 'lucide-react'
import { cn } from '../../utils/helpers'

const ICONS = { 'Frozen Food': Snowflake, 'Chilled Food': Thermometer, Electrical: Zap, Mechanical: Cog, 'Spare Parts': Wrench, Consumables: Box }

/** Product image, or a category placeholder when no image is set. */
export default function ProductThumb({ product, size = 'md', className }) {
  const sizes = { sm: 'h-9 w-9', md: 'h-11 w-11', lg: 'h-24 w-24', xl: 'h-40 w-40' }
  const iconSize = { sm: 16, md: 18, lg: 32, xl: 48 }[size]
  const Icon = ICONS[product?.category] || Package
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface-2 text-brand', sizes[size], className)}>
      {product?.image ? <img src={product.image} alt="" className="h-full w-full object-cover" /> : <Icon size={iconSize} aria-hidden />}
    </span>
  )
}
