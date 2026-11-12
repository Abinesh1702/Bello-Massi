/** WhatsApp message templates (Phase 5) — same store and variable engine as email templates, body only. */
import { createTemplateStore, renderTemplate, buildVariables } from './emailTemplateService'
import { STORAGE_KEYS as K } from '../utils/constants'

const store = createTemplateStore(K.WHATSAPP_TEMPLATES, { channel: 'WHATSAPP', hasSubject: false })
export const getWhatsappTemplates = store.list
export const getWhatsappTemplateById = store.byId
export const validateWhatsappTemplate = store.validate
export const saveWhatsappTemplate = store.save
export const deleteWhatsappTemplate = store.remove
export { renderTemplate, buildVariables }
export default { getWhatsappTemplates, getWhatsappTemplateById, saveWhatsappTemplate, deleteWhatsappTemplate, validateWhatsappTemplate, renderTemplate, buildVariables }
