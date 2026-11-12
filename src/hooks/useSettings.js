import { useCallback } from 'react'
import { useStoredValue } from './useLocalStorage'
import storage from '../services/storageService'
import { STORAGE_KEYS } from '../utils/constants'
import { DEFAULT_SETTINGS } from '../services/seed/demoSeed'

export const useSettings = () => {
  const stored = useStoredValue(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  const settings = { ...DEFAULT_SETTINGS, ...stored }
  const updateSettings = useCallback(
    (patch) => storage.updateItem(STORAGE_KEYS.SETTINGS, (prev) => ({ ...DEFAULT_SETTINGS, ...(prev || {}), ...patch }), DEFAULT_SETTINGS),
    [],
  )
  return [settings, updateSettings]
}

export default useSettings
