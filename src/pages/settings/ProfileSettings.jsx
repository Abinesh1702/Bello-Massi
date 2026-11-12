import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Camera, KeyRound, Save, Trash2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import Card, { CardHeader } from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Avatar from '../../components/common/Avatar'
import Badge from '../../components/common/Badge'
import { useAuth } from '../../hooks/useAuth'
import { getRoleLabel } from '../../config/roles'
import { formatDateTime } from '../../utils/formatters'
import { passwordPolicyText } from '../../services/authService'
import { cn } from '../../utils/helpers'

const AVATAR_COLORS = ['#232B5F', '#34427A', '#0E7490', '#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#B45309']
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

/** Downscale an uploaded image to a 128px square data URL so it fits comfortably in LocalStorage. */
const toAvatarDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const size = 128
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const s = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This image could not be read.'))
    }
    img.src = url
  })

const fromUser = (u) => ({ name: u.name, phone: u.phone || '', title: u.title || '', avatarColor: u.avatarColor, avatarImage: u.avatarImage || null })

export function ProfileForm() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState(() => fromUser(user))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)
  const dirty = JSON.stringify(form) !== JSON.stringify(fromUser(user))

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file (PNG or JPG).')
    if (file.size > MAX_IMAGE_BYTES) return toast.error('Image must be 2 MB or smaller.')
    try {
      const dataUrl = await toAvatarDataUrl(file)
      setForm((f) => ({ ...f, avatarImage: dataUrl }))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setSaving(true)
    const res = updateProfile(form)
    setSaving(false)
    if (!res.ok) {
      setErrors(res.errors || {})
      toast.error(res.errors?.form || 'Please fix the highlighted fields.')
      return
    }
    toast.success('Profile updated')
  }

  return (
    <Card>
      <CardHeader title="Profile" subtitle="How you appear across the platform" />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar name={form.name} color={form.avatarColor} image={form.avatarImage} size="xl" className="ring-line" />
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" icon={Camera} onClick={() => fileRef.current?.click()}>Upload photo</Button>
              {form.avatarImage && (
                <Button type="button" variant="ghost" size="sm" icon={Trash2} onClick={() => setForm((f) => ({ ...f, avatarImage: null }))}>Remove photo</Button>
              )}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onFile} aria-label="Upload profile photo" />
            </div>
            <div>
              <p className="text-xs text-muted mb-1.5">Initials colour</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar colour">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={form.avatarColor === c}
                    aria-label={`Colour ${c}`}
                    onClick={() => setForm((f) => ({ ...f, avatarColor: c }))}
                    className={cn('h-7 w-7 rounded-full ring-offset-2 ring-offset-surface transition', form.avatarColor === c ? 'ring-2 ring-accent' : 'hover:scale-110')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={form.name} onChange={set('name')} error={errors.name} required maxLength={60} autoComplete="name" />
          <Input label="Job title" value={form.title} onChange={set('title')} maxLength={60} />
          <Input label="Email" value={user.email} readOnly hint="Demo account email cannot be changed." />
          <Input label="Phone" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="+971 50 123 4567" autoComplete="tel" inputMode="tel" />
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-ink">Role</p>
            <div className="flex h-10 items-center gap-2"><Badge tone="brand">{getRoleLabel(user.role)}</Badge><span className="text-xs text-muted">Assigned by an administrator</span></div>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-ink">Last sign-in</p>
            <p className="h-10 flex items-center text-sm text-muted">{formatDateTime(user.lastLoginAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" icon={Undo2} disabled={!dirty} onClick={() => { setForm(fromUser(user)); setErrors({}) }}>Discard changes</Button>
          <Button type="submit" icon={Save} loading={saving} disabled={!dirty}>Save profile</Button>
        </div>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const { changePassword } = useAuth()
  const empty = { current: '', next: '', confirm: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }
  const onSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.current) errs.current = 'Enter your current password.'
    if (!form.next) errs.next = 'Enter a new password.'
    if (form.next && form.confirm !== form.next) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) return setErrors(errs)
    const res = changePassword(form.current, form.next)
    if (!res.ok) return setErrors(res.errors || {})
    setForm(empty)
    toast.success('Demo password changed', { description: 'Use “Forgot password” on the sign-in page to restore the default.' })
  }
  return (
    <Card id="password">
      <CardHeader title="Demo password" subtitle="Stored only as a demo fingerprint in this browser — not production security." icon={KeyRound} />
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-3">
        <Input label="Current password" type="password" autoComplete="current-password" value={form.current} onChange={set('current')} error={errors.current} />
        <Input label="New password" type="password" autoComplete="new-password" value={form.next} onChange={set('next')} error={errors.next} hint={passwordPolicyText()} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        <div className="sm:col-span-3 flex justify-end">
          <Button type="submit" variant="secondary" icon={KeyRound}>Change password</Button>
        </div>
      </form>
    </Card>
  )
}

export default function ProfileSettings() {
  const { user } = useAuth()
  const { hash } = useLocation()
  useEffect(() => {
    if (hash === '#password') document.getElementById('password')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])
  return (
    <div className="space-y-6">
      {/* key resets the form when the stored user changes (e.g. after a demo reset) */}
      <ProfileForm key={`${user.id}-${user.updatedAt || ''}`} />
      <PasswordForm />
    </div>
  )
}
