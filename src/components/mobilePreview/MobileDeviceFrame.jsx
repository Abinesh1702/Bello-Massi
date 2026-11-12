import { forwardRef } from 'react'
import DeviceStatusBar from './DeviceStatusBar'
import DeviceNavigationBar from './DeviceNavigationBar'

/**
 * Realistic phone body around the app screen. `width` × `height` is the screen in CSS pixels for the current
 * orientation; the status bar and gesture area are drawn inside it, and `children` (the app frame) gets the rest.
 * The tree has the same shape for every platform / size / orientation so the app inside is never remounted.
 */
const MobileDeviceFrame = forwardRef(function MobileDeviceFrame({ platform, width, height, landscape, children }, ref) {
  const b = platform.bezel
  const statusBar = landscape ? platform.landscapeStatusBar : platform.statusBar
  const navBar = landscape ? platform.landscapeNavBar : platform.navBar
  const outerW = width + b * 2
  const outerH = height + b * 2
  const side = (pos) => ({ position: 'absolute', borderRadius: 3, background: 'linear-gradient(90deg,#1f2433,#3b4257)', ...pos })
  return (
    <div ref={ref} className="relative" style={{ width: outerW, height: outerH }} data-testid="device-frame" data-platform={platform.id} data-orientation={landscape ? 'landscape' : 'portrait'}>
      {/* hardware buttons */}
      {landscape ? (
        <>
          <span style={side({ top: -3, left: outerW * 0.22, width: 54, height: 4 })} />
          <span style={side({ top: -3, left: outerW * 0.22 + 64, width: 54, height: 4 })} />
          <span style={side({ bottom: -3, left: outerW * 0.3, width: 70, height: 4 })} />
        </>
      ) : (
        <>
          <span style={side({ left: -3, top: outerH * 0.2, width: 4, height: 54 })} />
          <span style={side({ left: -3, top: outerH * 0.2 + 64, width: 4, height: 54 })} />
          <span style={side({ right: -3, top: outerH * 0.26, width: 4, height: 76 })} />
        </>
      )}
      <div className="absolute inset-0" style={{
        borderRadius: platform.radius,
        background: platform.id === 'iphone' ? 'linear-gradient(145deg,#2b2f3a,#0d0f14 45%,#22252e)' : 'linear-gradient(145deg,#1c1f27,#07080b 50%,#1a1d24)',
        boxShadow: '0 0 0 1.5px rgba(255,255,255,0.08) inset, 0 30px 70px -20px rgba(10,14,40,0.55), 0 12px 28px -12px rgba(10,14,40,0.45)',
      }} />
      <div className="absolute flex flex-col overflow-hidden bg-canvas" style={{ left: b, top: b, width, height, borderRadius: platform.screenRadius }}>
        <DeviceStatusBar platform={platform} height={statusBar} landscape={landscape} />
        <div className="relative min-h-0 flex-1">{children}</div>
        <DeviceNavigationBar platform={platform} height={navBar} />
      </div>
    </div>
  )
})

export default MobileDeviceFrame
