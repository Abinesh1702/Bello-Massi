import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import EmptyState from './EmptyState'
import { cn } from '../../utils/helpers'
import { getUiConfig } from '../../config/runtimeConfig'

/**
 * Reusable table.
 * columns: [{ key, header, render?(row), className?, align?: 'left'|'right'|'center', hideBelow?: 'sm'|'md'|'lg'|'xl'|'2xl', sortable? }]
 * Sorting is controlled (sort, dir, onSort). Pagination is internal unless page/onPageChange are passed.
 */
const HIDE = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell', '2xl': 'hidden 2xl:table-cell' }

export default function DataTable({
  columns, rows, rowKey = 'id', onRowClick, pageSize: pageSizeProp, empty, className, dense,
  sort, dir, onSort, page: controlledPage, onPageChange, caption,
}) {
  const [innerPage, setInnerPage] = useState(0)
  const page = controlledPage ?? innerPage
  const setPage = onPageChange ?? setInnerPage
  // pageSize="default" uses Application Settings › General › rows per page
  const pageSize = pageSizeProp === 'default' ? getUiConfig().defaultPageSize || 10 : pageSizeProp
  const pageCount = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1
  const current = Math.min(page, pageCount - 1)
  const visible = useMemo(
    () => (pageSize ? rows.slice(current * pageSize, current * pageSize + pageSize) : rows),
    [rows, pageSize, current],
  )

  if (!rows.length) return empty || <EmptyState compact title="No records" description="There is nothing to show yet." />

  const pages = Array.from({ length: pageCount }, (_, i) => i).filter((i) => i === 0 || i === pageCount - 1 || Math.abs(i - current) <= 1)

  return (
    <div className={className}>
      <div className="relative overflow-x-auto scroll-thin -mx-5">
        <table className="w-full text-sm [&_th:first-child]:pl-5 [&_td:first-child]:pl-5 [&_th:last-child]:pr-5 [&_td:last-child]:pr-5">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-y border-line bg-surface-2">
              {columns.map((c) => {
                const sortable = c.sortable && onSort
                const active = sort === c.key
                const Icon = active ? (dir === 'desc' ? ArrowDown : ArrowUp) : ArrowUpDown
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (dir === 'desc' ? 'descending' : 'ascending') : undefined}
                    className={cn(
                      'py-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted whitespace-nowrap',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                      c.hideBelow && HIDE[c.hideBelow],
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort(c.key)}
                        className={cn('inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink', active && 'text-ink', c.align === 'right' && 'flex-row-reverse')}
                      >
                        {c.header}
                        <Icon size={12} className={active ? 'opacity-100' : 'opacity-40'} aria-hidden />
                      </button>
                    ) : c.header}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? (e) => { if (!e.target.closest('button, a, [role=menu]')) onRowClick(row) } : undefined}
                onKeyDown={onRowClick ? (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onRowClick(row) } } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn('border-b border-line last:border-0 transition-colors hover:bg-surface-2/60', onRowClick && 'cursor-pointer hover:bg-surface-2 focus-visible:bg-surface-2')}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      dense ? 'py-2' : 'py-2.5', 'pr-4 text-ink align-middle',
                      c.align === 'right' ? 'text-right tabular' : c.align === 'center' ? 'text-center' : 'text-left',
                      c.hideBelow && HIDE[c.hideBelow], c.className,
                    )}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line -mx-5 px-5 pt-3 text-xs text-muted">
          <span className="tabular">
            Showing {current * pageSize + 1}–{Math.min(rows.length, (current + 1) * pageSize)} of {rows.length}
          </span>
          {pageCount > 1 && (
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button type="button" className="rounded-md p-1.5 hover:bg-surface-2 disabled:opacity-40" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              {pages.map((i, idx) => (
                <span key={i} className="flex items-center">
                  {idx > 0 && pages[idx - 1] !== i - 1 && <span className="px-1">…</span>}
                  <button
                    type="button"
                    onClick={() => setPage(i)}
                    aria-current={i === current ? 'page' : undefined}
                    className={cn('min-w-7 h-7 rounded-md px-1.5 tabular', i === current ? 'bg-navy text-white dark:bg-accent dark:text-navy font-semibold' : 'hover:bg-surface-2')}
                  >
                    {i + 1}
                  </button>
                </span>
              ))}
              <button type="button" className="rounded-md p-1.5 hover:bg-surface-2 disabled:opacity-40" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1} aria-label="Next page">
                <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
