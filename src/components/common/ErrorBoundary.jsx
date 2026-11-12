import { Component } from 'react'
import { AlertOctagon, RotateCcw, Home } from 'lucide-react'

/** Catches render errors so a failing module never blanks the whole app. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[Bellomassi] UI error caught by boundary:', error, info?.componentStack)
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-[50vh] grid place-items-center p-6">
        <div className="max-w-md w-full text-center rounded-xl border border-line bg-surface p-8 shadow-card">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger dark:bg-danger/100/15">
            <AlertOctagon size={22} />
          </span>
          <h2 className="text-lg font-semibold text-ink">Something went wrong on this screen</h2>
          <p className="text-sm text-muted mt-2">
            The rest of the app is still working. Try again, or go back to the dashboard.
          </p>
          <pre className="mt-4 max-h-24 overflow-auto rounded-lg bg-surface-2 p-3 text-left text-xs text-muted whitespace-pre-wrap">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={() => this.setState({ error: null })} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-line text-sm font-medium hover:bg-surface-2">
              <RotateCcw size={15} /> Try again
            </button>
            <a href="/dashboard" className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-2">
              <Home size={15} /> Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }
}
