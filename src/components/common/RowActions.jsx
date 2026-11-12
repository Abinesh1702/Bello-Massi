import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '../../utils/helpers'

/**
 * Row action menu (kebab). Rendered in a portal with fixed positioning so it is never
 * clipped by scrolling table containers.
 * items: [{ label, icon, onClick?, to?, danger?, hidden?, disabled? }]
 */
export default function RowActions({ items, label = 'Row actions' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const visible = items.filter((i) => !i.hidden)

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const width = 176
    const height = visible.length * 38 + 12
    const top = r.bottom + height + 8 > window.innerHeight ? r.top - height - 4 : r.bottom + 4
    setPos({ top, left: Math.max(8, Math.min(window.innerWidth - width - 8, r.right - width)) })
  }, [open, visible.length])

  useEffect(() => {
    if (!open) return undefined
    const close = (e) => {
      if (e.type === 'keydown' && e.key !== 'Escape') return
      if (e.type === 'mousedown' && (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target))) return
      setOpen(false)
      if (e.type === 'keydown') btnRef.current?.focus()
    }
    // Close when the page scrolls under the menu — but not for the scroll caused by opening/focusing it
    const openedAt = performance.now()
    const onScroll = (e) => {
      if (performance.now() - openedAt < 250 || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    menuRef.current?.querySelector('[role=menuitem]')?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  if (!visible.length) return null

  const onMenuKey = (e) => {
    const nodes = Array.from(menuRef.current?.querySelectorAll('[role=menuitem]:not([disabled])') || [])
    const i = nodes.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); nodes[(i + 1) % nodes.length]?.focus() }
    if (e.key === 'ArrowUp') { e.preventDefault(); nodes[(i - 1 + nodes.length) % nodes.length]?.focus() }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
      >
        <MoreHorizontal size={17} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={onMenuKey}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[75] w-44 rounded-xl border border-line bg-surface p-1.5 shadow-pop animate-fade-in"
        >
          {visible.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  if (item.to) navigate(item.to)
                  else item.onClick?.()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-left hover:bg-surface-2 focus:bg-surface-2 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed',
                  item.danger ? 'text-danger' : 'text-ink',
                )}
              >
                {Icon && <Icon size={15} className={item.danger ? '' : 'text-muted'} aria-hidden />}
                {item.label}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}
