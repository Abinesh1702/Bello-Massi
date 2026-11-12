import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute, { PublicOnlyRoute } from './ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Login from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import { CustomerLogin, DriverLogin } from '../pages/auth/AppLogin'
import NotFound from '../pages/errors/NotFound'
import Unauthorized from '../pages/errors/Unauthorized'
import { NAV_ITEMS } from '../config/navigation'
import { useAuth } from '../hooks/useAuth'
import { landingPathFor } from '../services/rbacService'

const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'))
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))

/** Page registry: navigation items reference these keys (config/navigation.js). */
const PAGES = {
  dashboard: Dashboard,
  settings: SettingsPage,
  customerList: lazy(() => import('../pages/customers/CustomerList')),
  customerForm: lazy(() => import('../pages/customers/CustomerForm')),
  customerDetail: lazy(() => import('../pages/customers/CustomerDetail')),
  customerCredit: lazy(() => import('../pages/customers/CustomerCredit')),
  productList: lazy(() => import('../pages/products/ProductList')),
  productForm: lazy(() => import('../pages/products/ProductForm')),
  productDetail: lazy(() => import('../pages/products/ProductDetail')),
  hubList: lazy(() => import('../pages/hubs/HubList')),
  hubForm: lazy(() => import('../pages/hubs/HubForm')),
  hubDetail: lazy(() => import('../pages/hubs/HubDetail')),
  inventoryDashboard: lazy(() => import('../pages/inventory/InventoryDashboard')),
  stockOverview: lazy(() => import('../pages/inventory/StockOverview')),
  stockDetail: lazy(() => import('../pages/inventory/StockDetail')),
  lowStock: lazy(() => import('../pages/inventory/LowStock')),
  receiptList: lazy(() => import('../pages/inventory/ReceiptList')),
  receiptCreate: lazy(() => import('../pages/inventory/ReceiptCreate')),
  transferList: lazy(() => import('../pages/inventory/TransferList')),
  transferCreate: lazy(() => import('../pages/inventory/TransferCreate')),
  adjustmentList: lazy(() => import('../pages/inventory/AdjustmentList')),
  adjustmentCreate: lazy(() => import('../pages/inventory/AdjustmentCreate')),
  movementList: lazy(() => import('../pages/inventory/MovementList')),
  orderForm: lazy(() => import('../pages/orders/OrderForm')),
  orderList: lazy(() => import('../pages/orders/OrderList')),
  myOrders: lazy(() => import('../pages/orders/OrderList').then((m) => ({ default: m.MyOrders }))),
  returnedOrders: lazy(() => import('../pages/orders/OrderList').then((m) => ({ default: m.ReturnedOrders }))),
  rejectedOrders: lazy(() => import('../pages/orders/OrderList').then((m) => ({ default: m.RejectedOrders }))),
  orderDetail: lazy(() => import('../pages/orders/OrderDetail')),
  approvalQueue: lazy(() => import('../pages/orders/ApprovalQueue')),
  approvalDetail: lazy(() => import('../pages/orders/ApprovalDetail')),
  consolidationQueue: lazy(() => import('../pages/orders/ConsolidationQueue')),
  consolidationDetail: lazy(() => import('../pages/orders/ConsolidationDetail')),
  // Phase 4 — dispatch & delivery
  dispatchDashboard: lazy(() => import('../pages/dispatch/DispatchDashboard')),
  readyOrders: lazy(() => import('../pages/dispatch/ReadyOrders')),
  dispatchPlanning: lazy(() => import('../pages/dispatch/DispatchPlanning')),
  dispatchForm: lazy(() => import('../pages/dispatch/DispatchForm')),
  dispatchDetail: lazy(() => import('../pages/dispatch/DispatchDetail')),
  dispatchAssignments: lazy(() => import('../pages/dispatch/Assignments')),
  deliveryTracking: lazy(() => import('../pages/dispatch/DeliveryTracking')),
  deliveryHistory: lazy(() => import('../pages/dispatch/DeliveryHistory')),
  deliveryDetail: lazy(() => import('../pages/dispatch/DeliveryDetail')),
  deliveryNote: lazy(() => import('../pages/dispatch/DeliveryNotePage')),
  zoneList: lazy(() => import('../pages/dispatch/ZoneList')),
  zoneForm: lazy(() => import('../pages/dispatch/ZoneForm')),
  driverList: lazy(() => import('../pages/dispatch/DriverList')),
  driverForm: lazy(() => import('../pages/dispatch/DriverForm')),
  driverDetail: lazy(() => import('../pages/dispatch/DriverDetail')),
  vehicleForm: lazy(() => import('../pages/dispatch/VehicleForm')),
  driverHome: lazy(() => import('../pages/driver/DriverHome')),
  driverDeliveries: lazy(() => import('../pages/driver/DriverDeliveries')),
  driverDelivery: lazy(() => import('../pages/driver/DriverDeliveryDetail')),
  driverConfirm: lazy(() => import('../pages/driver/DriverConfirmDelivery')),
  driverNotes: lazy(() => import('../pages/driver/DriverNotes')),
  driverNote: lazy(() => import('../pages/dispatch/DeliveryNotePage').then((m) => ({ default: m.DriverDeliveryNotePage }))),
  driverProfile: lazy(() => import('../pages/driver/DriverProfile')),
  // Phase 5 — VMS, documents & OCR, invoices, communication
  vmsDashboard: lazy(() => import('../pages/vms/VmsDashboard')),
  vmsVehicles: lazy(() => import('../pages/vms/VmsFleet').then((m) => ({ default: m.VmsVehicles }))),
  vmsDrivers: lazy(() => import('../pages/vms/VmsFleet').then((m) => ({ default: m.VmsDrivers }))),
  vmsVehicleDetail: lazy(() => import('../pages/vms/VmsRecords').then((m) => ({ default: m.VmsVehicleDetail }))),
  vmsDriverDocuments: lazy(() => import('../pages/vms/VmsRecords').then((m) => ({ default: m.VmsDriverDocuments }))),
  vmsExpiry: lazy(() => import('../pages/vms/VmsCompliance').then((m) => ({ default: m.DocumentExpiry }))),
  vmsSettings: lazy(() => import('../pages/vms/VmsCompliance').then((m) => ({ default: m.VmsSettings }))),
  documentRepository: lazy(() => import('../pages/documents/DocumentRepository')),
  ocrQueue: lazy(() => import('../pages/documents/DocumentRepository').then((m) => ({ default: m.OcrQueue }))),
  verifiedDocuments: lazy(() => import('../pages/documents/DocumentRepository').then((m) => ({ default: m.VerifiedDocuments }))),
  rejectedDocuments: lazy(() => import('../pages/documents/DocumentRepository').then((m) => ({ default: m.RejectedDocuments }))),
  documentUpload: lazy(() => import('../pages/documents/DocumentUpload')),
  documentDetail: lazy(() => import('../pages/documents/DocumentDetail')),
  documentReview: lazy(() => import('../pages/documents/DocumentReview')),
  documentTypes: lazy(() => import('../pages/documents/DocumentTypes')),
  documentTypeForm: lazy(() => import('../pages/documents/DocumentTypes').then((m) => ({ default: m.DocumentTypeForm }))),
  invoiceDashboard: lazy(() => import('../pages/invoices/InvoicePages').then((m) => ({ default: m.InvoiceDashboard }))),
  invoiceList: lazy(() => import('../pages/invoices/InvoicePages').then((m) => ({ default: m.InvoiceList }))),
  invoiceCreate: lazy(() => import('../pages/invoices/InvoicePages').then((m) => ({ default: m.InvoiceCreate }))),
  invoiceDetail: lazy(() => import('../pages/invoices/InvoicePages').then((m) => ({ default: m.InvoiceDetail }))),
  invoicePrint: lazy(() => import('../pages/invoices/InvoicePages').then((m) => ({ default: m.InvoicePrint }))),
  invoiceTemplates: lazy(() => import('../pages/invoices/InvoiceTemplates').then((m) => ({ default: m.InvoiceTemplates }))),
  invoiceTemplateForm: lazy(() => import('../pages/invoices/InvoiceTemplates').then((m) => ({ default: m.InvoiceTemplateForm }))),
  invoiceTemplatePreview: lazy(() => import('../pages/invoices/InvoiceTemplates').then((m) => ({ default: m.InvoiceTemplatePreview }))),
  communicationCenter: lazy(() => import('../pages/communication/CommunicationCenter')),
  automationSettings: lazy(() => import('../pages/communication/CommunicationCenter').then((m) => ({ default: m.AutomationSettings }))),
  emailHome: lazy(() => import('../pages/communication/EmailPages').then((m) => ({ default: m.EmailHome }))),
  emailCompose: lazy(() => import('../pages/communication/EmailPages').then((m) => ({ default: m.EmailCompose }))),
  emailInbox: lazy(() => import('../pages/communication/EmailPages').then((m) => ({ default: m.EmailInbox }))),
  emailSent: lazy(() => import('../pages/communication/EmailPages').then((m) => ({ default: m.EmailSent }))),
  emailDrafts: lazy(() => import('../pages/communication/EmailPages').then((m) => ({ default: m.EmailDrafts }))),
  emailHistory: lazy(() => import('../pages/communication/EmailPages').then((m) => ({ default: m.EmailHistory }))),
  emailSettings: lazy(() => import('../pages/communication/EmailPages').then((m) => ({ default: m.EmailSettings }))),
  emailTemplateList: lazy(() => import('../pages/communication/TemplatePages').then((m) => ({ default: m.EmailTemplateList }))),
  emailTemplateForm: lazy(() => import('../pages/communication/TemplatePages').then((m) => ({ default: m.EmailTemplateForm }))),
  whatsappHome: lazy(() => import('../pages/communication/WhatsappPages').then((m) => ({ default: m.WhatsappHome }))),
  whatsappCompose: lazy(() => import('../pages/communication/WhatsappPages').then((m) => ({ default: m.WhatsappCompose }))),
  whatsappHistory: lazy(() => import('../pages/communication/WhatsappPages').then((m) => ({ default: m.WhatsappHistory }))),
  whatsappSettings: lazy(() => import('../pages/communication/WhatsappPages').then((m) => ({ default: m.WhatsappSettings }))),
  whatsappTemplateList: lazy(() => import('../pages/communication/TemplatePages').then((m) => ({ default: m.WhatsappTemplateList }))),
  whatsappTemplateForm: lazy(() => import('../pages/communication/TemplatePages').then((m) => ({ default: m.WhatsappTemplateForm }))),
  driverDocuments: lazy(() => import('../pages/driver/DriverDocuments')),
  driverDocument: lazy(() => import('../pages/driver/DriverDocumentView')),
  aiOverview: lazy(() => import('../pages/ai/AiOverview')),
  aiAssistant: lazy(() => import('../pages/ai/AiAssistant')),
  aiActivity: lazy(() => import('../pages/ai/AiActivity')),
  jarvis: lazy(() => import('../pages/ai/Jarvis')),
  forecastDashboard: lazy(() => import('../pages/ai/ForecastPages')),
  forecastCreate: lazy(() => import('../pages/ai/ForecastPages').then((m) => ({ default: m.ForecastCreate }))),
  forecastDetail: lazy(() => import('../pages/ai/ForecastPages').then((m) => ({ default: m.ForecastDetail }))),
  forecastPrint: lazy(() => import('../pages/ai/ForecastPages').then((m) => ({ default: m.ForecastPrint }))),
  forecastHistory: lazy(() => import('../pages/ai/ForecastPages').then((m) => ({ default: m.ForecastHistory }))),
  forecastCompare: lazy(() => import('../pages/ai/ForecastPages').then((m) => ({ default: m.ForecastCompare }))),
  predictiveDashboard: lazy(() => import('../pages/ai/PredictivePages')),
  reorderRecommendations: lazy(() => import('../pages/ai/PredictivePages').then((m) => ({ default: m.ReorderRecommendations }))),
  inventoryRisks: lazy(() => import('../pages/ai/PredictivePages').then((m) => ({ default: m.InventoryRisks }))),
  demandForecasting: lazy(() => import('../pages/ai/PredictivePages').then((m) => ({ default: m.DemandForecasting }))),
  planningParameters: lazy(() => import('../pages/ai/PredictivePages').then((m) => ({ default: m.PlanningParameters }))),
  predictionLine: lazy(() => import('../pages/ai/PredictivePages').then((m) => ({ default: m.PredictionLineDetail }))),
  replenishmentList: lazy(() => import('../pages/ai/ReplenishmentPages')),
  replenishmentCreate: lazy(() => import('../pages/ai/ReplenishmentPages').then((m) => ({ default: m.ReplenishmentCreate }))),
  replenishmentDetail: lazy(() => import('../pages/ai/ReplenishmentPages').then((m) => ({ default: m.ReplenishmentDetail }))),
  aiInsights: lazy(() => import('../pages/ai/AiInsights')),
  modelManagement: lazy(() => import('../pages/ai/ModelManagement')),
  aiSettings: lazy(() => import('../pages/ai/AiSettings')),
  // Phase 1 completion — administration, organization, account, notifications
  userList: lazy(() => import('../pages/admin/UserList')),
  userForm: lazy(() => import('../pages/admin/UserForm')),
  userDetail: lazy(() => import('../pages/admin/UserDetail')),
  roleList: lazy(() => import('../pages/admin/RoleList')),
  roleForm: lazy(() => import('../pages/admin/RoleForm')),
  roleDetail: lazy(() => import('../pages/admin/RoleForm').then((m) => ({ default: m.RoleDetail }))),
  permissionMatrix: lazy(() => import('../pages/admin/PermissionMatrix')),
  roleAssignment: lazy(() => import('../pages/admin/RoleAssignment')),
  auditLog: lazy(() => import('../pages/admin/AuditLog')),
  appSettings: lazy(() => import('../pages/admin/AppSettings')),
  companyProfile: lazy(() => import('../pages/admin/organization/CompanyProfile')),
  orgBranches: lazy(() => import('../pages/admin/organization/OrgMasterPage').then((m) => ({ default: m.Branches }))),
  orgBusinessUnits: lazy(() => import('../pages/admin/organization/OrgMasterPage').then((m) => ({ default: m.BusinessUnits }))),
  orgDepartments: lazy(() => import('../pages/admin/organization/OrgMasterPage').then((m) => ({ default: m.Departments }))),
  orgDesignations: lazy(() => import('../pages/admin/organization/OrgMasterPage').then((m) => ({ default: m.Designations }))),
  orgWarehouses: lazy(() => import('../pages/admin/organization/OrgMasterPage').then((m) => ({ default: m.Warehouses }))),
  employeeMaster: lazy(() => import('../pages/admin/organization/EmployeeMaster')),
  supplierList: lazy(() => import('../pages/suppliers/SupplierList')),
  warehouseDashboard: lazy(() => import('../pages/dashboard/OperationsPages').then((m) => ({ default: m.WarehousePage }))),
  qaDashboard: lazy(() => import('../pages/dashboard/OperationsPages').then((m) => ({ default: m.QualityPage }))),
  notificationCenter: lazy(() => import('../pages/notifications/NotificationCenterPage')),
  userProfile: lazy(() => import('../pages/account/UserProfile')),
  changePassword: lazy(() => import('../pages/account/ChangePassword')),
  logoutConfirm: lazy(() => import('../pages/account/LogoutConfirm')),
  // Finalisation — scrap, calls, reports center, driver & customer apps
  scrapDashboard: lazy(() => import('../pages/scrap/ScrapPages').then((m) => ({ default: m.ScrapDashboard }))),
  scrapList: lazy(() => import('../pages/scrap/ScrapPages').then((m) => ({ default: m.ScrapList }))),
  scrapDetail: lazy(() => import('../pages/scrap/ScrapPages').then((m) => ({ default: m.ScrapDetail }))),
  scrapPrint: lazy(() => import('../pages/scrap/ScrapPages').then((m) => ({ default: m.ScrapPrint }))),
  scrapForm: lazy(() => import('../pages/scrap/ScrapForm')),
  callDashboard: lazy(() => import('../pages/calls/CallPages').then((m) => ({ default: m.CallDashboard }))),
  callList: lazy(() => import('../pages/calls/CallPages').then((m) => ({ default: m.CallList }))),
  callDetail: lazy(() => import('../pages/calls/CallPages').then((m) => ({ default: m.CallDetail }))),
  callFollowUps: lazy(() => import('../pages/calls/CallPages').then((m) => ({ default: m.CallFollowUps }))),
  callForm: lazy(() => import('../pages/calls/CallForm')),
  reportsCenter: lazy(() => import('../pages/reports/ReportsCenter')),
  reportViewer: lazy(() => import('../pages/reports/ReportViewer')),
  driverRoute: lazy(() => import('../pages/driver/DriverRoute')),
  driverCompleted: lazy(() => import('../pages/driver/DriverCompleted')),
  fleetTracking: lazy(() => import('../pages/dispatch/FleetTracking')),
  customerHome: lazy(() => import('../pages/customer/CustomerHome')),
  customerCatalog: lazy(() => import('../pages/customer/CustomerCatalog')),
  customerCart: lazy(() => import('../pages/customer/CustomerCart')),
  customerOrders: lazy(() => import('../pages/customer/CustomerOrders')),
  customerOrder: lazy(() => import('../pages/customer/CustomerOrderDetail')),
  customerTracking: lazy(() => import('../pages/customer/CustomerTracking')),
  customerNotes: lazy(() => import('../pages/customer/CustomerDocuments').then((m) => ({ default: m.CustomerNotes }))),
  customerNote: lazy(() => import('../pages/dispatch/DeliveryNotePage').then((m) => ({ default: m.CustomerDeliveryNotePage }))),
  customerInvoices: lazy(() => import('../pages/customer/CustomerDocuments').then((m) => ({ default: m.CustomerInvoices }))),
  customerInvoice: lazy(() => import('../pages/customer/CustomerDocuments').then((m) => ({ default: m.CustomerInvoice }))),
  customerPayments: lazy(() => import('../pages/customer/CustomerDocuments').then((m) => ({ default: m.CustomerPayments }))),
  customerProfile: lazy(() => import('../pages/customer/CustomerProfile')),
  customerTrackingList: lazy(() => import('../pages/customer/CustomerTrackingList')),
  // Project workspace — device emulator and documentation library
  mobilePreview: lazy(() => import('../pages/mobilePreview/MobilePreviewPage')),
  projectDocuments: lazy(() => import('../pages/projectDocuments/ProjectDocumentsPage')),
  // Enterprise expansion — one generic module page (list / create / detail / edit from the module definition),
  // dashboards, control tower, finance, batches, portals, self-service and the van sales app
  enterpriseModule: lazy(() => import('../pages/enterprise/EnterpriseModulePage')),
  enterpriseDashboard: lazy(() => import('../pages/enterprise/Dashboards')),
  controlTower: lazy(() => import('../pages/enterprise/ControlTower')),
  batchesPage: lazy(() => import('../pages/enterprise/InventoryPages').then((m) => ({ default: m.BatchesPage }))),
  supplierPerformance: lazy(() => import('../pages/enterprise/InventoryPages').then((m) => ({ default: m.SupplierPerformance }))),
  receivablesPage: lazy(() => import('../pages/enterprise/FinancePages').then((m) => ({ default: m.ReceivablesPage }))),
  payablesPage: lazy(() => import('../pages/enterprise/FinancePages').then((m) => ({ default: m.PayablesPage }))),
  vatPage: lazy(() => import('../pages/enterprise/FinancePages').then((m) => ({ default: m.VatPage }))),
  supplierPortal: lazy(() => import('../pages/enterprise/PortalPages').then((m) => ({ default: m.SupplierPortal }))),
  essPage: lazy(() => import('../pages/enterprise/PortalPages').then((m) => ({ default: m.EssPage }))),
  vanSalesApp: lazy(() => import('../pages/enterprise/PortalPages').then((m) => ({ default: m.VanSalesApp }))),
  driverExpenses: lazy(() => import('../pages/enterprise/PortalPages').then((m) => ({ default: m.DriverExpenses }))),
  customerStatement: lazy(() => import('../pages/enterprise/PortalPages').then((m) => ({ default: m.CustomerStatement }))),
  customerSupport: lazy(() => import('../pages/enterprise/PortalPages').then((m) => ({ default: m.CustomerSupport }))),
}

/** "/" sends each user to their role's landing page. */
function LandingRedirect() {
  const { user } = useAuth()
  return <Navigate to={landingPathFor(user)} replace />
}

const pageFor = (item) => {
  if (item.redirectTo) return <Navigate to={item.redirectTo} replace />
  const Page = PAGES[item.page]
  // key: routes sharing one page component (enterprise modules) must not share component state
  return Page ? <Page key={item.id} navItem={item} /> : <NotFound />
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage label="Loading…" />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<LandingRedirect />} />
            {NAV_ITEMS.map((item) => (
              <Route
                key={item.id}
                path={item.path}
                element={<ProtectedRoute item={item}>{pageFor(item)}</ProtectedRoute>}
              />
            ))}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
