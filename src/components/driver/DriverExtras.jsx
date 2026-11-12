import { useEffect, useRef, useState } from 'react'
import { Crown, Eraser, Check, Clock, Navigation2 } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { cn } from '../../utils/helpers'
import { formatTime } from '../../utils/formatters'
import { customerCoords, hubCoords } from '../../utils/demoGeo'

/** Re-render every `ms` (used for simulated positions and countdowns). */
export const useNow = (ms = 5000) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), ms); return () => window.clearInterval(t) }, [ms])
  return now
}

export const VipBadge = () => <Badge tone="accent"><Crown size={11} aria-hidden />VIP</Badge>

export const DemoGpsBadge = ({ className }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full border border-dashed border-accent/70 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink', className)} title="Simulated position — not real GPS">
    <Navigation2 size={10} aria-hidden />Demo GPS
  </span>
)

/** ETA line for a stop: estimated arrival, requested time and a late warning. */
export function EtaLine({ plan, className }) {
  if (!plan) return null
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted tabular', className)}>
      <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{plan.eta ? `ETA ${formatTime(plan.eta)}` : 'Closed'}</span>
      <span>· {plan.distanceKm} km (est.)</span>
      {plan.requestedAt && <span>· requested by {formatTime(plan.requestedAt)}</span>}
      {plan.late && <Badge tone="danger">ETA after requested time</Badge>}
    </p>
  )
}

const FLOW = ['Assigned', 'Planned', 'Out for delivery', 'Arrived', 'OTP verification', 'Delivered']
/** Step index of a delivery in the driver flow. */
export const flowStep = (d, dispatch) => {
  if (!d) return dispatch?.status === 'ASSIGNED' ? 0 : 1
  if (['DELIVERED', 'PARTIALLY_DELIVERED'].includes(d.status)) return 5
  if (d.status === 'OUT_FOR_DELIVERY') return d.arrivedAt ? (d.otpStatus === 'ACTIVE' ? 4 : 3) : 2
  return dispatch?.status === 'ASSIGNED' ? 0 : 1
}

export function DeliveryFlow({ step, failed = false }) {
  return (
    <ol className="grid grid-cols-6 gap-1" aria-label="Delivery progress">
      {FLOW.map((label, i) => {
        const done = i < step || (i === step && step === 5)
        const current = i === step && step !== 5
        return (
          <li key={label} className="min-w-0 text-center" aria-current={current ? 'step' : undefined}>
            <span className={cn('mx-auto block h-1.5 rounded-full', failed && i >= step ? 'bg-danger/40' : done ? 'bg-success' : current ? 'bg-accent' : 'bg-surface-2')} />
            <span className={cn('mt-1 block truncate text-[10px] leading-tight', current ? 'font-semibold text-ink' : 'text-muted')}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Schematic DEMO GPS map (SVG, no map tiles): hub, numbered stops in the dispatcher's sequence and the simulated
 * vehicle position. Coordinates come from utils/demoGeo and are not real locations.
 */
export function DemoRouteMap({ hub, stops = [], customers = {}, position = null, highlightId, height = 260, className, badge = true }) {
  const pts = stops.map((d) => ({ d, c: customerCoords(customers[d.customerId] || d, hub) }))
  const h = hubCoords(hub)
  const all = [h, ...pts.map((p) => p.c), ...(position ? [position.coords] : [])]
  const lats = all.map((c) => c[0])
  const lngs = all.map((c) => c[1])
  const pad = 0.006
  const minLat = Math.min(...lats) - pad
  const maxLat = Math.max(...lats) + pad
  const minLng = Math.min(...lngs) - pad
  const maxLng = Math.max(...lngs) + pad
  const W = 600
  const H = 340
  const xy = ([lat, lng]) => [((lng - minLng) / (maxLng - minLng || 1)) * (W - 40) + 20, (1 - (lat - minLat) / (maxLat - minLat || 1)) * (H - 76) + 46]
  const [hx, hy] = xy(h)
  const route = [[hx, hy], ...pts.map((p) => xy(p.c))]
  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-line bg-surface-2', className)} style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full" role="img" aria-label={`Demo route map with ${stops.length} stops`}>
        <defs>
          <pattern id="demo-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="var(--line)" strokeWidth="1" /></pattern>
        </defs>
        <rect width={W} height={H} fill="url(#demo-grid)" />
        <polyline points={route.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--chart-1)" strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" opacity="0.7" />
        <g>
          <rect x={hx - 11} y={hy - 11} width="22" height="22" rx="5" fill="var(--navy, #232B5F)" />
          <text x={hx} y={hy + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">H</text>
        </g>
        {pts.map(({ d, c }) => {
          const [x, y] = xy(c)
          const closed = ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(d.status)
          const failed = ['FAILED', 'RETURNED'].includes(d.status)
          const hl = highlightId === d.id
          return (
            <g key={d.id}>
              {hl && <circle cx={x} cy={y} r="19" fill="var(--accent)" opacity="0.25" />}
              <circle cx={x} cy={y} r="13" fill={closed ? 'var(--success, #16a34a)' : failed ? 'var(--danger, #dc2626)' : hl ? 'var(--accent)' : 'var(--surface)'} stroke={closed || failed ? 'none' : 'var(--chart-1)'} strokeWidth="2.5" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={closed || failed ? '#fff' : 'var(--ink)'}>{d.sequence}</text>
            </g>
          )
        })}
        {position && (() => {
          const [x, y] = xy(position.coords)
          return (
            <g>
              <circle cx={x} cy={y} r="16" fill="var(--chart-2)" opacity="0.25"><animate attributeName="r" values="10;20;10" dur="2.4s" repeatCount="indefinite" /></circle>
              <circle cx={x} cy={y} r="8" fill="var(--chart-2)" stroke="#fff" strokeWidth="2.5" />
            </g>
          )
        })()}
      </svg>
      {badge && <div className="pointer-events-none absolute left-2 top-2"><DemoGpsBadge /></div>}
      <p className="pointer-events-none absolute bottom-1.5 right-2 text-[10px] text-muted">Schematic · simulated positions, not real GPS</p>
    </div>
  )
}

/** Finger / mouse signature capture → PNG data URL. */
export function SignaturePad({ value, onChange, height = 160 }) {
  const ref = useRef(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(Boolean(value))
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ratio = window.devicePixelRatio || 1
    c.width = c.offsetWidth * ratio
    c.height = height * ratio
    const ctx = c.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
    if (value) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, c.offsetWidth, height); img.src = value }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
  const down = (e) => { e.preventDefault(); ref.current.setPointerCapture?.(e.pointerId); drawing.current = true; const ctx = ref.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(...pos(e)) }
  const move = (e) => { if (!drawing.current) return; const ctx = ref.current.getContext('2d'); ctx.lineTo(...pos(e)); ctx.stroke(); if (!hasInk) setHasInk(true) }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    if (!hasInk) return
    // Export on a white background, downscaled, so it prints and stays small in LocalStorage
    const c = ref.current
    const out = document.createElement('canvas')
    out.width = Math.min(600, c.offsetWidth)
    out.height = Math.round((out.width / c.offsetWidth) * height)
    const octx = out.getContext('2d')
    octx.fillStyle = '#fff'
    octx.fillRect(0, 0, out.width, out.height)
    octx.drawImage(c, 0, 0, out.width, out.height)
    onChange(out.toDataURL('image/png'))
  }
  const clear = () => {
    const c = ref.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    setHasInk(false)
    onChange(null)
  }
  return (
    <div>
      <div className="relative rounded-lg border border-line bg-white" style={{ height }}>
        <canvas ref={ref} className="h-full w-full touch-none cursor-crosshair" style={{ height }} aria-label="Customer signature pad"
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
        {!hasInk && <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-400">Customer signs here</p>}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
        <span className="inline-flex items-center gap-1">{hasInk ? <><Check size={12} className="text-success" aria-hidden />Signature captured</> : 'Optional'}</span>
        <Button size="xs" variant="ghost" icon={Eraser} onClick={clear} disabled={!hasInk}>Clear</Button>
      </div>
    </div>
  )
}
