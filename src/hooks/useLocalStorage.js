import { useCallback, useSyncExternalStore } from 'react'
import storage from '../services/storageService'

/**
 * Subscribe a component to a stored value. All reads/writes go through storageService,
 * so components never touch LocalStorage directly.
 */
export const useStoredValue = (key, fallback = null, scope = 'local') => {
  const value = useSyncExternalStore(
    storage.subscribe,
    () => storage.getItem(key, null, { scope }),
    () => null,
  )
  return value ?? fallback
}

/** [value, setValue] pair backed by storageService. setValue accepts a value or updater. */
export const useLocalStorage = (key, fallback = null, scope = 'local') => {
  const value = useStoredValue(key, fallback, scope)
  const setValue = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(storage.getItem(key, fallback, { scope })) : next
      return storage.setItem(key, resolved, { scope })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, scope],
  )
  return [value, setValue]
}

export default useLocalStorage
