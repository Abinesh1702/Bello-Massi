import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { formatDate, getDateFormat, toOrgTime } from '../../utils/formatters'
import RoleDashboard from './RoleDashboard'
import { useAuth } from '../../hooks/useAuth'
import { useDashboardData } from '../../hooks/useDashboardData'
import { getRoleMeta, ROLES } from '../../config/roles'
import { scopeOf } from '../../services/rbacService'
import { can } from '../../config/permissions'
import { DashboardPeriodProvider } from '../../context/DashboardPeriodContext'
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar'

/** Which dated collections each role dashboard reads (drives the filter's "dates used" help). */
const FILTER_KINDS = {
  SUPER_ADMIN: ['orders', 'timeline', 'activities', 'dispatches', 'deliveries', 'invoices', 'drafts', 'insights'],
  ADMIN: ['orders', 'timeline', 'activities', 'dispatches', 'deliveries', 'invoices', 'drafts', 'insights'],
  SALESMAN: ['orders'], SALES_MANAGER: ['orders', 'timeline'], CUSTOMER_SERVICE: ['orders'],
  DISPATCHER: ['dispatches', 'deliveries', 'orders'], FINANCE: ['orders', 'invoices'],
  WAREHOUSE_MANAGER: ['receipts', 'transfers', 'orders', 'dispatches', 'drafts'], INVENTORY_EXECUTIVE: ['receipts', 'transfers', 'orders', 'dispatches', 'drafts'],
  QA_MANAGER: ['documents', 'adjustments'], SUPPLIER: ['drafts', 'receipts'],
}

const greeting = () => {
  const h = toOrgTime(new Date().toISOString()).hour()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  // Drivers work from the mobile driver app
  if (scopeOf(user) === ROLES.DRIVER) return <Navigate to="/driver/dashboard" replace />
  if (scopeOf(user) === ROLES.CUSTOMER) return <Navigate to="/customer/dashboard" replace />
  return (
    <DashboardPeriodProvider id={`office:${user.id}:${user.role}`} defaultKey="all">
      <OfficeDashboard user={user} />
    </DashboardPeriodProvider>
  )
}

function OfficeDashboard({ user }) {
  const { data, users, orders, activities, timeline, range, previous } = useDashboardData()
  const kinds = can(user, 'dashboard.view') ? FILTER_KINDS[user.role] : null
  const meta = getRoleMeta(user.role)
  const [today] = useState(() => formatDate(new Date().toISOString(), `ddd, ${getDateFormat()}`))
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        description={`${meta.label} · ${meta.workspace} — ${meta.description}`}
        actions={
          <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 h-9 text-sm text-muted">
            <CalendarDays size={15} aria-hidden /> {today}
          </span>
        }
      />
      {kinds && <DashboardFilterBar kinds={kinds} className="mb-6" />}
      <RoleDashboard user={user} data={data} users={users} orders={orders} activities={activities} timeline={timeline} range={range} previous={previous} />
    </>
  )
}
