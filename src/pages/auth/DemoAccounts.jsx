import { ChevronDown, KeyRound, MousePointerClick } from 'lucide-react'
import { useState } from 'react'
import { getDemoAccounts, findUserByIdentifier } from '../../services/authService'
import { getRoleLabel } from '../../config/roles'
import { cn } from '../../utils/helpers'
import Badge from '../../components/common/Badge'

/** Public demo credentials. Choosing an account (dropdown or list) fills the sign-in form. */
export default function DemoAccounts({ onSelect, selectedEmail }) {
  const [open, setOpen] = useState(true)
  const accounts = getDemoAccounts().map((a) => {
    const stored = findUserByIdentifier(a.email)
    return { ...a, inactive: stored ? stored.status !== 'active' : false, missing: !stored }
  })
  const isSelected = (a) => [a.email, a.username].includes(String(selectedEmail || '').trim().toLowerCase())
  return (
    <div className="mt-6 rounded-xl border border-line bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <KeyRound size={15} className="text-accent" aria-hidden />
          <span className="text-sm font-semibold text-ink">Demo accounts</span>
          <span className="text-xs text-muted">· {accounts.length} roles</span>
        </span>
        <ChevronDown size={16} className={cn('text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-line">
          <div className="px-4 pt-3">
            <label htmlFor="demo-account-select" className="text-xs font-medium text-muted">Demo account selector</label>
            <select
              id="demo-account-select"
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={accounts.find(isSelected)?.email || ''}
              onChange={(e) => { const a = accounts.find((x) => x.email === e.target.value); if (a) onSelect(a) }}
            >
              <option value="">Choose a role to sign in as…</option>
              {accounts.map((a) => <option key={a.email} value={a.email}>{getRoleLabel(a.role)} — {a.name}</option>)}
            </select>
          </div>
          <p className="flex items-center gap-1.5 px-4 pt-2.5 text-xs text-muted">
            <MousePointerClick size={13} aria-hidden /> Or select a row. Demo only — not production credentials.
          </p>
          <ul className="p-2 grid gap-1 max-h-[22rem] overflow-y-auto scroll-thin">
            {accounts.map((a) => (
              <li key={a.email}>
                <button
                  type="button"
                  onClick={() => onSelect(a)}
                  aria-pressed={isSelected(a)}
                  className={cn(
                    'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                    isSelected(a) ? 'bg-accent/15 ring-1 ring-accent/50' : 'hover:bg-surface-2',
                  )}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-ink">{getRoleLabel(a.role)}{a.inactive && <Badge tone="danger">Inactive</Badge>}</span>
                    <span className="block truncate text-xs text-muted">{a.username} · {a.email}</span>
                  </span>
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-ink tabular">{a.password}</code>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
