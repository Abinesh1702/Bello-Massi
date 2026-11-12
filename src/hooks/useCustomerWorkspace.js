import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { useDispatchData } from './useDispatchData'
import { useStoredValue } from './useLocalStorage'
import { STORAGE_KEYS as K } from '../utils/constants'
import { getCart } from '../services/customerAppService'
import { isForUser } from '../services/notificationService'

const EMPTY = []
const EMPTY_OBJ = {}
const EMPTY_TRACK = { sessions: [] }

/**
 * Everything the signed-in customer may see — only records of their own linked customer account.
 * Drivers, vehicles and tracking are exposed only through the customer's own deliveries.
 */
export const useCustomerWorkspace = () => {
  const { user } = useAuth()
  const data = useDispatchData()
  const invoices = useStoredValue(K.INVOICES, EMPTY)
  const carts = useStoredValue(K.CUSTOMER_CARTS, EMPTY_OBJ)
  const tracking = useStoredValue(K.DRIVER_TRACKING, EMPTY_TRACK)
  const pods = useStoredValue(K.DELIVERY_POD, EMPTY)
  const notifications = useStoredValue(K.NOTIFICATIONS, EMPTY)
  const timeline = useStoredValue(K.ORDER_TIMELINE, EMPTY)
  return useMemo(() => {
    const cid = user?.customerId || null
    const customer = cid ? data.lk.customers[cid] || null : null
    const orders = cid ? data.orders.filter((o) => o.customerId === cid && o.orderStatus !== 'DRAFT').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) : []
    const deliveries = cid ? data.deliveries.filter((d) => d.customerId === cid && d.status !== 'CANCELLED') : []
    const deliveryOf = (orderId) => deliveries.filter((d) => d.orderId === orderId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] || null
    const notes = cid ? data.notes.filter((n) => n.customerId === cid).sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1)) : []
    const myInvoices = cid ? invoices.filter((i) => i.customerId === cid).sort((a, b) => (a.invoiceDate < b.invoiceDate ? 1 : -1)) : []
    const myNotifications = notifications.filter((n) => isForUser(n, user)).slice(0, 20)
    return {
      user, customer, orders, deliveries, deliveryOf, notes, invoices: myInvoices, cart: getCart(user?.id, carts), sessions: (tracking.sessions || []).filter((s) => s.customerId === cid),
      pods: pods.filter((p) => p.customerId === cid), notifications: myNotifications, timeline: timeline.filter((t) => orders.some((o) => o.id === t.orderId)),
      lk: data.lk, otps: data.otps, products: data.products, inventory: data.inventory, hubs: data.hubs,
    }
  }, [user, data, invoices, carts, tracking, pods, notifications, timeline])
}

export default useCustomerWorkspace
