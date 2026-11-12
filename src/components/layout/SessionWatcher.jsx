import { useEffect } from 'react'
import { isSessionExpired, touchSession } from '../../services/authService'
import { useSignOutNow } from '../../hooks/useSignOut'

const EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart']

/**
 * Session simulation: records activity and signs the user out after the inactivity timeout set in
 * Application Settings › Security. Renders nothing.
 */
export default function SessionWatcher() {
  const signOutNow = useSignOutNow()
  useEffect(() => {
    touchSession(true)
    const onActivity = () => touchSession()
    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    const timer = window.setInterval(() => {
      if (isSessionExpired()) signOutNow('timeout')
    }, 15000)
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
      window.clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
