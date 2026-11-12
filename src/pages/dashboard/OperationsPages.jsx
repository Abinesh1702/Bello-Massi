import PageHeader from '../../components/common/PageHeader'
import WarehouseDashboard from '../../components/dashboard/roles/WarehouseDashboard'
import QaDashboard from '../../components/dashboard/roles/QaDashboard'
import { useAuth } from '../../hooks/useAuth'

/** /warehouse — the Warehouse dashboard for any role with warehouse.dashboard (Admin, Warehouse, Inventory, QA). */
export function WarehousePage() {
  const { user } = useAuth()
  return (
    <>
      <PageHeader title="Warehouse Dashboard" />
      <WarehouseDashboard user={user} />
    </>
  )
}

/** /quality — QA & cold chain overview for roles with warehouse.qa.view. */
export function QualityPage() {
  return (
    <>
      <PageHeader title="QA & Cold Chain" description="Inspections, quarantine, expiry and temperature alerts." />
      <QaDashboard />
    </>
  )
}
