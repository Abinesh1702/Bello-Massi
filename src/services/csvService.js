/**
 * CSV export with RFC 4180 escaping, a UTF-8 BOM (so Excel shows currency signs and accents correctly)
 * and protection against spreadsheet formula injection.
 * columns: [{ header, value: (row) => any }]
 */
import { toast } from 'sonner'
import { can } from '../config/permissions'
import { getCurrentUser } from './authService'
import { logAudit } from './auditService'

const FORMULA_START = /^[=+\-@\t\r]/

const escapeCell = (raw) => {
  if (raw === null || raw === undefined) return ''
  let v = typeof raw === 'boolean' ? (raw ? 'Yes' : 'No') : String(raw)
  if (typeof raw === 'string' && FORMULA_START.test(v) && !/^-?\d+(\.\d+)?$/.test(v)) v = `'${v}`
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export const toCsv = (rows, columns) => {
  const lines = [columns.map((c) => escapeCell(c.header)).join(',')]
  rows.forEach((row) => lines.push(columns.map((c) => escapeCell(c.value(row))).join(',')))
  return lines.join('\r\n')
}

/**
 * Every CSV export in the app goes through here, so the Export permission (data.export) is checked once for all of
 * them and each export is written to the audit log. Returns the number of rows exported (0 when refused).
 */
export const downloadCsv = (filename, rows, columns) => {
  if (!can(getCurrentUser(), 'data.export')) {
    // Callers show their own "Exported N rows" toast after this returns; replace it with the refusal.
    setTimeout(() => { toast.dismiss(); toast.error('Your role does not have the Export permission.') }, 0)
    return 0
  }
  const blob = new Blob(['﻿', toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  logAudit({ action: 'EXPORT', module: 'reports', entity: 'CSV export', recordLabel: a.download, description: `Exported ${rows.length} row${rows.length === 1 ? '' : 's'} to ${a.download}.` })
  return rows.length
}

export const csvFilename = (name) => `bellomassi-${name}-${new Date().toISOString().slice(0, 10)}.csv`
