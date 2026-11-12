/**
 * In-app notifications stored in LocalStorage.
 * Targeting: userIds (specific users) take precedence; otherwise roles (null = everyone). A user is reached through
 * any of their roles (primary + additional); users whose data scope is "all records" (Admin, Super Admin) also
 * receive notifications addressed to ADMIN.
 * Categories group notifications in the Notification Center; per-user preferences can mute categories.
 */
import storage from './storageService'
import { STORAGE_KEYS } from '../utils/constants'
import { uid } from '../utils/helpers'
import { audienceCodes } from './rbacService'
import { getNotificationConfig } from '../config/runtimeConfig'

const KEY = STORAGE_KEYS.NOTIFICATIONS
const PREFS = STORAGE_KEYS.NOTIFICATION_PREFS
const MAX_NOTIFICATIONS = 400

export const NOTIFICATION_CATEGORIES = [
  { id: 'approvals', label: 'Approvals' },
  { id: 'orders', label: 'Orders' },
  { id: 'inventory', label: 'Inventory & stock' },
  { id: 'procurement', label: 'Procurement' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'vms', label: 'Vehicles & compliance' },
  { id: 'quality', label: 'Quality & expiry' },
  { id: 'documents', label: 'Documents' },
  { id: 'finance', label: 'Finance & invoices' },
  { id: 'communication', label: 'Communication' },
  { id: 'ai', label: 'AI insights' },
  { id: 'security', label: 'Security & account' },
  { id: 'system', label: 'System' },
]
export const getCategoryLabel = (id) => NOTIFICATION_CATEGORIES.find((c) => c.id === id)?.label ?? 'System'

/** Category from the stored value, or derived from the link for notifications created before categories existed. */
export const categoryOf = (n) => {
  if (n.category) return n.category
  const l = String(n.link || '')
  if (/\/orders\/approval/.test(l)) return 'approvals'
  if (/\/orders/.test(l)) return 'orders'
  if (/\/customers\/credit|\/invoices/.test(l)) return 'finance'
  if (/\/inventory/.test(l)) return 'inventory'
  if (/\/ai\/replenishment/.test(l)) return 'procurement'
  if (/\/dispatch\/deliver|\/driver/.test(l)) return 'delivery'
  if (/\/dispatch/.test(l)) return 'dispatch'
  if (/\/vms/.test(l)) return 'vms'
  if (/\/documents/.test(l)) return 'documents'
  if (/\/communication/.test(l)) return 'communication'
  if (/\/ai/.test(l)) return 'ai'
  return 'system'
}

export const getAllNotifications = () => storage.getItem(KEY, []) || []

export const isForUser = (n, user) => {
  if (!user) return false
  const codes = audienceCodes(user)
  const byRole = Array.isArray(n.roles) && n.roles.some((r) => codes.has(r))
  if (Array.isArray(n.userIds) && n.userIds.length) return n.userIds.includes(user.id) || byRole
  return !n.roles || byRole
}

/* ---------- Preferences ---------- */

export const DEFAULT_PREFERENCES = { mutedCategories: [], showToasts: true, digest: 'instant' }

export const getPreferences = (userId, all = storage.getItem(PREFS, {}) || {}) => ({ ...DEFAULT_PREFERENCES, ...(all[userId] || {}) })

export const savePreferences = (userId, patch) =>
  storage.updateItem(PREFS, (all) => ({ ...(all || {}), [userId]: { ...DEFAULT_PREFERENCES, ...((all || {})[userId] || {}), ...patch, updatedAt: new Date().toISOString() } }), {})

/**
 * Notifications for a user, newest first, with `read` and `category`.
 * includeMuted: the history view shows muted categories too; the bell and badge hide them.
 */
export const getNotificationsForUser = (user, all = getAllNotifications(), { includeMuted = false, prefs } = {}) => {
  if (!user) return []
  const muted = new Set(getNotificationConfig().allowUserMuting === false ? [] : (prefs || getPreferences(user.id)).mutedCategories || [])
  return all
    .filter((n) => isForUser(n, user))
    .map((n) => ({ ...n, category: categoryOf(n), read: n.readBy.includes(user.id) }))
    .map((n) => ({ ...n, dismissed: (n.dismissedBy || []).includes(user.id) }))
    .filter((n) => includeMuted || (!muted.has(n.category) && !n.dismissed))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export const markAsRead = (notificationId, userId) =>
  storage.updateItem(KEY, (list) =>
    (list || []).map((n) => (n.id === notificationId && !n.readBy.includes(userId) ? { ...n, readBy: [...n.readBy, userId] } : n)), [])

export const markAsUnread = (notificationId, userId) =>
  storage.updateItem(KEY, (list) =>
    (list || []).map((n) => (n.id === notificationId ? { ...n, readBy: n.readBy.filter((id) => id !== userId) } : n)), [])

/** Mark all (optionally only those in `ids`) as read for this user. */
export const markAllAsRead = (user, ids = null) => {
  const only = ids ? new Set(ids) : null
  return storage.updateItem(KEY, (list) =>
    (list || []).map((n) =>
      isForUser(n, user) && (!only || only.has(n.id)) && !n.readBy.includes(user.id) ? { ...n, readBy: [...n.readBy, user.id] } : n), [])
}

/** Hide a notification for this user (kept for other recipients). */
export const dismissNotification = (notificationId, userId) =>
  storage.updateItem(KEY, (list) =>
    (list || []).map((n) => (n.id === notificationId ? { ...n, readBy: n.readBy.includes(userId) ? n.readBy : [...n.readBy, userId], dismissedBy: [...new Set([...(n.dismissedBy || []), userId])] } : n)), [])

/** Used by every phase to raise workflow notifications. */
export const pushNotification = ({ title, message, type = 'info', roles = null, userIds = null, link = null, relatedOrderId = null, category = null }) => {
  const cat = category || categoryOf({ link })
  const cfg = getNotificationConfig()
  // Application Settings › Notifications can switch a category off for the whole organisation.
  if ((cfg.disabledCategories || []).includes(cat)) return { ok: true, skipped: true }
  return storage.updateItem(KEY, (list) => [
    { id: uid('n'), title, message, type, roles, userIds, link, relatedOrderId, category: cat, createdAt: new Date().toISOString(), readBy: [] },
    ...(list || []),
  ].slice(0, Number(cfg.maxStored) || MAX_NOTIFICATIONS), [])
}

const notificationService = {
  getAllNotifications, getNotificationsForUser, markAsRead, markAsUnread, markAllAsRead, pushNotification, dismissNotification,
  getPreferences, savePreferences, categoryOf, NOTIFICATION_CATEGORIES,
}
export default notificationService
