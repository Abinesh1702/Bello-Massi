/** Small, dependency-free helpers. */

export const cn = (...classes) => classes.flat().filter(Boolean).join(' ')

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)


export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const isValidEmail = (v) => EMAIL_PATTERN.test(String(v || '').trim())

/**
 * Demo-only password fingerprint (FNV-1a). This is NOT cryptographic security —
 * it only avoids keeping the demo passwords as readable plain text in browser storage.
 */
export const demoHash = (text = '') => {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `fnv1a$${(h >>> 0).toString(16).padStart(8, '0')}`
}

/** Deterministic pseudo-random generator so seeded demo data is stable across resets. */
export const seededRandom = (seed = 42) => {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const downloadJson = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.readAsText(file)
  })
