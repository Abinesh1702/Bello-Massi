import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserRound, Pencil, ArrowLeft, Truck, CheckCircle2, AlertTriangle, PackageCheck, Gauge, Route, Phone, Mail } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import InfoList from '../../components/common/InfoList'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import Tabs from '../../components/common/Tabs'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { ActiveStatusBadge, AvailabilityBadge, DeliveryStatusBadge, DispatchStatusBadge, LicenseBadge } from '../../components/dispatch/DispatchBadges'
import { useDispatchData } from '../../hooks/useDispatchData'
import { usePermission } from '../../hooks/usePermission'
import { getDriverById, getDriverPerformance } from '../../services/driverService'
import { TERMINAL_DELIVERY_STATUSES } from '../../config/dispatchConfig'
import { formatDate, formatDateTime, formatNumber, formatPercent } from '../../utils/formatters'

export default function DriverDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { drivers, deliveries, dispatches, lk } = useDispatchData()
  const canManage = usePermission('fleet.manage')
  const [tab, setTab] = useState('assigned')
  const driver = getDriverById(id, drivers)
  const perf = useMemo(() => (driver ? getDriverPerformance(driver.id, deliveries, dispatches) : null), [driver, deliveries, dispatches])
  if (!driver) return <NotFoundRecord entity="driver" backTo="/dispatch/drivers" backLabel="Back to drivers" />

  const mine = deliveries.filter((d) => d.driverId === driver.id && d.status !== 'CANCELLED')
  const assigned = mine.filter((d) => !TERMINAL_DELIVERY_STATUSES.includes(d.status)).sort((a, b) => a.sequence - b.sequence)
  const history = mine.filter((d) => TERMINAL_DELIVERY_STATUSES.includes(d.status)).sort((a, b) => ((a.completedAt || a.failedAt) < (b.completedAt || b.failedAt) ? 1 : -1))
  const myDispatches = dispatches.filter((d) => d.driverId === driver.id).sort((a, b) => (a.dispatchDate < b.dispatchDate ? 1 : -1))

  const deliveryColumns = [
    { key: 'order', header: 'Order', render: (d) => (<div><p className="font-medium tabular whitespace-nowrap">{d.orderNumber}</p><p className="text-xs text-muted">{d.customerName}</p></div>) },
    { key: 'dispatch', header: 'Dispatch', hideBelow: 'md', render: (d) => <span className="tabular text-xs">{d.dispatchNumber} · stop {d.sequence}</span> },
    { key: 'qty', header: 'Qty', align: 'right', hideBelow: 'sm', render: (d) => formatNumber(d.totalQuantity) },
    { key: 'when', header: 'When', hideBelow: 'lg', render: (d) => <span className="text-xs whitespace-nowrap">{formatDateTime(d.completedAt || d.failedAt || d.startedAt || d.createdAt)}</span> },
    { key: 'status', header: 'Status', render: (d) => <DeliveryStatusBadge status={d.status} /> },
  ]
  const dispatchColumns = [
    { key: 'n', header: 'Dispatch', render: (d) => (<div><p className="font-medium tabular whitespace-nowrap">{d.dispatchNumber}</p><p className="text-xs text-muted">{formatDate(d.dispatchDate)}</p></div>) },
    { key: 'z', header: 'Zone', hideBelow: 'md', render: (d) => lk.zones[d.zoneId]?.name || '—' },
    { key: 'v', header: 'Vehicle', hideBelow: 'lg', render: (d) => <span className="tabular">{d.vehicleNumber || '—'}</span> },
    { key: 's', header: 'Stops', align: 'right', render: (d) => d.totalDeliveries },
    { key: 'st', header: 'Status', render: (d) => <DispatchStatusBadge status={d.status} /> },
  ]
  const vehicle = lk.vehicles[driver.vehicleId]
  return (
    <>
      <PageHeader title={driver.name} description={`${driver.code} · ${lk.hubs[driver.hubId]?.name || ''}`}
        actions={<><Button variant="secondary" icon={ArrowLeft} to="/dispatch/drivers">Drivers</Button>{canManage && <Button icon={Pencil} to={`/dispatch/drivers/${driver.id}/edit`}>Edit</Button>}</>}>
        <div className="mt-3 flex flex-wrap gap-2"><ActiveStatusBadge status={driver.status} /><AvailabilityBadge value={driver.availability} /><LicenseBadge driver={driver} /></div>
      </PageHeader>
      <StatGrid cols={5}>
        <StatCard label="Delivered" value={perf.delivered} icon={CheckCircle2} tone="success" hint={`${perf.stops} stops in total`} />
        <StatCard label="Partial" value={perf.partial} icon={PackageCheck} tone="warning" />
        <StatCard label="Failed / returned" value={perf.failed} icon={AlertTriangle} tone="danger" />
        <StatCard label="Success rate" value={formatPercent(perf.successRate)} icon={Gauge} tone="info" hint={`On time ${formatPercent(perf.onTimeRate)}`} />
        <StatCard label="Dispatches" value={perf.dispatches} icon={Route} tone="brand" hint={`${perf.pending} stops pending`} />
      </StatGrid>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Profile" icon={UserRound} />
          <InfoList columns={1} items={[
            { label: 'Mobile', value: <a className="inline-flex items-center gap-1 text-brand hover:underline" href={`tel:${driver.mobile.replace(/\s/g, '')}`}><Phone size={13} /> {driver.mobile}</a> },
            { label: 'Email', value: driver.email ? <a className="inline-flex items-center gap-1 text-brand hover:underline" href={`mailto:${driver.email}`}><Mail size={13} /> {driver.email}</a> : '' },
            { label: 'Employee number', value: driver.employeeNumber },
            { label: 'Home zone', value: lk.zones[driver.zoneId]?.name },
            { label: 'Driving licence', value: `${driver.licenseNumber} · expires ${formatDate(driver.licenseExpiry)}` },
            { label: 'Regular vehicle', value: vehicle ? <span className="inline-flex items-center gap-1"><Truck size={13} /> {vehicle.vehicleNumber} · {vehicle.type} · {formatNumber(vehicle.capacity)} {vehicle.capacityUnit.toLowerCase()}</span> : 'None' },
            { label: 'Address', value: driver.address },
            { label: 'Demo login', value: driver.userId ? 'Linked to the driver demo account' : 'No login' },
            { label: 'Notes', value: driver.notes },
          ]} />
        </Card>
        <Card className="lg:col-span-2">
          <Tabs value={tab} onChange={setTab} className="mb-4" tabs={[
            { id: 'assigned', label: `Assigned deliveries (${assigned.length})` },
            { id: 'history', label: `Delivery history (${history.length})` },
            { id: 'dispatches', label: `Dispatches (${myDispatches.length})` },
          ]} />
          {tab === 'assigned' && <DataTable caption="Assigned deliveries" columns={deliveryColumns} rows={assigned} pageSize={8} onRowClick={(d) => navigate(`/dispatch/deliveries/${d.id}`)} empty={<EmptyState compact icon={Truck} title="No open deliveries" />} />}
          {tab === 'history' && <DataTable caption="Delivery history" columns={deliveryColumns} rows={history} pageSize={8} onRowClick={(d) => navigate(`/dispatch/deliveries/${d.id}`)} empty={<EmptyState compact title="No completed deliveries yet" />} />}
          {tab === 'dispatches' && <DataTable caption="Dispatches" columns={dispatchColumns} rows={myDispatches} pageSize={8} onRowClick={(d) => navigate(`/dispatch/${d.id}`)} empty={<EmptyState compact title="No dispatches yet" />} />}
        </Card>
      </div>
    </>
  )
}
