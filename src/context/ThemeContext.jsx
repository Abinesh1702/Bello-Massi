import { createContext, useCallback, useEffect, useMemo } from 'react'
import { useStoredValue } from '../hooks/useLocalStorage'
import storage from '../services/storageService'
import { STORAGE_KEYS } from '../utils/constants'

export const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const stored = useStoredValue(STORAGE_KEYS.THEME, 'light')
  const theme = stored === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = useCallback((next) => storage.setItem(STORAGE_KEYS.THEME, next === 'dark' ? 'dark' : 'light'), [])
  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme])

  const value = useMemo(() => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }), [theme, setTheme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
