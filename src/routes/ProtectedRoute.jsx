import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { canAccessItem } from '../config/navigation'
import { landingPathFor } from '../services/rbacService'
import { signOutTarget } from '../hooks/useSignOut'

const PASSWORD_PAGE = '/account/change-password'

/**
 * Guards routes for signed-in users and, optionally, a navigation item's permission.
 * Users flagged "must change password" (after an administrator reset) are sent to the change-password page first.
 * UI-level prototype authorisation only — services re-check permissions before every action.
 */
export default function ProtectedRoute({ item, children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    const app = location.pathname === '/logout' && signOutTarget.path ? signOutTarget.path : location.pathname.startsWith('/driver/') ? '/driver/login' : location.pathname.startsWith('/customer/') ? '/customer/login' : '/login'
    return <Navigate to={app} replace state={{ from: location.pathname + location.search }} />
  }
  if (user.mustChangePassword && ![PASSWORD_PAGE, '/logout'].includes(location.pathname)) {
    return <Navigate to={`${PASSWORD_PAGE}?required=1`} replace />
  }
  if (item && !canAccessItem(item, user)) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />
  }
  return children ?? <Outlet />
}

export function PublicOnlyRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to={landingPathFor(user)} replace />
  return children ?? <Outlet />
}
