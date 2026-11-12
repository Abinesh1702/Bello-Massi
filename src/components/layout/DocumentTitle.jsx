import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { findNavItemByPath } from '../../config/navigation'
import { getUiConfig } from '../../config/runtimeConfig'

/** Browser tab title: "<page> · <application name>" (application name from Application Settings › General). */
export default function DocumentTitle() {
  const { pathname } = useLocation()
  const appName = getUiConfig().applicationName || 'Bellomassi'
  useEffect(() => {
    const item = findNavItemByPath(pathname)
    document.title = item ? `${item.label} · ${appName}` : appName
  }, [pathname, appName])
  return null
}
