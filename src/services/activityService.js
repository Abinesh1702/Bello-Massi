/** Records user actions in the shared activity log (shown on dashboards and detail timelines). */
import storage from './storageService'
import { getCurrentUser } from './authService'
import { uid } from '../utils/helpers'

export const logActivity = ({ type, message, entityType, entityId }) => {
  const user = getCurrentUser()
  return storage.appendActivity({
    id: uid('act'),
    type,
    actorId: user?.id ?? null,
    actorName: user?.name ?? 'System',
    message,
    entityType,
    entityId,
    createdAt: new Date().toISOString(),
  })
}


export const currentUserId = () => getCurrentUser()?.id ?? null
