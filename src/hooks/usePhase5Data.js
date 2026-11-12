import { useMemo } from 'react'
import { useStoredValue } from './useLocalStorage'
import { STORAGE_KEYS as K } from '../utils/constants'
import { DEFAULT_VMS_SETTINGS } from '../config/vmsConfig'
import { DEFAULT_EMAIL_SETTINGS, DEFAULT_OPENWA_SETTINGS, DEFAULT_COMMUNICATION_SETTINGS } from '../config/communicationConfig'
import { DEFAULT_INVOICE_SETTINGS } from '../config/invoiceConfig'

const E = []
const index = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]))

/** Reactive access to Phase 5 collections plus the master records they reference. */
export const usePhase5Data = () => {
  const v = {
    vmsSettings: useStoredValue(K.VMS_SETTINGS, DEFAULT_VMS_SETTINGS),
    documentTypes: useStoredValue(K.DOCUMENT_TYPES, E),
    documents: useStoredValue(K.DOCUMENTS, E),
    ocrResults: useStoredValue(K.OCR_RESULTS, E),
    invoiceTemplates: useStoredValue(K.INVOICE_TEMPLATES, E),
    invoices: useStoredValue(K.INVOICES, E),
    invoiceSettings: useStoredValue(K.INVOICE_SETTINGS, DEFAULT_INVOICE_SETTINGS),
    emailTemplates: useStoredValue(K.EMAIL_TEMPLATES, E),
    emailDrafts: useStoredValue(K.EMAIL_DRAFTS, E),
    emailHistory: useStoredValue(K.EMAIL_HISTORY, E),
    emailInbox: useStoredValue(K.EMAIL_INBOX, E),
    emailSettings: useStoredValue(K.EMAIL_SETTINGS, DEFAULT_EMAIL_SETTINGS),
    whatsappTemplates: useStoredValue(K.WHATSAPP_TEMPLATES, E),
    whatsappMessages: useStoredValue(K.WHATSAPP_MESSAGES, E),
    openwaSettings: useStoredValue(K.OPENWA_SETTINGS, DEFAULT_OPENWA_SETTINGS),
    communicationSettings: useStoredValue(K.COMMUNICATION_SETTINGS, DEFAULT_COMMUNICATION_SETTINGS),
    notificationTemplates: useStoredValue(K.NOTIFICATION_TEMPLATES, E),
    notificationHistory: useStoredValue(K.NOTIFICATION_HISTORY, E),
    vehicles: useStoredValue(K.VEHICLES, E),
    drivers: useStoredValue(K.DRIVERS, E),
    customers: useStoredValue(K.CUSTOMERS, E),
    orders: useStoredValue(K.ORDERS, E),
    hubs: useStoredValue(K.HUBS, E),
    products: useStoredValue(K.PRODUCTS, E),
    dispatches: useStoredValue(K.DISPATCHES, E),
    notes: useStoredValue(K.DELIVERY_NOTES, E),
    users: useStoredValue(K.DEMO_USERS, E),
    activities: useStoredValue(K.ACTIVITIES, E),
  }
  return useMemo(() => ({
    ...v,
    lk: {
      types: index(v.documentTypes), vehicles: index(v.vehicles), drivers: index(v.drivers), customers: index(v.customers), orders: index(v.orders),
      hubs: index(v.hubs), users: index(v.users), templates: index(v.invoiceTemplates), invoices: index(v.invoices), dispatches: index(v.dispatches), notes: index(v.notes),
      emailTemplates: index(v.emailTemplates), whatsappTemplates: index(v.whatsappTemplates),
    },
  }), [v.vmsSettings, v.documentTypes, v.documents, v.ocrResults, v.invoiceTemplates, v.invoices, v.invoiceSettings, v.emailTemplates, v.emailDrafts, v.emailHistory, v.emailInbox, v.emailSettings, v.whatsappTemplates, v.whatsappMessages, v.openwaSettings, v.communicationSettings, v.notificationTemplates, v.notificationHistory, v.vehicles, v.drivers, v.customers, v.orders, v.hubs, v.products, v.dispatches, v.notes, v.users, v.activities]) // eslint-disable-line react-hooks/exhaustive-deps
}

export default usePhase5Data
