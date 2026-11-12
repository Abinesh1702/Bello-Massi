import { FileText, FileSpreadsheet, FileType2, Presentation, FileImage, FileCode2, File } from 'lucide-react'
import { cn } from '../../utils/helpers'

const STYLE = {
  pdf: { icon: FileType2, cls: 'bg-danger/10 text-danger', label: 'PDF' },
  docx: { icon: FileText, cls: 'bg-info/10 text-info', label: 'DOCX' },
  xlsx: { icon: FileSpreadsheet, cls: 'bg-success/10 text-success', label: 'XLSX' },
  pptx: { icon: Presentation, cls: 'bg-warning/10 text-warning', label: 'PPTX' },
  md: { icon: FileCode2, cls: 'bg-brand/10 text-brand', label: 'MD' },
  yaml: { icon: FileCode2, cls: 'bg-surface-3 text-ink-2', label: 'YAML' },
  mmd: { icon: FileCode2, cls: 'bg-surface-3 text-ink-2', label: 'MMD' },
  svg: { icon: FileImage, cls: 'bg-accent/15 text-accent-ink', label: 'SVG' },
  png: { icon: FileImage, cls: 'bg-accent/15 text-accent-ink', label: 'PNG' },
}

/** Coloured file-type tile used in the document list and the viewer. */
export function FileTypeIcon({ type, size = 'md', className }) {
  const s = STYLE[type] || { icon: File, cls: 'bg-surface-3 text-muted', label: String(type || '').toUpperCase() }
  const Icon = s.icon
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-lg', size === 'lg' ? 'h-14 w-14' : 'h-9 w-9', s.cls, className)} aria-hidden>
      <Icon size={size === 'lg' ? 26 : 18} />
    </span>
  )
}

export const fileTypeShort = (type) => STYLE[type]?.label || String(type || '').toUpperCase()
