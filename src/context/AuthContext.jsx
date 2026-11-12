import { createContext, useCallback, useMemo } from 'react'
import { useStoredValue } from '../hooks/useLocalStorage'
import authService from '../services/authService'
import { effectivePermissions, scopeOf } from '../services/rbacService'
import { userRoleCodes } from '../config/roles'
import { STORAGE_KEYS } from '../utils/constants'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Subscribing to users, roles and both session scopes keeps the context in sync after profile edits,
  // role / permission changes, demo resets, imports and changes made in other tabs.
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const roles = useStoredValue(STORAGE_KEYS.ROLES, [])
  const localSession = useStoredValue(STORAGE_KEYS.SESSION, null, 'local')
  const tabSession = useStoredValue(STORAGE_KEYS.SESSION, null, 'session')

  const user = useMemo(
    () => authService.getCurrentUser(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users, roles, localSession, tabSession],
  )
  const session = localSession || tabSession

  const login = useCallback((identifier, password, options) => authService.login(identifier, password, options), [])
  const logout = useCallback((reason) => authService.logout(reason), [])
  const updateProfile = useCallback((changes) => (user ? authService.updateUserProfile(user.id, changes) : { ok: false }), [user])
  const changePassword = useCallback((current, next) => (user ? authService.changeDemoPassword(user.id, current, next) : { ok: false }), [user])

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      roles: userRoleCodes(user),
      scope: scopeOf(user),
      permissions: user ? effectivePermissions(user) : new Set(),
      isAuthenticated: Boolean(user),
      // A session that points to a user who no longer exists (e.g. after import) is treated as signed out.
      staleSession: Boolean(session) && !user,
      remember: Boolean(session?.remember),
      login,
      logout,
      updateProfile,
      changePassword,
    }),
    // roles: permission edits must refresh `permissions` even when the user object is unchanged
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, roles, session, login, logout, updateProfile, changePassword],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
