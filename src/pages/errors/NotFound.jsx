import { useLocation } from 'react-router-dom'
import { ArrowLeft, Compass, LayoutDashboard } from 'lucide-react'
import Button from '../../components/common/Button'

export default function NotFound() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-[60vh] grid place-items-center text-center px-4">
      <div className="max-w-md">
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-surface border border-line shadow-card text-brand">
          <Compass size={26} aria-hidden />
        </span>
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-muted">
          There is no page at <code className="rounded bg-surface-2 px-1.5 py-0.5 text-ink">{pathname}</code>. Check the address or use the navigation.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => window.history.back()}>Go back</Button>
          <Button to="/dashboard" icon={LayoutDashboard}>Dashboard</Button>
        </div>
      </div>
    </div>
  )
}
