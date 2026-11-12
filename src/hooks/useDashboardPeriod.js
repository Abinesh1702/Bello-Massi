import { useContext } from 'react'
import { DashboardPeriodContext } from '../context/DashboardPeriodContext'

/** The surrounding dashboard's period selection, or null outside a dashboard (no filtering). */
export const useDashboardPeriod = () => useContext(DashboardPeriodContext)
export default useDashboardPeriod
