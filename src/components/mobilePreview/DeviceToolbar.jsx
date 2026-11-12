import { ArrowLeft, Maximize2, Minimize2, Minus, Plus, RotateCw, Scan, RefreshCw, LogOut, Smartphone, Truck, Store } from 'lucide-react'
import { DEVICE_PLATFORMS, DEVICE_SIZES } from '../../config/devicePresets'
import { cn } from '../../utils/helpers'

const seg = 'inline-flex rounded-lg border border-line bg-surface p-0.5 shadow-xs'
const segBtn = (on) => cn('inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors', on ? 'bg-navy text-white dark:bg-[#4453a8]' : 'text-ink-2 hover:bg-surface-3 hover:text-ink')
const iconBtn = 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 shadow-xs hover:bg-surface-2 hover:text-ink disabled:opacity-40'

/** Switch between the Driver and Customer apps without leaving the emulator. */
export function MobileAppSwitcher({ app, onChange }) {
  return (
    <div className={seg} role="group" aria-label="App to preview">
      <button type="button" className={segBtn(app === 'driver')} aria-pressed={app === 'driver'} onClick={() => onChange('driver')}><Truck size={15} aria-hidden />Driver</button>
      <button type="button" className={segBtn(app === 'customer')} aria-pressed={app === 'customer'} onClick={() => onChange('customer')}><Store size={15} aria-hidden />Customer</button>
    </div>
  )
}

/** Platform (Android / iPhone) and screen-size preset. */
export function DeviceSelector({ platform, size, onPlatform, onSize }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className={seg} role="group" aria-label="Device platform">
        {Object.values(DEVICE_PLATFORMS).map((p) => (
          <button key={p.id} type="button" className={segBtn(platform === p.id)} aria-pressed={platform === p.id} onClick={() => onPlatform(p.id)}>
            <Smartphone size={15} aria-hidden />{p.label}
          </button>
        ))}
      </div>
      <label className="sr-only" htmlFor="device-size">Device size</label>
      <select id="device-size" value={size} onChange={(e) => onSize(e.target.value)}
        className="h-9 rounded-lg border border-line bg-surface px-2.5 text-[13px] text-ink shadow-xs focus-visible:outline-2">
        {DEVICE_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label} — {s.width} × {s.height}</option>)}
      </select>
    </div>
  )
}

/**
 * Emulator toolbar: app switcher, device selection, orientation, zoom, back / reload, fullscreen and exit.
 * Device and zoom controls are hidden on phone-sized screens, where the device simply fits the viewport.
 */
export default function DeviceToolbar({
  app, onApp, platform, size, onPlatform, onSize, landscape, onRotate,
  zoomLabel, onZoomIn, onZoomOut, onZoomReset, canZoomIn, canZoomOut,
  onBack, onReload, fullscreen, onFullscreen, onExit,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="device-toolbar">
      <MobileAppSwitcher app={app} onChange={onApp} />
      <div className="hidden sm:flex"><DeviceSelector platform={platform} size={size} onPlatform={onPlatform} onSize={onSize} /></div>
      <button type="button" className={cn(iconBtn, 'hidden sm:inline-flex')} onClick={onRotate} aria-pressed={landscape} title={landscape ? 'Switch to portrait' : 'Switch to landscape'} aria-label={landscape ? 'Switch to portrait' : 'Switch to landscape'}>
        <RotateCw size={16} className={cn('transition-transform', landscape && 'rotate-90')} aria-hidden />
      </button>
      <div className="hidden items-center gap-1 rounded-lg border border-line bg-surface p-0.5 shadow-xs md:inline-flex" role="group" aria-label="Zoom">
        <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-2 hover:bg-surface-3 disabled:opacity-40" onClick={onZoomOut} disabled={!canZoomOut} aria-label="Zoom out"><Minus size={15} aria-hidden /></button>
        <span className="w-12 text-center text-[13px] font-medium tabular text-ink" aria-live="polite" data-testid="zoom-label">{zoomLabel}</span>
        <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-2 hover:bg-surface-3 disabled:opacity-40" onClick={onZoomIn} disabled={!canZoomIn} aria-label="Zoom in"><Plus size={15} aria-hidden /></button>
        <button type="button" className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] text-ink-2 hover:bg-surface-3" onClick={onZoomReset} title="Reset zoom (fit to screen)"><Scan size={14} aria-hidden />Fit</button>
      </div>
      <div className="flex-1" />
      <button type="button" className={iconBtn} onClick={onBack} aria-label="Back (inside the app)" title="Back (inside the app)"><ArrowLeft size={16} aria-hidden /></button>
      <button type="button" className={iconBtn} onClick={onReload} aria-label="Reload the app" title="Reload the app"><RefreshCw size={16} aria-hidden /></button>
      <button type="button" className={iconBtn} onClick={onFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen preview'} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen preview'}>
        {fullscreen ? <Minimize2 size={16} aria-hidden /> : <Maximize2 size={16} aria-hidden />}
      </button>
      <button type="button" onClick={onExit} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] font-medium text-ink-2 shadow-xs hover:bg-surface-2 hover:text-ink">
        <LogOut size={15} aria-hidden /><span className="hidden sm:inline">Exit emulator</span><span className="sm:hidden">Exit</span>
      </button>
    </div>
  )
}
