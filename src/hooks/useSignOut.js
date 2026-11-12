import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import { scopeOf } from '../services/rbacService'

/** Opens the sign-out confirmation page (/logout). */
export function useSignOut() {
  const navigate = useNavigate()
  return () => navigate('/logout')
}

/** Login page of the app the last user signed out of (read by the route guard while /logout unmounts). */
export const signOutTarget = { path: null }

/** Signs out immediately (used by the confirmation page and the inactivity timeout). */
export function useSignOutNow() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  return (reason = 'manual') => {
    const scope = scopeOf(user)
    const to = scope === 'DRIVER' ? '/driver/login' : scope === 'CUSTOMER' ? '/customer/login' : '/login'
    // Navigate and sign out in the same tick so the guard never sees "signed out on /logout" (which would send
    // driver / customer users to the office login).
    signOutTarget.path = to
    navigate(to, { replace: true, state: reason === 'timeout' ? { reason: 'timeout' } : undefined })
    logout(reason)
    if (reason === 'timeout') toast.warning('You were signed out after a period of inactivity')
    else toast.success('You have been signed out')
  }
}

export default useSignOut
