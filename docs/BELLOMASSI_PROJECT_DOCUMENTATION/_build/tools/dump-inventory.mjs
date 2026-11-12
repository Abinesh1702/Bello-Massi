// Documentation helper: dumps navigation, roles, permissions and status configuration from the real source.
import { NAV_ITEMS } from '../../../../src/config/navigation.js'
import * as roles from '../../../../src/config/roles.js'
import { PERMISSIONS } from '../../../../src/config/permissions.js'
import * as catalog from '../../../../src/config/rbacCatalog.js'
import * as constants from '../../../../src/utils/constants.js'
import * as dispatch from '../../../../src/config/dispatchConfig.js'
import fs from 'node:fs'
const flat = []
NAV_ITEMS.forEach((g) => { if (g.children) g.children.forEach((c) => flat.push({ group: g.label, ...c })); else flat.push({ group: '', ...g }) })
const out = {
  nav: flat.map(({ group, id, label, path, permission, page, hidden, parent, redirectTo, public: pub, description }) => ({ group, id, label, path, permission, page, hidden: !!hidden, parent, redirectTo, public: !!pub, description })),
  roles: roles.ROLES, roleMeta: roles.ROLE_META || null,
  permissions: PERMISSIONS,
  catalog: (catalog.PERMISSION_CATALOG || []).map((p) => ({ key: p.key, module: p.module, action: p.action, label: p.label })),
  landing: catalog.LANDING_PAGES || null, scopes: catalog.DATA_SCOPES || null,
  orderStatus: constants.ORDER_STATUS_META, storageKeys: constants.STORAGE_KEYS,
  dispatchStatus: dispatch.DISPATCH_STATUS_META, deliveryStatus: dispatch.DELIVERY_STATUS_META, failure: dispatch.FAILURE_REASONS,
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
console.log('nav', out.nav.length, 'perm keys', Object.keys(PERMISSIONS).length)
