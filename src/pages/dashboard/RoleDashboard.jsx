import { ROLES } from '../../config/roles'
import { can } from '../../config/permissions'
import AdminDashboard from '../../components/dashboard/roles/AdminDashboard'
import SalesmanDashboard from '../../components/dashboard/roles/SalesmanDashboard'
import SalesManagerDashboard from '../../components/dashboard/roles/SalesManagerDashboard'
import CustomerServiceDashboard from '../../components/dashboard/roles/CustomerServiceDashboard'
import DispatcherDashboard from '../../components/dashboard/roles/DispatcherDashboard'
import DriverDashboard from '../../components/dashboard/roles/DriverDashboard'
import FinanceDashboard from '../../components/dashboard/roles/FinanceDashboard'
import WarehouseDashboard from '../../components/dashboard/roles/WarehouseDashboard'
import QaDashboard from '../../components/dashboard/roles/QaDashboard'
import GenericDashboard from '../../components/dashboard/roles/GenericDashboard'
import { CustomerPortalDashboard, SupplierPortalDashboard } from '../../components/dashboard/roles/PortalDashboards'

const InventoryDashboardForRole = (props) => <WarehouseDashboard {...props} variant="inventory" />

const BY_ROLE = {
  [ROLES.SUPER_ADMIN]: AdminDashboard,
  [ROLES.ADMIN]: AdminDashboard,
  [ROLES.SALESMAN]: SalesmanDashboard,
  [ROLES.SALES_MANAGER]: SalesManagerDashboard,
  [ROLES.CUSTOMER_SERVICE]: CustomerServiceDashboard,
  [ROLES.DISPATCHER]: DispatcherDashboard,
  [ROLES.DRIVER]: DriverDashboard,
  [ROLES.FINANCE]: FinanceDashboard,
  [ROLES.WAREHOUSE_MANAGER]: WarehouseDashboard,
  [ROLES.INVENTORY_EXECUTIVE]: InventoryDashboardForRole,
  [ROLES.QA_MANAGER]: QaDashboard,
  [ROLES.CUSTOMER]: CustomerPortalDashboard,
  [ROLES.SUPPLIER]: SupplierPortalDashboard,
}

/**
 * Picks the dashboard for the user's PRIMARY role. Custom roles get the permission-driven workspace launcher
 * (never another role's KPIs), and a role without the Dashboard permission sees only the launcher.
 */
export default function RoleDashboard({ user, ...props }) {
  if (!can(user, 'dashboard.view')) return <GenericDashboard user={user} restricted />
  // Module dashboards also need their module permission (e.g. a Warehouse Manager without warehouse.dashboard).
  const needs = { [ROLES.WAREHOUSE_MANAGER]: 'warehouse.dashboard', [ROLES.INVENTORY_EXECUTIVE]: 'warehouse.dashboard', [ROLES.QA_MANAGER]: 'warehouse.qa.view', [ROLES.FINANCE]: 'finance.view' }[user.role]
  if (needs && !can(user, needs)) return <GenericDashboard user={user} />
  const Component = BY_ROLE[user.role] || GenericDashboard
  return <Component user={user} {...props} />
}
