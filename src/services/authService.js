/**
 * Local demo authentication — SESSION SIMULATION ONLY.
 * Credentials are public demo accounts checked in the browser; passwords are stored as a non-cryptographic demo
 * fingerprint in LocalStorage, and anyone with access to this browser can read or change them.
 * This is not production-secure authentication and must be replaced by a real identity provider.
 *
 * Simulated behaviours: email or username sign-in, remembered username, failed-attempt lockout, inactive account /
 * inactive role checks, inactivity timeout, forced password change after an admin reset, and demo reset codes
 * shown on screen (no email is sent).
 */
import storage from './storageService'
import { STORAGE_KEYS, SIMULATED_LOGIN_DELAY_MS } from '../utils/constants'
import { demoHash, isValidEmail, sleep, uid } from '../utils/helpers'
import { DEMO_CREDENTIALS } from './seed/demoSeed'
import { getSecurityConfig } from '../config/runtimeConfig'
import { getRoleRecord } from '../config/roles'
import { landingPathFor } from './rbacService'
import { logAudit } from './auditService'

const K = STORAGE_KEYS
const getUsers = () => storage.getItem(K.DEMO_USERS, []) || []

const sanitize = (user) => {
  if (!user) return null
  const { passwordHash: _omit, ...safe } = user
  return safe
}

const saveUser = (userId, patch) => {
  let updated = null
  const res = storage.updateItem(
    K.DEMO_USERS,
    (users) =>
      (users || []).map((u) => {
        if (u.id !== userId) return u
        updated = { ...u, ...patch, updatedAt: new Date().toISOString() }
        return updated
      }),
    [],
  )
  return { ...res, user: updated }
}

const log = (user, message, type = 'AUTH') =>
  storage.appendActivity({
    id: uid('act'),
    type,
    actorId: user.id,
    actorName: user.name,
    message,
    entityType: 'user',
    entityId: user.id,
    createdAt: new Date().toISOString(),
  })

/* ---------- Device-local auth state (bellomassi_auth) ---------- */

const AUTH_DEFAULT = { rememberedUsername: '', failed: {}, resets: [], activity: {} }
export const getAuthState = () => ({ ...AUTH_DEFAULT, ...(storage.getItem(K.AUTH, null) || {}) })
const setAuthState = (patch, { silent = false } = {}) => storage.setItem(K.AUTH, { ...getAuthState(), ...patch }, { silent })

export const getRememberedUsername = () => getAuthState().rememberedUsername || ''
export const setRememberedUsername = (value) => setAuthState({ rememberedUsername: String(value || '').trim() })

/* ---------- Session ---------- */

export const getSession = () =>
  storage.getItem(K.SESSION, null, { scope: 'local' }) ||
  storage.getItem(K.SESSION, null, { scope: 'session' })

const lastActiveAt = (session) => getAuthState().activity?.[session?.token] || session?.startedAt

/** True when the session has been idle longer than Application Settings › Security › session timeout. */
export const isSessionExpired = (session = getSession(), now = Date.now()) => {
  if (!session) return false
  const minutes = Number(getSecurityConfig().sessionTimeoutMinutes) || 60
  const last = Date.parse(lastActiveAt(session) || '')
  return Number.isFinite(last) && now - last > minutes * 60 * 1000
}

export const getSessionInfo = () => {
  const s = getSession()
  if (!s) return null
  const minutes = Number(getSecurityConfig().sessionTimeoutMinutes) || 60
  const last = lastActiveAt(s)
  return { ...s, lastActiveAt: last, timeoutMinutes: minutes, expiresAt: new Date(Date.parse(last) + minutes * 60000).toISOString() }
}

let lastTouch = 0
/** Record activity for the inactivity timeout (throttled; written silently so the app does not re-render). */
export const touchSession = (force = false) => {
  const s = getSession()
  if (!s?.token) return
  const now = Date.now()
  if (!force && now - lastTouch < 30 * 1000) return
  lastTouch = now
  const day = 24 * 60 * 60 * 1000
  const kept = Object.entries(getAuthState().activity || {}).filter(([, at]) => now - Date.parse(at) < day)
  setAuthState({ activity: { ...Object.fromEntries(kept), [s.token]: new Date(now).toISOString() } }, { silent: true })
}

export const findUserByEmail = (email) =>
  getUsers().find((u) => u.email.toLowerCase() === String(email || '').trim().toLowerCase()) || null

/** Email or username (case-insensitive). */
export const findUserByIdentifier = (identifier) => {
  const id = String(identifier || '').trim().toLowerCase()
  if (!id) return null
  const digits = id.replace(/\D/g, '')
  return getUsers().find((u) => u.email.toLowerCase() === id || String(u.username || '').toLowerCase() === id
    || (digits.length >= 7 && /^[+\d\s()-]+$/.test(id) && String(u.phone || '').replace(/\D/g, '').endsWith(digits))) || null
}

export const getCurrentUser = () => {
  const session = getSession()
  if (!session) return null
  if (isSessionExpired(session)) return null
  const user = getUsers().find((u) => u.id === session.userId)
  return user && user.status === 'active' ? sanitize(user) : null
}

export const isAuthenticated = () => Boolean(getCurrentUser())
export const getUserRole = () => getCurrentUser()?.role ?? null

/* ---------- Lockout ---------- */

export const getLockState = (userId, now = Date.now()) => {
  const f = getAuthState().failed?.[userId]
  if (!f) return { locked: false, count: 0 }
  const until = Date.parse(f.lockedUntil || '')
  return { locked: Number.isFinite(until) && until > now, lockedUntil: f.lockedUntil || null, count: f.count || 0 }
}

const recordFailure = (user) => {
  const sec = getSecurityConfig()
  const state = getAuthState()
  const prev = state.failed?.[user.id] || { count: 0 }
  const count = (prev.lockedUntil && Date.parse(prev.lockedUntil) <= Date.now() ? 0 : prev.count || 0) + 1
  const max = Number(sec.maxFailedAttempts) || 5
  const locked = count >= max
  const entry = { count, lastAt: new Date().toISOString(), lockedUntil: locked ? new Date(Date.now() + (Number(sec.lockoutMinutes) || 15) * 60000).toISOString() : null }
  setAuthState({ failed: { ...(state.failed || {}), [user.id]: entry } })
  return { count, max, locked, lockedUntil: entry.lockedUntil }
}

export const clearFailures = (userId) => {
  const state = getAuthState()
  if (!state.failed?.[userId]) return
  const { [userId]: _drop, ...rest } = state.failed
  setAuthState({ failed: rest })
}

const minutesUntil = (iso) => Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 60000))
const SYSTEM = { userId: null, userName: 'System', userRole: null }

/**
 * @returns {Promise<{ok: true, user, landing, mustChangePassword} | {ok: false, error: string, field?: 'email'|'password', locked?: boolean}>}
 */
export const login = async (identifier, password, { remember = false, rememberUsername = undefined } = {}) => {
  await sleep(SIMULATED_LOGIN_DELAY_MS)
  const trimmed = String(identifier || '').trim()
  if (!trimmed) return { ok: false, field: 'email', error: 'Enter your email address or username.' }
  if (trimmed.includes('@') && !isValidEmail(trimmed)) return { ok: false, field: 'email', error: 'Enter a valid email address.' }
  if (!password) return { ok: false, field: 'password', error: 'Enter your password.' }

  const user = findUserByIdentifier(trimmed)
  if (!user) {
    logAudit({ action: 'LOGIN_FAILED', entity: 'Session', recordLabel: trimmed, description: `Failed sign-in for unknown account “${trimmed}”.`, actorOverride: SYSTEM })
    return { ok: false, error: 'The email/username or password is incorrect. Use one of the demo accounts below.' }
  }
  const lock = getLockState(user.id)
  if (lock.locked) {
    return { ok: false, locked: true, error: `This account is temporarily locked after too many failed attempts. Try again in ${minutesUntil(lock.lockedUntil)} minute${minutesUntil(lock.lockedUntil) === 1 ? '' : 's'}, or ask an administrator to unlock it.` }
  }
  if (user.passwordHash !== demoHash(password)) {
    const f = recordFailure(user)
    const actor = { userId: user.id, userName: user.name, userRole: user.role }
    if (f.locked) {
      logAudit({ action: 'ACCOUNT_LOCKED', entity: 'User', recordId: user.id, recordLabel: user.email, description: `${user.name}'s account was locked after ${f.count} failed sign-in attempts.`, actorOverride: actor })
      return { ok: false, locked: true, error: `Too many failed attempts. This account is locked for ${minutesUntil(f.lockedUntil)} minutes.` }
    }
    logAudit({ action: 'LOGIN_FAILED', entity: 'User', recordId: user.id, recordLabel: user.email, description: `Failed sign-in for ${user.name} (attempt ${f.count} of ${f.max}).`, actorOverride: actor })
    const left = f.max - f.count
    return { ok: false, error: `The email/username or password is incorrect.${left <= 2 ? ` ${left} attempt${left === 1 ? '' : 's'} left before the account is locked.` : ''}` }
  }
  if (user.status !== 'active') {
    logAudit({ action: 'LOGIN_FAILED', entity: 'User', recordId: user.id, recordLabel: user.email, description: `Sign-in refused: ${user.name}'s account is inactive.`, actorOverride: { userId: user.id, userName: user.name, userRole: user.role } })
    return { ok: false, error: 'This account is inactive. Contact your administrator to reactivate it.' }
  }
  const role = getRoleRecord(user.role)
  if (role && role.status !== 'active') {
    logAudit({ action: 'LOGIN_FAILED', entity: 'User', recordId: user.id, recordLabel: user.email, description: `Sign-in refused: role ${role.name} is inactive.`, actorOverride: { userId: user.id, userName: user.name, userRole: user.role } })
    return { ok: false, error: `Your role “${role.name}” is inactive. Contact your administrator.` }
  }

  const startedAt = new Date().toISOString()
  const session = {
    userId: user.id,
    role: user.role,
    remember: Boolean(remember),
    startedAt,
    token: uid('demo'), // opaque demo marker — not a real token
  }
  clearFailures(user.id)
  setAuthState({
    activity: { [session.token]: startedAt },
    ...(rememberUsername === undefined ? {} : { rememberedUsername: rememberUsername ? trimmed : '' }),
  }, { silent: true })
  // Keep me signed in → localStorage (survives restarts). Otherwise → sessionStorage (cleared when the browser session ends).
  storage.removeItem(K.SESSION, { scope: remember ? 'session' : 'local' })
  const res = storage.setItem(K.SESSION, session, { scope: remember ? 'local' : 'session' })
  if (!res.ok) return { ok: false, error: res.error }

  const { user: updated } = saveUser(user.id, { lastLoginAt: startedAt })
  const safe = sanitize(updated || user)
  log(safe, 'signed in')
  logAudit({ action: 'LOGIN', entity: 'Session', recordId: user.id, recordLabel: user.email, description: `${user.name} signed in${remember ? ' (keep me signed in)' : ''}.` })
  return { ok: true, user: safe, landing: landingPathFor(safe), mustChangePassword: Boolean(user.mustChangePassword) }
}

/** reason: 'manual' | 'timeout' */
export const logout = (reason = 'manual') => {
  const session = getSession()
  const user = session ? getUsers().find((u) => u.id === session.userId) : null
  if (user) {
    log(user, reason === 'timeout' ? 'was signed out after inactivity' : 'signed out')
    logAudit({ action: 'LOGOUT', entity: 'Session', recordId: user.id, recordLabel: user.email, description: reason === 'timeout' ? `${user.name} was signed out after ${getSecurityConfig().sessionTimeoutMinutes} minutes of inactivity.` : `${user.name} signed out.`, actorOverride: { userId: user.id, userName: user.name, userRole: user.role } })
  }
  if (session?.token) {
    const { [session.token]: _drop, ...rest } = getAuthState().activity || {}
    setAuthState({ activity: rest }, { silent: true })
  }
  storage.clearItem(K.SESSION)
}

/* ---------- Profile & password ---------- */

const PHONE_PATTERN = /^[+\d][\d\s-]{7,17}$/

export const updateUserProfile = (userId, changes) => {
  const errors = {}
  const name = String(changes.name ?? '').trim()
  const phone = String(changes.phone ?? '').trim()
  if (name.length < 2) errors.name = 'Name must be at least 2 characters.'
  if (name.length > 60) errors.name = 'Name must be 60 characters or fewer.'
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Enter a valid phone number, e.g. +971 50 123 4567.'
  if (Object.keys(errors).length) return { ok: false, errors }

  const patch = {
    name,
    phone,
    title: String(changes.title ?? '').trim().slice(0, 60),
    avatarColor: changes.avatarColor,
    avatarImage: changes.avatarImage ?? null,
  }
  const res = saveUser(userId, patch)
  if (!res.ok || !res.user) return { ok: false, errors: { form: res.error || 'User not found.' } }
  log(res.user, 'updated their profile', 'PROFILE')
  return { ok: true, user: sanitize(res.user) }
}

/** Demo password policy from Application Settings › Security. */
export const passwordPolicy = () => {
  const s = getSecurityConfig()
  return { minLength: Number(s.passwordMinLength) || 8, mixed: s.requireMixedPassword !== false }
}
export const passwordPolicyText = () => {
  const p = passwordPolicy()
  return `${p.minLength}+ characters${p.mixed ? ' with a letter and a number' : ''}`
}

export const validateNewPassword = (pwd) => {
  const p = passwordPolicy()
  if (!pwd || pwd.length < p.minLength) return `Use at least ${p.minLength} characters.`
  if (pwd.length > 64) return 'Use 64 characters or fewer.'
  if (p.mixed && (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd))) return 'Include at least one letter and one number.'
  return null
}

export const changeDemoPassword = (userId, currentPassword, newPassword) => {
  const user = getUsers().find((u) => u.id === userId)
  if (!user) return { ok: false, errors: { form: 'User not found.' } }
  if (user.passwordHash !== demoHash(currentPassword)) return { ok: false, errors: { current: 'Current password is incorrect.' } }
  const ruleError = validateNewPassword(newPassword)
  if (ruleError) return { ok: false, errors: { next: ruleError } }
  if (currentPassword === newPassword) return { ok: false, errors: { next: 'New password must differ from the current one.' } }
  const res = saveUser(userId, { passwordHash: demoHash(newPassword), mustChangePassword: false, passwordChangedAt: new Date().toISOString() })
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  log(user, 'changed their demo password', 'PROFILE')
  return { ok: true }
}

/** Forgot-password shortcut (prototype): restore the account's published demo password. No email is sent. */
export const restoreDefaultDemoPassword = (identifier) => {
  const user = findUserByIdentifier(identifier)
  if (!user) return { ok: false, error: 'No demo account uses that email address or username.' }
  const cred = DEMO_CREDENTIALS.find((c) => c.id === user.id)
  if (!cred) return { ok: false, error: 'This account was created in the app and has no published demo password. Use a reset code instead.' }
  const res = saveUser(user.id, { passwordHash: demoHash(cred.password), mustChangePassword: false })
  if (!res.ok) return { ok: false, error: res.error }
  clearFailures(user.id)
  log(user, 'restored the default demo password', 'AUTH')
  return { ok: true, password: cred.password }
}

/**
 * Reset Password Demo, step 1: create a 6-digit code valid for Security › reset code minutes.
 * The code is RETURNED to the screen because there is no email server — it is not a secure channel.
 */
export const requestPasswordReset = (identifier) => {
  const user = findUserByIdentifier(identifier)
  if (!user) return { ok: false, error: 'No demo account uses that email address or username.' }
  if (user.status !== 'active') return { ok: false, error: 'This account is inactive. Contact your administrator.' }
  const minutes = Number(getSecurityConfig().resetCodeMinutes) || 15
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const request = { id: uid('rst'), userId: user.id, codeHash: demoHash(code), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + minutes * 60000).toISOString(), usedAt: null }
  setAuthState({ resets: [request, ...(getAuthState().resets || []).filter((r) => r.userId !== user.id)].slice(0, 20) })
  logAudit({ action: 'PASSWORD_CHANGE', entity: 'User', recordId: user.id, recordLabel: user.email, description: `Password reset code requested for ${user.name} (demo — shown on screen, no email sent).`, actorOverride: SYSTEM })
  return { ok: true, code, email: user.email, name: user.name, expiresAt: request.expiresAt, minutes }
}

/** Reset Password Demo, step 2: verify the code and set the new password. */
export const resetPasswordWithCode = (identifier, code, newPassword) => {
  const errors = {}
  const user = findUserByIdentifier(identifier)
  if (!user) return { ok: false, errors: { identifier: 'No demo account uses that email address or username.' } }
  const req = (getAuthState().resets || []).find((r) => r.userId === user.id && !r.usedAt)
  if (!/^\d{6}$/.test(String(code || '').trim())) errors.code = 'Enter the 6-digit code.'
  else if (!req || req.codeHash !== demoHash(String(code).trim())) errors.code = 'This code is not valid. Request a new code.'
  else if (Date.parse(req.expiresAt) < Date.now()) errors.code = 'This code has expired. Request a new code.'
  const ruleError = validateNewPassword(newPassword)
  if (ruleError) errors.next = ruleError
  if (Object.keys(errors).length) return { ok: false, errors }
  const res = saveUser(user.id, { passwordHash: demoHash(newPassword), mustChangePassword: false, passwordChangedAt: new Date().toISOString() })
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  setAuthState({ resets: (getAuthState().resets || []).map((r) => (r.id === req.id ? { ...r, usedAt: new Date().toISOString() } : r)) })
  clearFailures(user.id)
  log(user, 'reset their demo password with a reset code', 'AUTH')
  return { ok: true }
}

export const getDemoAccounts = () =>
  DEMO_CREDENTIALS.map(({ email, username, password, role, name }) => ({ email, username, password, role, name }))

const authService = {
  login, logout, getCurrentUser, isAuthenticated, getUserRole, updateUserProfile, changeDemoPassword,
  restoreDefaultDemoPassword, findUserByEmail, findUserByIdentifier, getDemoAccounts, getSession, getSessionInfo, validateNewPassword,
  requestPasswordReset, resetPasswordWithCode, getRememberedUsername, setRememberedUsername, touchSession, isSessionExpired,
  getLockState, clearFailures, passwordPolicy, passwordPolicyText, getAuthState,
}
export default authService
