/** Registers every enterprise module definition with the record engine (idempotent). */
import { registerModules, allModuleDefs } from '../../../services/enterprise/recordService'
import { SALES_MODULES } from './sales'
import { SUPPLY_MODULES } from './supply'
import { WAREHOUSE_MODULES } from './warehouse'
import { OPERATIONS_MODULES } from './operations'

export const ENTERPRISE_MODULES = [...SALES_MODULES, ...SUPPLY_MODULES, ...WAREHOUSE_MODULES, ...OPERATIONS_MODULES]

let done = false
export const ensureEnterpriseModules = () => {
  if (done) return allModuleDefs()
  done = true
  registerModules(ENTERPRISE_MODULES)
  return allModuleDefs()
}
