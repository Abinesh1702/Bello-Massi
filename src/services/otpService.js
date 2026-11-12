/**
 * SIMULATED delivery OTP (Phase 4). Codes are generated in the browser and shown on screen in demo
 * mode. No SMS, WhatsApp or any other provider is contacted, and nothing claims a message was sent.
 *
 * Rules: 6 digits · expiry from settings (default 10 minutes) · 5 attempts · regenerating invalidates
 * the previous code · delivered / failed stops cannot generate another code.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { makeDispatchEvent } from './dispatchTimelineService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { DELIVERY_STATUS as DL, OTP_CONFIG, OTP_STATUS } from '../config/dispatchConfig'

const read = (key, fallback = []) => storage.getItem(key, fallback) || fallback
const deny = (msg) => ({ ok: false, error: msg, errors: { form: msg } })

export const getOtps = () => read(K.DELIVERY_OTPS)
export const getOtpsForDelivery = (deliveryId, all = getOtps()) => all.filter((o) => o.deliveryId === deliveryId).sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1))
export const getLatestOtp = (deliveryId, all = getOtps()) => getOtpsForDelivery(deliveryId, all)[0] || null

export const getOtpExpiryMinutes = () => {
  const s = storage.getItem(K.SETTINGS, {}) || {}
  const m = Number(s.otpExpiryMinutes)
  if (!Number.isFinite(m)) return OTP_CONFIG.defaultExpiryMinutes
  return Math.min(OTP_CONFIG.maxExpiryMinutes, Math.max(OTP_CONFIG.minExpiryMinutes, Math.round(m)))
}

/** Effective status of a stored OTP at `now` (an ACTIVE code past its expiry reads as EXPIRED). */
export const effectiveOtpStatus = (otp, now = dayjs()) => {
  if (!otp) return 'NONE'
  if (otp.status === OTP_STATUS.ACTIVE && dayjs(now).isAfter(dayjs(otp.expiresAt))) return OTP_STATUS.EXPIRED
  return otp.status
}

const randomCode = () => {
  const n = (() => {
    try {
      const buf = new Uint32Array(1)
      window.crypto.getRandomValues(buf)
      return buf[0]
    } catch {
      return Math.floor(Math.random() * 2 ** 32)
    }
  })()
  return String(100000 + (n % 900000))
}

/** Generate (or regenerate) the delivery's OTP. Allowed for the assigned driver and for Admin / Dispatcher. */
export const generateOtp = (deliveryId) => {
  const user = getCurrentUser()
  const deliveries = read(K.DELIVERIES)
  const delivery = deliveries.find((d) => d.id === deliveryId)
  if (!delivery) return deny('This delivery no longer exists.')
  const driver = read(K.DRIVERS).find((d) => d.userId === user?.id)
  const isDriver = driver && driver.id === delivery.driverId
  if (!isDriver && !can(user, 'dispatch.manage')) return deny('Only the assigned driver can request the customer OTP.')
  if ([DL.DELIVERED, DL.PARTIALLY_DELIVERED].includes(delivery.status)) return deny(`${delivery.orderNumber} is already delivered — another OTP cannot be generated.`)
  if (delivery.status !== DL.OUT_FOR_DELIVERY) return deny(delivery.status === DL.DISPATCHED ? 'Start the delivery before requesting the customer OTP.' : `${delivery.orderNumber} is ${delivery.status.toLowerCase().replace(/_/g, ' ')} — no OTP can be generated.`)

  const now = dayjs()
  const all = getOtps()
  const previous = getOtpsForDelivery(deliveryId, all)
  const used = new Set(previous.map((o) => o.otp))
  let code = randomCode()
  for (let i = 0; i < 10 && used.has(code); i += 1) code = randomCode()
  if (used.has(code)) return deny('Could not create a fresh OTP. Try again.')
  const minutes = getOtpExpiryMinutes()
  const otp = {
    id: uid('otp'), deliveryId, orderId: delivery.orderId, otp: code, generatedAt: now.toISOString(), expiresAt: now.add(minutes, 'minute').toISOString(),
    expiryMinutes: minutes, attempts: 0, maxAttempts: OTP_CONFIG.maxAttempts, verifiedAt: null, status: OTP_STATUS.ACTIVE, generatedBy: user?.id || null, simulated: true,
  }
  // Regeneration invalidates every earlier unused code for this delivery
  const next = [otp, ...all.map((o) => (o.deliveryId === deliveryId && o.status === OTP_STATUS.ACTIVE ? { ...o, status: OTP_STATUS.INVALIDATED } : o))]
  const dispatch = read(K.DISPATCHES).find((d) => d.id === delivery.dispatchId) || { id: delivery.dispatchId, dispatchNumber: delivery.dispatchNumber }
  const res = storage.transaction([
    [K.DELIVERY_OTPS, next],
    [K.DELIVERIES, deliveries.map((d) => (d.id === deliveryId ? { ...d, otpStatus: OTP_STATUS.ACTIVE, updatedAt: otp.generatedAt } : d))],
    [K.DISPATCH_TIMELINE, [...read(K.DISPATCH_TIMELINE), makeDispatchEvent(dispatch, 'OTP_GENERATED', { orderId: delivery.orderId, deliveryId, description: `${previous.length ? 'Regenerated' : 'Generated'} · valid ${minutes} min · simulated (no SMS sent)` })]],
  ])
  if (!res.ok) return deny(res.error)
  return { ok: true, otp, regenerated: previous.length > 0 }
}

/**
 * Check a code against the delivery's latest OTP (pure). Returns
 * { result: 'ok' | 'wrong' | 'expired' | 'locked' | 'none' | 'format', otp, next (updated record), message }.
 */
export const evaluateOtp = (latest, code, now = dayjs()) => {
  const clean = String(code || '').trim()
  if (!/^\d{6}$/.test(clean)) return { result: 'format', message: 'Enter the 6-digit OTP.' }
  if (!latest || latest.status === OTP_STATUS.INVALIDATED) return { result: 'none', message: 'Generate an OTP for the customer first.' }
  if (latest.status === OTP_STATUS.VERIFIED) return { result: 'none', message: 'This OTP was already used. Generate a new one.' }
  if (latest.status === OTP_STATUS.LOCKED || latest.attempts >= latest.maxAttempts) {
    return { result: 'locked', next: { ...latest, status: OTP_STATUS.LOCKED }, message: 'Too many incorrect attempts. Generate a new OTP.' }
  }
  if (effectiveOtpStatus(latest, now) === OTP_STATUS.EXPIRED) return { result: 'expired', next: { ...latest, status: OTP_STATUS.EXPIRED }, message: 'This OTP has expired. Generate a new one.' }
  const attempts = latest.attempts + 1
  if (clean !== latest.otp) {
    const left = latest.maxAttempts - attempts
    return {
      result: left <= 0 ? 'locked' : 'wrong',
      next: { ...latest, attempts, status: left <= 0 ? OTP_STATUS.LOCKED : OTP_STATUS.ACTIVE },
      message: left <= 0 ? 'Incorrect OTP. Maximum attempts reached — generate a new OTP.' : `Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} left.`,
      attemptsLeft: Math.max(0, left),
    }
  }
  return { result: 'ok', next: { ...latest, attempts, status: OTP_STATUS.VERIFIED, verifiedAt: dayjs(now).toISOString() } }
}

/** Persist a failed check (attempt count / expiry / lock) — outside any delivery change. */
export const recordOtpOutcome = (next) => {
  if (!next) return { ok: true }
  return storage.updateItem(K.DELIVERY_OTPS, (list) => (list || []).map((o) => (o.id === next.id ? next : o)), [])
}

const otpService = { getOtps, getOtpsForDelivery, getLatestOtp, generateOtp, evaluateOtp, effectiveOtpStatus, getOtpExpiryMinutes }
export default otpService
