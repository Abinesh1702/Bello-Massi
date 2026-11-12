import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { signOutTarget } from '../../hooks/useSignOut'
import { scopeOf } from '../../services/rbacService'
import { isDevicePreview, PREVIEW_MSG } from '../../utils/devicePreview'

const SAFE_PATH = /^\/[A-Za-z0-9/_\-?=&.%:]*$/

/**
 * Runs only inside the Mobile App Preview device frame. Reports the current screen to the emulator page and carries
 * out its requests (open a screen, go back, sign in with a demo account, sign out) through the app's own router and
 * auth service — no second copy of the app. Messages are accepted only from the same-origin parent window.
 */
export default function PreviewBridge() {
  const active = isDevicePreview()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, login, logout } = useAuth()
  const ref = useRef({ navigate, login, logout })
  useEffect(() => { ref.current = { navigate, login, logout } }, [navigate, login, logout])

  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => {
      window.parent.postMessage({
        type: PREVIEW_MSG.LOCATION,
        path: location.pathname + location.search,
        title: document.title,
        user: user ? { id: user.id, name: user.name, role: user.role, scope: scopeOf(user), customerId: user.customerId || null } : null,
      }, window.location.origin)
    }, 60)
    return () => window.clearTimeout(t)
  }, [active, location.pathname, location.search, user])

  useEffect(() => {
    if (!active) return undefined
    const onMessage = async (e) => {
      if (e.origin !== window.location.origin || e.source !== window.parent || !e.data || typeof e.data !== 'object') return
      const { navigate: go, login: signIn, logout: signOut } = ref.current
      const reply = (payload) => window.parent.postMessage({ type: PREVIEW_MSG.RESULT, ...payload }, window.location.origin)
      switch (e.data.type) {
        case PREVIEW_MSG.NAVIGATE:
          if (typeof e.data.path === 'string' && SAFE_PATH.test(e.data.path)) go(e.data.path)
          break
        case PREVIEW_MSG.BACK:
          go(-1)
          break
        case PREVIEW_MSG.LOGIN: {
          const res = await signIn(String(e.data.identifier || ''), String(e.data.password || ''), { remember: false })
          if (res.ok) go(res.mustChangePassword ? '/account/change-password?required=1' : res.landing, { replace: true })
          reply({ action: 'login', ok: res.ok, error: res.ok ? null : res.error })
          break
        }
        case PREVIEW_MSG.LOGOUT: {
          const to = typeof e.data.to === 'string' && SAFE_PATH.test(e.data.to) ? e.data.to : '/login'
          // Sign out first (the route guard sends the old app to its own login), then open the requested login page.
          signOutTarget.path = to
          signOut('manual')
          window.setTimeout(() => { ref.current.navigate(to, { replace: true }); reply({ action: 'logout', ok: true }) }, 60)
          break
        }
        default:
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [active])

  return null
}
