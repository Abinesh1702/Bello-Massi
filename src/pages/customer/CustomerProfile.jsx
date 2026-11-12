import { Building2, Phone, Mail, MapPin, Wallet, Bell, FileText, ReceiptText, LogOut, Settings, Crown, UserRound } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Avatar from '../../components/common/Avatar'
import InfoList from '../../components/common/InfoList'
import { useCustomerWorkspace } from '../../hooks/useCustomerWorkspace'
import { useSignOut } from '../../hooks/useSignOut'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { NoCustomerLink } from './CustomerUi'

export default function CustomerProfile() {
  const w = useCustomerWorkspace()
  const signOut = useSignOut()
  if (!w.customer) return <NoCustomerLink />
  const c = w.customer
  const hub = w.lk.hubs[c.hubId]
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={w.user.name} color={w.user.avatarColor} image={w.user.avatarImage} size="lg" />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-ink">{w.user.name}</h1>
            <p className="text-sm text-muted">{w.user.title || 'Customer account'}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5"><Badge tone="brand">{c.code}</Badge>{c.isVip && <Badge tone="accent"><Crown size={11} aria-hidden />VIP</Badge>}</div>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Company" icon={Building2} />
        <InfoList columns={1} items={[
          { label: 'Customer', value: `${c.name}${c.businessName && c.businessName !== c.name ? ` (${c.businessName})` : ''}` },
          { label: 'Contact person', value: <span className="inline-flex items-center gap-1.5"><UserRound size={13} className="text-muted" aria-hidden />{c.contactPerson}</span> },
          { label: 'Mobile', value: <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-muted" aria-hidden />{c.mobile}{c.altMobile ? ` · ${c.altMobile}` : ''}</span> },
          { label: 'Email', value: <span className="inline-flex items-center gap-1.5"><Mail size={13} className="text-muted" aria-hidden />{c.email}</span> },
          { label: 'Customer since', value: formatDate(c.customerSince) },
          { label: 'Serving hub', value: hub?.name },
        ]} />
      </Card>
      <Card>
        <CardHeader title="Addresses" icon={MapPin} />
        <p className="text-xs font-medium text-muted">Registered / delivery address</p>
        <p className="text-sm text-ink">{[c.addressLine1, c.addressLine2].filter(Boolean).join(', ')}</p>
        <p className="text-sm text-muted">{[c.city, c.state, c.pincode].filter(Boolean).join(', ')}</p>
        <p className="mt-2 text-xs text-muted">You can deliver an order to a different address at checkout. To change your registered address, contact your account manager.</p>
      </Card>
      <Card>
        <CardHeader title="Credit" icon={Wallet} />
        <InfoList items={[
          { label: 'Credit limit', value: c.creditEnabled ? formatCurrency(c.creditLimit) : 'No credit (cash on delivery)' },
          { label: 'Outstanding', value: formatCurrency(c.creditBalance || 0) },
          { label: 'Credit days', value: c.creditEnabled ? `${c.creditDays} days` : '—' },
          { label: 'VIP pass', value: c.vipPassEnabled ? `${c.vipPassNumber || 'Active'}${c.vipPassExpiry ? ` · until ${formatDate(c.vipPassExpiry)}` : ''}` : 'None' },
        ]} />
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={FileText} to="/customer/delivery-notes">Delivery notes</Button>
        <Button variant="secondary" icon={ReceiptText} to="/customer/invoices">Invoices</Button>
        <Button variant="secondary" icon={Wallet} to="/customer/payments">Payments</Button>
        <Button variant="secondary" icon={Wallet} to="/customer/statement" data-testid="customer-statement-link">Statement</Button>
        <Button variant="secondary" icon={FileText} to="/customer/support" data-testid="customer-support-link">Support</Button>
        <Button variant="secondary" icon={Bell} to="/notifications">Notifications</Button>
      </div>
      <Button variant="secondary" icon={Settings} to="/settings" fullWidth>Preferences &amp; password</Button>
      <Button variant="danger-outline" icon={LogOut} onClick={signOut} fullWidth>Sign out</Button>
    </div>
  )
}
