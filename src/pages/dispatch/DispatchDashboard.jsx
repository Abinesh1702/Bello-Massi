import { Plus } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import DispatchOverview from '../../components/dispatch/DispatchOverview'
import { usePermission } from '../../hooks/usePermission'

export default function DispatchDashboard() {
  const canManage = usePermission('dispatch.manage')
  return (
    <>
      <PageHeader title="Dispatch & delivery" description="Ready orders, dispatch plans, drivers on the road and delivery outcomes — all calculated from data stored in this browser."
        actions={canManage && <Button icon={Plus} to="/dispatch/create">New dispatch plan</Button>} />
      <DispatchOverview />
    </>
  )
}
