import { useAuth } from './useAuth'
import { can } from '../config/permissions'

/** const canManage = usePermission('customers.manage') */
export const usePermission = (permission) => {
  const { user } = useAuth()
  return can(user, permission)
}

export default usePermission
