import { useRef } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Button from '../common/Button'
import ProductThumb from './ProductThumb'

const MAX = 2 * 1024 * 1024

/** Downscale to ≤320px JPEG so images stay small in LocalStorage. */
const toDataUrl = (file) => new Promise((resolve, reject) => {
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    const scale = Math.min(1, 320 / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * scale)
    c.height = Math.round(img.height * scale)
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0, c.width, c.height)
    URL.revokeObjectURL(url)
    resolve(c.toDataURL('image/jpeg', 0.8))
  }
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This image could not be read.')) }
  img.src = url
})

export default function ImagePicker({ product, onChange }) {
  const ref = useRef(null)
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Choose a PNG, JPG or WebP image.')
    if (file.size > MAX) return toast.error('Image must be 2 MB or smaller.')
    try { onChange(await toDataUrl(file)) } catch (err) { toast.error(err.message) }
  }
  return (
    <div className="flex items-center gap-4">
      <ProductThumb product={product} size="lg" />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" icon={ImagePlus} onClick={() => ref.current?.click()}>{product.image ? 'Replace image' : 'Upload image'}</Button>
          {product.image && <Button type="button" size="sm" variant="ghost" icon={Trash2} onClick={() => onChange(null)}>Remove</Button>}
        </div>
        <p className="text-xs text-muted">Optional. A category placeholder is shown when no image is set.</p>
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onFile} aria-label="Upload product image" />
      </div>
    </div>
  )
}
