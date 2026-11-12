import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Info, KeyRound, LogIn, LogOut, MonitorSmartphone, ChevronRight, Database, ShieldAlert } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import MobileDeviceFrame from '../../components/mobilePreview/MobileDeviceFrame'
import DeviceToolbar from '../../components/mobilePreview/DeviceToolbar'
import { DEVICE_PLATFORMS, DEVICE_SIZES, PREVIEW_APPS, ZOOM_STEPS } from '../../config/devicePresets'
import { isDevicePreview, PREVIEW_FRAME_NAME, PREVIEW_MSG } from '../../utils/devicePreview'
import storage from '../../services/storageService'
import { STORAGE_KEYS } from '../../utils/constants'
import { cn } from '../../utils/helpers'
import { useAuth } from '../../hooks/useAuth'
import { landingPathFor } from '../../services/rbacService'

const PREFS_KEY = 'bellomassi_preview_prefs' // per-browser UI preference only
const DEFAULTS = { app: 'driver', platform: 'android', size: 'modern', landscape: false, zoom: 'fit' }
const readPrefs = () => {
  try { return { ...DEFAULTS, ...(JSON.parse(window.localStorage.getItem(PREFS_KEY)) || {}) } } catch { return DEFAULTS }
}
const writePrefs = (p) => { try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(p)) } catch { /* private mode */ } }

/** Resolve quick links that need a record of the signed-in preview user (a delivery or an order). */
const resolveDynamic = (kind, previewUser) => {
  if (!previewUser) return { error: 'Sign in inside the device first.' }
  if (kind === 'activeDelivery' || kind === 'confirmDelivery') {
    const driver = (storage.getItem(STORAGE_KEYS.DRIVERS, []) || []).find((d) => d.userId === previewUser.id)
    if (!driver) return { error: 'The signed-in preview user is not linked to a driver record.' }
    const mine = (storage.getItem(STORAGE_KEYS.DELIVERIES, []) || []).filter((d) => d.driverId === driver.id)
    const active = mine.find((d) => d.status === 'OUT_FOR_DELIVERY')
      || mine.filter((d) => d.status === 'DISPATCHED').sort((a, b) => (a.sequence || 0) - (b.sequence || 0))[0]
      || mine[mine.length - 1]
    if (!active) return { error: 'This driver has no deliveries.' }
    if (kind === 'confirmDelivery') {
      if (active.status === 'OUT_FOR_DELIVERY' && active.arrivedAt) return { path: `/driver/deliveries/${active.id}/confirm` }
      return { path: `/driver/deliveries/${active.id}`, note: 'OTP and proof of delivery open after "Start delivery" and "Reach location" on this stop — the app enforces that order.' }
    }
    return { path: `/driver/deliveries/${active.id}` }
  }
  if (kind === 'latestOrder') {
    const orders = (storage.getItem(STORAGE_KEYS.ORDERS, []) || []).filter((o) => o.customerId && o.customerId === previewUser.customerId)
    const latest = orders.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0]
    return latest ? { path: `/customer/orders/${latest.id}` } : { error: 'This customer has no orders yet — place one from the catalog.' }
  }
  return { error: 'Unknown screen.' }
}

/**
 * Mobile App Preview — a device emulator that runs the REAL driver and customer apps (their routes, layouts,
 * services and data) inside a phone frame. The app is loaded in a same-origin iframe so the phone width drives the
 * app's responsive CSS exactly as on a device; the frame keeps its own preview session (utils/devicePreview.js).
 */
export default function MobilePreviewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [prefs, setPrefs] = useState(readPrefs)
  const { app, platform: platformId, size: sizeId, landscape, zoom } = prefs
  const update = useCallback((patch) => setPrefs((p) => { const n = { ...p, ...patch }; writePrefs(n); return n }), [])
  const platform = DEVICE_PLATFORMS[platformId] || DEVICE_PLATFORMS.android
  const size = DEVICE_SIZES.find((s) => s.id === sizeId) || DEVICE_SIZES[2]
  const appDef = PREVIEW_APPS[app] || PREVIEW_APPS.driver
  const screenW = landscape ? size.height : size.width
  const screenH = landscape ? size.width : size.height
  const outerW = screenW + platform.bezel * 2
  const outerH = screenH + platform.bezel * 2

  const frameRef = useRef(null)
  const stageRef = useRef(null)
  const fitRef = useRef(null)
  const [frameSrc] = useState(() => PREVIEW_APPS[readPrefs().app]?.home || '/driver/dashboard')
  const [loaded, setLoaded] = useState(false)
  const [current, setCurrent] = useState({ path: '', title: '', user: null })
  const [fit, setFit] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [busy, setBusy] = useState(false)

  // Fit the device into the space left under the toolbar (window height in normal mode, screen in fullscreen).
  useLayoutEffect(() => {
    const el = fitRef.current
    if (!el) return undefined
    const measure = () => {
      const rect = el.getBoundingClientRect()
      const availW = Math.max(200, rect.width - 8)
      const availH = Math.max(320, (fullscreen ? window.innerHeight - rect.top : window.innerHeight - rect.top - 24) - 8)
      setFit(Math.min(1, availW / outerW, availH / outerH))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [outerW, outerH, fullscreen])

  const scale = zoom === 'fit' ? fit : zoom
  const zoomIdx = ZOOM_STEPS.findIndex((z) => Math.abs(z - scale) < 0.001)
  const zoomIn = () => update({ zoom: ZOOM_STEPS.find((z) => z > scale + 0.001) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1] })
  const zoomOut = () => update({ zoom: [...ZOOM_STEPS].reverse().find((z) => z < scale - 0.001) ?? ZOOM_STEPS[0] })

  const post = useCallback((msg) => {
    const win = frameRef.current?.contentWindow
    if (!win) return false
    win.postMessage(msg, window.location.origin)
    return true
  }, [])

  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow || !e.data) return
      if (e.data.type === PREVIEW_MSG.LOCATION) setCurrent({ path: e.data.path, title: e.data.title, user: e.data.user })
      if (e.data.type === PREVIEW_MSG.RESULT) {
        setBusy(false)
        if (e.data.action === 'login') {
          if (e.data.ok) toast.success('Signed in inside the device')
          else toast.error(e.data.error || 'Sign-in failed')
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === stageRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const userMatchesApp = (u, def) => Boolean(u) && u.scope === def.scope

  const switchApp = (id) => {
    const def = PREVIEW_APPS[id]
    update({ app: id })
    if (userMatchesApp(current.user, def)) post({ type: PREVIEW_MSG.NAVIGATE, path: def.home })
    else if (current.user) post({ type: PREVIEW_MSG.LOGOUT, to: def.login })
    else post({ type: PREVIEW_MSG.NAVIGATE, path: def.login })
  }

  const openScreen = (screen) => {
    if (screen.signedOut) {
      if (current.user) post({ type: PREVIEW_MSG.LOGOUT, to: screen.path })
      else post({ type: PREVIEW_MSG.NAVIGATE, path: screen.path })
      return
    }
    if (!userMatchesApp(current.user, appDef)) {
      toast.info(`Sign in to the ${appDef.label} first`, { description: 'Use the demo account button or the sign-in form inside the device.' })
      post({ type: PREVIEW_MSG.NAVIGATE, path: appDef.login })
      return
    }
    if (screen.dynamic) {
      const r = resolveDynamic(screen.dynamic, current.user)
      if (r.error) { toast.error(r.error); return }
      if (r.note) toast.info(r.note)
      post({ type: PREVIEW_MSG.NAVIGATE, path: r.path })
      return
    }
    post({ type: PREVIEW_MSG.NAVIGATE, path: screen.path })
  }

  const demoSignIn = () => {
    setBusy(true)
    const go = () => post({ type: PREVIEW_MSG.LOGIN, identifier: appDef.demo.identifier, password: appDef.demo.password })
    if (current.user && !userMatchesApp(current.user, appDef)) { post({ type: PREVIEW_MSG.LOGOUT, to: appDef.login }); window.setTimeout(go, 300) } else go()
    window.setTimeout(() => setBusy(false), 4000)
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await stageRef.current?.requestFullscreen()
    } catch { toast.error('Fullscreen is not available in this browser window.') }
  }

  const exit = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    // The device frame shares the tab's history, so "back" could land inside the app — go to the user's landing page.
    navigate(landingPathFor(user) || '/dashboard')
  }

  const reload = () => {
    setLoaded(false)
    try { frameRef.current?.contentWindow?.location.reload() } catch { /* ignore */ }
  }

  const screens = useMemo(() => appDef.screens, [appDef])

  if (isDevicePreview()) {
    return <Card><EmptyState icon={MonitorSmartphone} title="Preview inside the preview" description="The Mobile App Preview cannot be opened inside the device frame." /></Card>
  }

  const zoomLabel = `${Math.round(scale * 100)}%`

  return (
    <div>
      <PageHeader title="Mobile App Preview" description="The real Driver and Customer apps running inside a phone frame — same routes, screens, rules and data as on a device. Everything you do here changes the demo data in this browser." />
      <div ref={stageRef} className={cn('flex flex-col gap-4', fullscreen && 'h-full overflow-auto bg-canvas p-4')} data-testid="preview-stage">
        <DeviceToolbar
          app={app} onApp={switchApp} platform={platformId} size={sizeId}
          onPlatform={(p) => update({ platform: p })} onSize={(s) => update({ size: s })}
          landscape={landscape} onRotate={() => update({ landscape: !landscape })}
          zoomLabel={zoomLabel} canZoomIn={zoomIdx === -1 ? scale < ZOOM_STEPS[ZOOM_STEPS.length - 1] : zoomIdx < ZOOM_STEPS.length - 1}
          canZoomOut={scale > ZOOM_STEPS[0] + 0.001} onZoomIn={zoomIn} onZoomOut={zoomOut} onZoomReset={() => update({ zoom: 'fit' })}
          onBack={() => post({ type: PREVIEW_MSG.BACK })} onReload={reload}
          fullscreen={fullscreen} onFullscreen={toggleFullscreen} onExit={exit}
        />

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          {/* Device */}
          <div ref={fitRef} className="relative flex min-w-0 flex-1 justify-center rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_30%,var(--surface-2),var(--surface-3))] py-6">
            <div style={{ width: outerW * scale, height: outerH * scale }} className="relative shrink-0">
              <div style={{ width: outerW, height: outerH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <MobileDeviceFrame platform={platform} width={screenW} height={screenH} landscape={landscape}>
                  {!loaded && <div className="absolute inset-0 z-10 grid place-items-center bg-canvas text-sm text-muted">Loading app…</div>}
                  <iframe
                    ref={frameRef}
                    name={PREVIEW_FRAME_NAME}
                    title={`${appDef.label} preview`}
                    src={frameSrc}
                    onLoad={() => setLoaded(true)}
                    className="absolute inset-0 h-full w-full border-0 bg-canvas"
                    data-testid="device-app-frame"
                  />
                </MobileDeviceFrame>
              </div>
            </div>
          </div>

          {/* Side information panel */}
          <aside className={cn('w-full shrink-0 space-y-4 xl:w-80', fullscreen && 'hidden xl:block')} aria-label="Preview controls">
            <Card>
              <CardHeader title="In the device" icon={MonitorSmartphone} subtitle={`${platform.label} · ${size.label} · ${screenW} × ${screenH}${landscape ? ' · landscape' : ''}`} />
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted">Screen</dt><dd className="truncate text-right font-mono text-[12px] text-ink" data-testid="preview-path">{current.path || '—'}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Signed in</dt><dd className="text-right text-ink" data-testid="preview-user">{current.user ? `${current.user.name}` : 'Nobody'}</dd></div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" icon={LogIn} loading={busy} onClick={demoSignIn}>Sign in as demo {app}</Button>
                {current.user && <Button size="sm" variant="secondary" icon={LogOut} onClick={() => post({ type: PREVIEW_MSG.LOGOUT, to: appDef.login })}>Sign out</Button>}
              </div>
              <p className="mt-2 flex gap-1.5 text-xs text-muted"><KeyRound size={13} className="mt-0.5 shrink-0" aria-hidden />{appDef.demo.label} · <span className="font-mono">{appDef.demo.identifier} / {appDef.demo.password}</span></p>
            </Card>

            <Card padded={false}>
              <div className="px-4 pt-4"><CardHeader title={`${appDef.label} screens`} subtitle="Opens the screen inside the device" /></div>
              <ul className="divide-y divide-line">
                {screens.map((s) => {
                  const active = s.path && current.path.split('?')[0] === s.path
                  return (
                    <li key={s.id}>
                      <button type="button" onClick={() => openScreen(s)} className={cn('flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-2', active ? 'font-semibold text-brand' : 'text-ink')}>
                        <span className="flex-1">{s.label}</span>
                        {s.signedOut && <Badge tone="neutral">signs out</Badge>}
                        <ChevronRight size={15} className="text-muted" aria-hidden />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Card>

            <Card>
              <CardHeader title="About this preview" icon={Info} />
              <ul className="space-y-2 text-xs text-muted">
                <li className="flex gap-1.5"><Database size={13} className="mt-0.5 shrink-0" aria-hidden />Runs the actual app screens and services. Orders, deliveries, OTPs and POD you create here are saved to this browser’s demo data and appear in the office screens.</li>
                <li className="flex gap-1.5"><ShieldAlert size={13} className="mt-0.5 shrink-0" aria-hidden />The device keeps its own sign-in, so your office session is not affected. It is a browser preview, not a native app: GPS, camera, push notifications and offline mode are not those of a real phone (positions are DEMO GPS).</li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
