import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Settings2, Building2, Globe2, Coins, Hash, Bell, ShieldCheck, BadgeCheck, Boxes, Warehouse, Snowflake, PlugZap, Sparkles,
  Save, RotateCcw, Eye, Lock, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Toggle from '../../components/common/Toggle'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import InfoList from '../../components/common/InfoList'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import {
  OPTIONS, SETTINGS_SECTIONS, getSectionValues, resetSection, saveSection, validateSection,
} from '../../services/appSettingsService'
import { NOTIFICATION_CATEGORIES } from '../../services/notificationService'
import { getEmailMode } from '../../services/emailSettingsService'
import { getIntegrationMode } from '../../services/openWAService'
import { getProviderStatus, getAiSettings } from '../../services/ai/aiProviderService'
import { isGatewayConfigured } from '../../services/integrationGateway'
import { INTEGRATION_MODE_META } from '../../config/integrationConfig'
import { AI_STATUS_META, PROVIDER_META } from '../../config/aiConfig'
import { DEFAULT_NUMBERING, ORG_DEFAULTS } from '../../config/runtimeConfig'
import { STORAGE_KEYS } from '../../utils/constants'

const ICONS = { general: Settings2, company: Building2, localization: Globe2, currency: Coins, numbering: Hash, notifications: Bell, security: ShieldCheck, approval: BadgeCheck, inventory: Boxes, warehouse: Warehouse, coldChain: Snowflake, integration: PlugZap, ai: Sparkles }
const DESCRIPTIONS = {
  general: 'Application name, support contact and list defaults.',
  company: 'Company identity is maintained in Organization › Company.',
  localization: 'Country, timezone, number and date formats used across the app.',
  currency: 'Base currency and how amounts are displayed. No exchange-rate conversion is applied.',
  numbering: 'Prefixes for new document numbers (PREFIX-YEAR-NUMBER). Existing numbers are not renumbered.',
  notifications: 'Which notification categories are raised and whether users can mute categories.',
  security: 'Session timeout, sign-in lockout and demo password rules (prototype session simulation).',
  approval: 'Order approval rules applied by the approval service.',
  inventory: 'Defaults for new products and expiry warnings.',
  warehouse: 'Receiving default and warehouse execution preferences.',
  coldChain: 'Temperature ranges used by QA and the warehouse master.',
  integration: 'Status of external connections and the ERP placeholder.',
  ai: 'Switch AI features on or off for the organisation.',
}

const opts = (list) => list.map((v) => (typeof v === 'string' ? { value: v, label: v } : v))
const numberFields = (fields, v, set, errors, disabled) => fields.map(([k, label, hint, extra = {}]) => (
  <Input key={k} label={label} type="number" value={v[k]} onChange={set(k)} error={errors[k]} hint={hint} disabled={disabled} {...extra} />
))

function SectionFields({ section, v, set, setValue, errors, disabled, hubs, company }) {
  switch (section) {
    case 'general':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Application name" value={v.applicationName} onChange={set('applicationName')} error={errors.applicationName} disabled={disabled} hint="Shown in the browser title and settings." />
          <Input label="Support email" type="email" value={v.supportEmail} onChange={set('supportEmail')} error={errors.supportEmail} disabled={disabled} />
          <Select label="Rows per page (administration lists)" value={String(v.defaultPageSize)} onChange={set('defaultPageSize')} error={errors.defaultPageSize} disabled={disabled} options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }]} />
          <div className="pt-6"><Toggle checked={Boolean(v.showPrototypeBadge)} onChange={(on) => setValue('showPrototypeBadge', on)} disabled={disabled} label="Show the DEMO PROTOTYPE badge in the header" /></div>
        </div>
      )
    case 'company':
      return (
        <div className="space-y-4">
          <InfoList items={[
            { label: 'Company name', value: company?.name }, { label: 'Legal name', value: company?.legalName },
            { label: 'Country', value: company?.country }, { label: 'Base currency', value: company?.currency },
            { label: 'Timezone', value: company?.timezone }, { label: `Tax registration (${company?.taxRegistrationLabel || 'TRN'})`, value: company?.taxRegistrationNumber },
          ]} />
          <Button variant="secondary" icon={ExternalLink} to="/admin/organization/company">Edit in Organization › Company</Button>
        </div>
      )
    case 'localization':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Country" value={v.country} onChange={set('country')} error={errors.country} disabled={disabled} options={opts(OPTIONS.country)} />
          <Select label="Timezone" value={v.timezone} onChange={set('timezone')} error={errors.timezone} disabled={disabled} options={OPTIONS.timezone} hint="Timestamps are displayed in this timezone." />
          <Select label="Number format" value={v.numberLocale} onChange={set('numberLocale')} error={errors.numberLocale} disabled={disabled} options={OPTIONS.numberLocale} />
          <Select label="Date format" value={v.dateFormat} onChange={set('dateFormat')} error={errors.dateFormat} disabled={disabled} options={OPTIONS.dateFormat} />
          <Select label="Time format" value={v.timeFormat} onChange={set('timeFormat')} error={errors.timeFormat} disabled={disabled} options={OPTIONS.timeFormat} />
          <Select label="Week starts on" value={v.weekStartsOn} onChange={set('weekStartsOn')} disabled={disabled} options={OPTIONS.weekStartsOn} hint="Used by date pickers in later modules." />
        </div>
      )
    case 'currency':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Base currency" value={v.currency} onChange={set('currency')} error={errors.currency} disabled={disabled} options={OPTIONS.currency} hint="Display only — stored amounts are not converted." />
          <Select label="Currency display" value={v.currencyDisplay} onChange={set('currencyDisplay')} disabled={disabled} options={OPTIONS.currencyDisplay} />
          <Select label="Decimals" value={String(v.decimals)} onChange={set('decimals')} error={errors.decimals} disabled={disabled} options={[{ value: '0', label: '0' }, { value: '2', label: '2' }, { value: '3', label: '3 (e.g. OMR, KWD, BHD)' }]} />
          <Select label="Compact amounts on KPI cards" value={v.compactStyle} onChange={set('compactStyle')} error={errors.compactStyle} disabled={disabled} options={OPTIONS.compactStyle} />
        </div>
      )
    case 'numbering':
      return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[['order', 'Sales orders'], ['dispatch', 'Dispatches'], ['deliveryNote', 'Delivery notes'], ['replenishment', 'Replenishment drafts'], ['forecast', 'Forecasts'], ['employee', 'Employee IDs']].map(([k, label]) => (
            <Input key={k} label={`${label} prefix`} value={v[k]} onChange={(e) => setValue(k, e.target.value.toUpperCase())} error={errors[k]} disabled={disabled} maxLength={12} hint={`Default ${DEFAULT_NUMBERING[k]}`} />
          ))}
          <p className="md:col-span-2 xl:col-span-3 text-xs text-muted">Invoice numbering is configured per series in <Link to="/invoices/templates" className="text-brand hover:underline">Invoice Templates</Link>.</p>
        </div>
      )
    case 'notifications':
      return (
        <div className="space-y-4">
          <fieldset disabled={disabled}>
            <legend className="text-sm font-medium text-ink">Categories raised for the organisation</legend>
            <p className="text-xs text-muted">Switched-off categories are not created at all. Existing notifications are kept.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {NOTIFICATION_CATEGORIES.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm cursor-pointer hover:bg-surface-2">
                  <input type="checkbox" className="h-4 w-4 accent-[#232B5F]" checked={!v.disabledCategories.includes(c.id)}
                    onChange={(e) => setValue('disabledCategories', e.target.checked ? v.disabledCategories.filter((x) => x !== c.id) : [...v.disabledCategories, c.id])} />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="pt-1"><Toggle checked={Boolean(v.allowUserMuting)} onChange={(on) => setValue('allowUserMuting', on)} disabled={disabled} label="Users can mute categories in their preferences" /></div>
            {numberFields([['maxStored', 'Notifications kept', '100–1000, oldest removed first']], v, set, errors, disabled)}
          </div>
        </div>
      )
    case 'security':
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {numberFields([
              ['sessionTimeoutMinutes', 'Session timeout (minutes of inactivity)', '5–1440'],
              ['maxFailedAttempts', 'Failed sign-ins before lockout', '3–20'],
              ['lockoutMinutes', 'Lockout duration (minutes)', '1–1440'],
              ['passwordMinLength', 'Minimum password length', '6–32 (applies to new passwords)'],
              ['resetCodeMinutes', 'Reset code valid for (minutes)', '5–120'],
            ], v, set, errors, disabled)}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Toggle checked={Boolean(v.requireMixedPassword)} onChange={(on) => setValue('requireMixedPassword', on)} disabled={disabled} label="Passwords need a letter and a number" />
            <Toggle checked={Boolean(v.forcePasswordChangeAfterReset)} onChange={(on) => setValue('forcePasswordChangeAfterReset', on)} disabled={disabled} label="Force a password change after an admin reset" />
          </div>
          <p className="flex gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-xs text-muted"><Lock size={14} className="shrink-0 mt-px" aria-hidden />These rules drive the prototype's session simulation. Passwords live in this browser's LocalStorage as a non-cryptographic fingerprint — this is not production security.</p>
        </div>
      )
    case 'approval':
      return (
        <div className="space-y-4">
          <Toggle checked={Boolean(v.requireApprovalRemarks)} onChange={(on) => setValue('requireApprovalRemarks', on)} disabled={disabled} label="Approval remarks are mandatory" description="Sales Managers must write remarks when approving an order." />
          <Toggle checked={Boolean(v.blockWhenCreditExceeded)} onChange={(on) => setValue('blockWhenCreditExceeded', on)} disabled={disabled} label="Block approval when the credit limit would be exceeded" description="Off: credit is a warning the manager acknowledges. On: the order must be returned or rejected." />
          <div className="max-w-xs">{numberFields([['rejectionRemarksMinLength', 'Minimum characters in reject / return remarks', '1–200']], v, set, errors, disabled)}</div>
        </div>
      )
    case 'inventory':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {numberFields([
            ['defaultMinimumStock', 'Default minimum stock (new products)', 'Prefills the product form'],
            ['defaultReorderLevel', 'Default reorder level (new products)', 'Low stock at or below this'],
            ['defaultMaximumStock', 'Default maximum stock (new products)', 'Above this = overstock'],
            ['expiryWarningDays', 'Expiry warning window (days)', 'Used by warehouse & QA dashboards'],
          ], v, set, errors, disabled)}
        </div>
      )
    case 'warehouse':
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Default receiving hub" value={v.defaultReceivingHubId} onChange={set('defaultReceivingHubId')} disabled={disabled} options={[{ value: '', label: 'None — choose per receipt' }, ...hubs.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))]} hint="Prefills New Receipt." />
            <Select label="Picking strategy" value={v.pickingStrategy} onChange={set('pickingStrategy')} error={errors.pickingStrategy} disabled={disabled} options={OPTIONS.pickingStrategy} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Toggle checked={Boolean(v.putawayConfirmation)} onChange={(on) => setValue('putawayConfirmation', on)} disabled={disabled} label="Require put-away confirmation" />
            <Toggle checked={Boolean(v.qaHoldOnReceipt)} onChange={(on) => setValue('qaHoldOnReceipt', on)} disabled={disabled} label="Hold received stock for QA release" />
          </div>
          <p className="text-xs text-muted">Picking strategy, put-away and QA hold are stored for the warehouse execution module and are not enforced yet; stock is tracked per product and hub.</p>
        </div>
      )
    case 'coldChain':
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {numberFields([['frozenMin', 'Frozen min °C'], ['frozenMax', 'Frozen max °C'], ['chilledMin', 'Chilled min °C'], ['chilledMax', 'Chilled max °C']], v, set, errors, disabled)}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {numberFields([['excursionToleranceMinutes', 'Excursion tolerance (minutes)', 'Before an alert would be raised'], ['loggingIntervalMinutes', 'Logger interval (minutes)', 'Expected sensor reading interval']], v, set, errors, disabled)}
          </div>
          <p className="text-xs text-muted">Ranges are shown on the QA dashboard and used as Warehouse Master defaults. No temperature sensors are connected, so no live alerts are raised.</p>
        </div>
      )
    case 'integration':
      return <IntegrationSummary v={v} set={set} errors={errors} disabled={disabled} />
    case 'ai':
      return (
        <div className="space-y-4">
          <Toggle checked={Boolean(v.aiFeaturesEnabled)} onChange={(on) => setValue('aiFeaturesEnabled', on)} disabled={disabled} label="AI features enabled" description="Off hides the AI & Intelligence menus and pages for every role." />
          <Toggle checked={Boolean(v.jarvisFloatingButton)} onChange={(on) => setValue('jarvisFloatingButton', on)} disabled={disabled} label="Show the floating Jarvis button" />
          <p className="text-sm text-muted">Provider, model, data-sharing and OpenJarvis connection are managed in <Link to="/ai/settings" className="text-brand hover:underline">AI Settings</Link>. API keys are never stored in the browser.</p>
        </div>
      )
    default:
      return null
  }
}

function IntegrationSummary({ v, set, errors, disabled }) {
  const email = getEmailMode()
  const wa = getIntegrationMode()
  const ai = getAiSettings()
  const aiStatus = getProviderStatus(ai)
  const rows = [
    { name: 'Integration gateway', status: isGatewayConfigured() ? <Badge tone="info">Configured (VITE_INTEGRATION_GATEWAY_URL)</Badge> : <Badge tone="neutral">Not configured</Badge>, to: null },
    { name: 'Email (SMTP / IMAP)', status: <Badge tone={INTEGRATION_MODE_META[email]?.tone}>{INTEGRATION_MODE_META[email]?.label}</Badge>, to: '/communication/email/settings' },
    { name: 'WhatsApp (OpenWA)', status: <Badge tone={INTEGRATION_MODE_META[wa]?.tone}>{INTEGRATION_MODE_META[wa]?.label}</Badge>, to: '/communication/whatsapp/settings' },
    { name: `AI provider — ${PROVIDER_META[ai.provider]?.short || ai.provider}`, status: <Badge tone={AI_STATUS_META[aiStatus]?.tone}>{AI_STATUS_META[aiStatus]?.label}</Badge>, to: '/ai/settings' },
  ]
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-line rounded-lg border border-line">
        {rows.map((r) => (
          <li key={r.name} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
            <span className="text-ink">{r.name}</span>
            <span className="flex items-center gap-2">{r.status}{r.to && <Link to={r.to} className="text-xs font-medium text-brand hover:underline">Configure</Link>}</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="ERP / accounting system" value={v.erpSystem} onChange={set('erpSystem')} error={errors.erpSystem} disabled={disabled} options={opts(OPTIONS.erpSystem)} hint="Recorded for planning — no ERP connection exists in this prototype." />
        <Textarea label="Integration notes" value={v.erpNotes} onChange={set('erpNotes')} error={errors.erpNotes} disabled={disabled} rows={2} maxLength={500} />
      </div>
    </div>
  )
}

function Preview({ section, v }) {
  const now = dayjs()
  const sample = 1234567.891
  let items = []
  try {
    if (section === 'localization') {
      const nf = new Intl.NumberFormat(v.numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      const local = (() => { try { return now.tz(v.timezone) } catch { return now } })()
      items = [
        { label: 'Date', value: local.format(v.dateFormat) },
        { label: `Date & time (${v.timezone})`, value: `${local.format(v.dateFormat)}, ${local.format(v.timeFormat)}` },
        { label: 'Number', value: nf.format(sample) },
      ]
    } else if (section === 'currency') {
      const d = Number(v.decimals)
      const c = new Intl.NumberFormat(ORG_DEFAULTS.numberLocale, { style: 'currency', currency: v.currency, currencyDisplay: v.currencyDisplay === 'code' ? 'code' : 'symbol', minimumFractionDigits: d, maximumFractionDigits: d })
      items = [
        { label: 'Amount', value: c.format(sample) },
        { label: 'KPI card', value: v.compactStyle === 'indian' ? `${(sample / 1e5).toFixed(1)} L` : new Intl.NumberFormat(ORG_DEFAULTS.numberLocale, { style: 'currency', currency: v.currency, notation: 'compact', maximumFractionDigits: 1 }).format(sample) },
      ]
    } else if (section === 'numbering') {
      items = ['order', 'dispatch', 'deliveryNote', 'replenishment', 'forecast'].map((k) => ({ label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase()), value: `${v[k] || '…'}-${now.year()}-${k === 'replenishment' || k === 'forecast' ? '0001' : '00001'}` })).concat({ label: 'Employee', value: `${v.employee || '…'}-0001` })
    } else if (section === 'security') {
      items = [
        { label: 'Signed out after', value: `${v.sessionTimeoutMinutes} minutes idle` },
        { label: 'Lockout', value: `${v.maxFailedAttempts} failed attempts → ${v.lockoutMinutes} min` },
        { label: 'Password rule', value: `${v.passwordMinLength}+ characters${v.requireMixedPassword ? ', letter + number' : ''}` },
      ]
    } else if (section === 'coldChain') {
      items = [{ label: 'Frozen', value: `${v.frozenMin}°C … ${v.frozenMax}°C` }, { label: 'Chilled', value: `${v.chilledMin}°C … ${v.chilledMax}°C` }]
    } else if (section === 'general') {
      items = [{ label: 'Browser title', value: `${v.applicationName} · Order-to-Delivery` }, { label: 'Admin lists', value: `${v.defaultPageSize} rows per page` }]
    }
  } catch {
    items = [{ label: 'Preview', value: 'Fix the highlighted fields to preview.' }]
  }
  if (!items.length) return null
  return (
    <Card>
      <CardHeader title="Preview" subtitle="How the unsaved values will look" icon={Eye} />
      <InfoList columns={1} items={items} />
    </Card>
  )
}

export default function AppSettings() {
  const [params, setParams] = useSearchParams()
  const section = SETTINGS_SECTIONS.some((s) => s.id === params.get('section')) ? params.get('section') : 'general'
  const settings = useStoredValue(STORAGE_KEYS.SETTINGS, null)
  const company = useStoredValue(STORAGE_KEYS.COMPANY, null)
  const hubs = useStoredValue(STORAGE_KEYS.HUBS, [])
  const canManage = usePermission('settings.manage')
  const saved = useMemo(() => (section === 'company' ? {} : getSectionValues(section)), [section, settings, company]) // eslint-disable-line react-hooks/exhaustive-deps
  const [drafts, setDrafts] = useState({})
  const [errors, setErrors] = useState({})
  const [confirm, setConfirm] = useState(null)
  const v = drafts[section] || saved
  const dirty = Boolean(drafts[section]) && JSON.stringify(drafts[section]) !== JSON.stringify(saved)
  const readOnly = !canManage

  const setValue = (k, val) => {
    setDrafts((d) => ({ ...d, [section]: { ...(d[section] || saved), [k]: val } }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }
  const set = (k) => (e) => setValue(k, e.target.value)
  const go = (id) => { setErrors({}); setParams({ section: id }, { replace: true }) }

  const askSave = () => {
    const errs = validateSection(section, v)
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields.'); return }
    setConfirm('save')
  }
  const doSave = () => {
    const res = saveSection(section, v)
    setConfirm(null)
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    setDrafts((d) => { const n = { ...d }; delete n[section]; return n })
    toast.success(`${SETTINGS_SECTIONS.find((s) => s.id === section).label} saved`)
  }
  const doReset = () => {
    const res = resetSection(section)
    setConfirm(null)
    if (!res.ok) { toast.error(res.error); return }
    setDrafts((d) => { const n = { ...d }; delete n[section]; return n })
    setErrors({})
    toast.success('Section reset to defaults')
  }

  const meta = SETTINGS_SECTIONS.find((s) => s.id === section)
  const Icon = ICONS[section]
  const hasForm = section !== 'company'

  return (
    <>
      <PageHeader title="Application Settings" description="Organisation-wide configuration. Changes are saved in this browser and recorded in the audit log." />
      {readOnly && <p className="mb-4 flex items-center gap-2 text-sm text-muted"><Lock size={15} aria-hidden /> Read-only — changing settings needs the Settings › Manage permission.</p>}
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Tabs orientation="vertical" value={section} onChange={go} tabs={SETTINGS_SECTIONS.map((s) => ({ id: s.id, label: s.label, icon: ICONS[s.id] }))} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] min-w-0">
          <Card className="min-w-0">
            <CardHeader title={meta.label} subtitle={DESCRIPTIONS[section]} icon={Icon} action={dirty && <Badge tone="accent">Unsaved changes</Badge>} />
            <SectionFields section={section} v={v} set={set} setValue={setValue} errors={errors} disabled={readOnly} hubs={hubs} company={company} />
            {hasForm && !readOnly && (
              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                <Button variant="ghost" icon={RotateCcw} onClick={() => setConfirm('reset')}>Reset section</Button>
                <Button variant="secondary" disabled={!dirty} onClick={() => { setDrafts((d) => { const n = { ...d }; delete n[section]; return n }); setErrors({}) }}>Discard</Button>
                <Button icon={Save} disabled={!dirty} onClick={askSave}>Save {meta.label.toLowerCase()}</Button>
              </div>
            )}
          </Card>
          {hasForm && <Preview section={section} v={v} />}
        </div>
      </div>
      <ConfirmDialog open={confirm === 'save'} onClose={() => setConfirm(null)} onConfirm={doSave} confirmLabel="Save settings"
        title={`Save ${meta.label.toLowerCase()}?`} description="The new settings apply immediately for every user of this browser and are written to the audit log." />
      <ConfirmDialog open={confirm === 'reset'} onClose={() => setConfirm(null)} onConfirm={doReset} tone="danger" confirmLabel="Reset section"
        title={`Reset ${meta.label.toLowerCase()} to defaults?`} description={`Default values are restored${['localization', 'currency'].includes(section) ? ' (United Arab Emirates · AED · Asia/Dubai)' : ''}.`} />
    </>
  )
}
