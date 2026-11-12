import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/helpers'

const VARIANTS = {
  primary: 'bg-navy text-white hover:bg-navy-2 shadow-xs dark:bg-[#4453a8] dark:hover:bg-[#5262bd]',
  accent: 'bg-accent text-navy hover:brightness-95 shadow-xs font-semibold',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-2 hover:border-line-strong shadow-xs',
  outline: 'border border-brand/40 text-brand hover:bg-brand/5',
  ghost: 'text-ink-2 hover:text-ink hover:bg-surface-3',
  success: 'bg-success text-white hover:brightness-95 shadow-xs',
  danger: 'bg-danger text-white hover:brightness-95 shadow-xs',
  'danger-outline': 'border border-danger/35 text-danger hover:bg-danger/8',
  link: 'text-brand hover:underline underline-offset-4 px-0 h-auto',
}

const SIZES = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-md',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-lg',
  icon: 'h-9 w-9 justify-center rounded-lg',
  'icon-sm': 'h-8 w-8 justify-center rounded-lg',
}

/**
 * Button / link-button. Pass `to` for router navigation or `href` for external links.
 */
export default function Button({
  variant = 'primary', size = 'md', loading = false, icon: Icon, iconRight: IconRight,
  className, children, to, href, disabled, type = 'button', fullWidth, ...rest
}) {
  const classes = cn(
    'inline-flex items-center font-medium transition-colors duration-150 select-none whitespace-nowrap',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus-visible:outline-2 active:translate-y-px',
    VARIANTS[variant], SIZES[size], fullWidth && 'w-full justify-center', className,
  )
  const iconSize = size === 'xs' ? 14 : size === 'lg' ? 18 : 16
  const content = (
    <>
      {loading ? <Loader2 size={iconSize} className="animate-spin" aria-hidden /> : Icon && <Icon size={iconSize} aria-hidden />}
      {children}
      {IconRight && !loading && <IconRight size={iconSize} aria-hidden />}
    </>
  )
  if (to) return <Link to={to} className={classes} {...rest}>{content}</Link>
  if (href) return <a href={href} className={classes} {...rest}>{content}</a>
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  )
}
