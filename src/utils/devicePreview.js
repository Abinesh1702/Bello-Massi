/**
 * Mobile App Preview (device emulator) — shared constants.
 *
 * The emulator at /mobile-preview renders the REAL application inside an <iframe name="bm-device-preview">, so the
 * driver and customer apps run with their own routes, layouts, services and LocalStorage data at a true phone width
 * (CSS breakpoints respond to the iframe, not the desktop window). Inside that frame the signed-in session is kept
 * under a separate key, so signing in as a driver in the preview never signs the office user out of the main window.
 * Business data (orders, deliveries, OTPs…) is shared, which is the point: a delivery confirmed in the emulator shows
 * up in the office screens immediately.
 */
export const PREVIEW_FRAME_NAME = 'bm-device-preview'

/** Messages between the emulator page (parent) and the app running inside the device frame. */
export const PREVIEW_MSG = Object.freeze({
  NAVIGATE: 'bm-preview:navigate', // parent → frame { path }
  BACK: 'bm-preview:back', // parent → frame
  LOGIN: 'bm-preview:login', // parent → frame { identifier, password, landing }
  LOGOUT: 'bm-preview:logout', // parent → frame { to }
  LOCATION: 'bm-preview:location', // frame → parent { path, title, user }
  RESULT: 'bm-preview:result', // frame → parent { ok, error }
})

/** True when this window is the app running inside the emulator's device frame. */
export const isDevicePreview = () => {
  try {
    return typeof window !== 'undefined' && window.name === PREVIEW_FRAME_NAME && window.self !== window.top
  } catch {
    // Cross-origin top window: we are framed by something else, not by the emulator.
    return false
  }
}
