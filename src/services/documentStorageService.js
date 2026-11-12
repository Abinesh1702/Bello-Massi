/**
 * Document file storage abstraction (Phase 5).
 *
 * LocalStorage only ever holds document METADATA. File bytes go to a provider:
 *   - BROWSER_TEMP: IndexedDB in this browser. Temporary prototype storage: the file stays on this
 *     device / browser profile only, is lost if site data is cleared, and is NOT included in JSON
 *     backups. Shown to users as "Temporary browser file".
 *   - BACKEND (future): the integration gateway's /files endpoint backed by S3 / R2. Not active in
 *     the prototype; the interface below is what a backend provider implements.
 *
 * Upload never reports success unless the bytes were actually written and read back.
 */
import { FILE_LIMITS } from '../config/documentConfig'
import { uid } from '../utils/helpers'

const DB_NAME = 'bellomassi_files'
const STORE = 'files'
let dbPromise = null

const openDb = () => {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('This browser does not provide IndexedDB, so files cannot be stored.')); return }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' }) }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('Could not open the browser file store.'))
  }).catch((e) => { dbPromise = null; throw e })
  return dbPromise
}

const tx = async (mode, fn) => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    let result
    Promise.resolve(fn(store)).then((r) => { result = r })
    t.oncomplete = () => resolve(result)
    t.onerror = () => reject(t.error || new Error('Browser file store error.'))
    t.onabort = () => reject(t.error || new Error('Browser file store write was aborted (storage may be full).'))
  })
}
const reqP = (req) => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error) })

export const STORAGE_PROVIDER = { BROWSER_TEMP: 'BROWSER_TEMP', BACKEND: 'BACKEND', NONE: 'none' }
export const STORAGE_LABEL = { BROWSER_TEMP: 'Temporary browser file', BACKEND: 'Backend storage', none: 'No file (demo record)' }

/** Returns an error message, or null when the file is acceptable. */
export const validateFile = (file) => {
  if (!file) return 'Choose a file.'
  if (!FILE_LIMITS.accept.includes(file.type)) return 'Only PDF, JPG, PNG or WebP files are supported.'
  if (file.size > FILE_LIMITS.maxBytes) return `File is ${(file.size / 1048576).toFixed(1)} MB — the prototype limit is ${FILE_LIMITS.maxBytes / 1048576} MB.`
  if (file.size === 0) return 'The file is empty.'
  return null
}

/** Store a File/Blob; resolves to metadata { fileId, fileName, fileType, fileSize, storage } after a read-back check. */
export const saveFile = async (file) => {
  const problem = validateFile(file)
  if (problem) throw new Error(problem)
  const id = uid('file')
  const record = { id, name: file.name, type: file.type, size: file.size, blob: file, savedAt: new Date().toISOString() }
  await tx('readwrite', (s) => s.put(record))
  const check = await getFile(id)
  if (!check || check.size !== file.size) throw new Error('The file could not be saved in this browser (storage may be full or blocked).')
  return { fileId: id, fileName: file.name, fileType: file.type, fileSize: file.size, storage: STORAGE_PROVIDER.BROWSER_TEMP }
}

export const getFile = async (fileId) => {
  if (!fileId) return null
  try { return await tx('readonly', (s) => reqP(s.get(fileId))) } catch { return null }
}

export const deleteFile = async (fileId) => {
  if (!fileId) return
  try { await tx('readwrite', (s) => s.delete(fileId)) } catch { /* nothing to remove */ }
}

/** Object URL for preview / download — the caller revokes it. Null when the file is not in this browser. */
export const getFileUrl = async (fileId) => {
  const rec = await getFile(fileId)
  return rec?.blob ? URL.createObjectURL(rec.blob) : null
}

export const isAvailable = async () => { try { await openDb(); return true } catch { return false } }

const documentStorageService = { saveFile, getFile, getFileUrl, deleteFile, validateFile, isAvailable, STORAGE_PROVIDER, STORAGE_LABEL }
export default documentStorageService
