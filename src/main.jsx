import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App'
import { initializeStorage } from './services/storageService'
import { syncCatalog } from './services/rbacService' // also registers the live permission resolver
import { initRuntimeConfig } from './services/appSettingsService'
import { installAuditHook } from './services/auditService'
import { ensureEnterpriseModules } from './config/enterprise/modules'
import { installBatchSync } from './services/enterprise/batchService'

// Seed, migrate or repair demo data before the first render (never overwrites valid user changes).
const report = initializeStorage()
if (report.repaired.length) console.warn('[Bellomassi] Repaired corrupted storage keys:', report.repaired)
if (!report.persistent) console.warn('[Bellomassi] Browser storage unavailable — running with in-memory data for this tab only.')
// Roles pick up permission keys added by newer versions; settings feed the formatters and number generators.
syncCatalog()
initRuntimeConfig()
// From here on every data change is written to the audit log.
installAuditHook()
// Enterprise modules (record engine) and the batch / expiry layer that follows every stock movement.
ensureEnterpriseModules()
installBatchSync()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
