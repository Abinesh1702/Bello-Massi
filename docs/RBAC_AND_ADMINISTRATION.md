# RBAC, authentication & administration (Phase 1 completion)

Frontend-only prototype. Everything below runs in the browser against LocalStorage. It mirrors how a server would
enforce access, but it is **not** security: anyone with access to the browser can read or change the stored data.

## 1. Roles and permissions

### Model

- **Permission key** — a string such as `orders.approve`. Every key belongs to one module × action cell of the matrix
  and is either a *page* permission (menus, routes) or an *action* permission (buttons and service operations).
  The full catalog is `src/config/rbacCatalog.js` (102 keys).
- **Modules (20):** Dashboard, Customers, Products, Suppliers, Procurement, Inventory, Warehouse, Sales, Orders, Dispatch,
  Delivery, VMS, Documents, Invoices, Email, WhatsApp, AI, Reports, Finance, Settings.
- **Actions (9):** View, Create, Edit, Delete, Approve, Reject, Export, Import, Manage. A cell shows "—" when the module
  has no separate permission for that action (it is covered by another cell, usually Manage).
- **Role** (`bellomassi_roles`): `code`, `name`, `description`, `dataScope`, `landingPath`, `status`, `system`,
  `protected`, `locked`, `permissions[]`.
- **Data scope** decides *which records* a role sees in a module it can open: All records (Admin), Submitted & approved
  orders (Sales Manager), Own records (Sales Executive), Post-approval orders (Customer Service), Finance view,
  Dispatch & warehouse, Own deliveries (Driver), Linked customer, Linked supplier.

### Resolution

`can(subject, key)` in `src/config/permissions.js` accepts a user, a role code or a list of codes. `services/rbacService.js`
registers the resolver at start-up so every check reads the live roles:

1. inactive role → no permissions;
2. `locked` role (Super Admin) → every permission;
3. otherwise → the role's `permissions` list.

A user's permissions are the **union** of the primary role and all additional roles. The **primary role** decides the
dashboard, the landing page and the data scope (`scopeOf(user)`).

### Enforcement points

| Layer | How |
|---|---|
| Sidebar, search, breadcrumbs | `getNavigationForRole(user)` → `canAccessItem(item, user)` (item `permission`) |
| Routes | `ProtectedRoute` checks the same item; direct URLs go to `/unauthorized` |
| Buttons | `usePermission(key)` hides actions the user cannot perform |
| Services | every create / update / delete / approve / reject / export / import calls `can(getCurrentUser(), key)` **before** writing, and returns an error otherwise — hiding a button is never the only check |
| Records | `scopeOf(user)` limits orders, deliveries, documents and delivery notes to the role's data scope |

Examples: `approvalService` checks `orders.approve` for approve and `orders.reject` for reject / return;
`replenishmentService` checks `procurement.approve` / `procurement.reject`; `documentService.rejectDocument` checks
`documents.reject`; `csvService.downloadCsv` checks `data.export` for every CSV export; backup import / reset check
`data.import`.

### System roles

Super Admin (locked, protected), Administrator (protected), Sales Manager, Sales Executive, Customer Service, Dispatcher,
Driver, Finance Executive, Warehouse Manager, Inventory Executive, QA Manager, Customer (portal), Supplier (portal).
System roles can be renamed, deactivated (except protected ones) and have their permissions edited or reset to
defaults; they cannot be deleted. Custom roles can be deleted only when no user holds them.

Safeguards: only a Super Admin can grant or remove Super Admin; the last active Super Admin cannot be removed;
administrators cannot remove "Edit roles" from their own only role, deactivate or delete themselves.

### Catalog upgrades

`bellomassi_permissions` stores the catalog version and the keys the stored roles already know. When a newer build adds
keys, `syncCatalog()` grants them to the system roles that have them by default — without re-adding keys an
administrator removed.

## 2. Authentication (session simulation)

- Email **or** username; show / hide password; *Remember username* (prefill) and *Keep me signed in* (localStorage vs
  sessionStorage).
- Inactive users and users whose primary role is inactive cannot sign in.
- Lockout after *N* failed attempts for *M* minutes (Security settings); administrators can unlock.
- Inactivity timeout signs the user out and shows a message on the sign-in page.
- Forgot password: a 6-digit **demo reset code shown on screen** (no email), or restore the published demo password.
- Administrator password reset issues a one-time temporary password; the user must change it at the next sign-in.
- Role-based redirect: the page the user tried to open (if allowed), otherwise the role's landing page.
- Device-local state (remembered username, failed attempts, reset codes, last activity) lives in `bellomassi_auth`
  and is excluded from backups.

## 3. Audit log

`services/auditService.js` installs a storage write hook. For audited collections it compares the previous and new
value by record id and records `CREATE`, `EDIT`, `DELETE`, `STATUS_CHANGE`, `APPROVAL`, `REJECTION`, `PASSWORD_CHANGE`
and `SETTINGS_CHANGE` entries with the changed fields' previous and new values. Login, logout, failed login, lockout,
export, import and reset are logged explicitly with `logAudit()`. Secrets are never logged. Any future service that
writes through `storageService` is audited automatically; add its key to `COLLECTIONS` or `SETTINGS` in the audit
service to name the module and entity. The log keeps the latest 3,000 entries and is not tamper-proof.

## 4. Application settings

Stored in `bellomassi_settings.application.<section>` (UI preferences stay at the top level). Company identity
(country, base currency, timezone) is stored in `bellomassi_company`. `appSettingsService.applyRuntimeConfig()` copies
what helpers need into `config/runtimeConfig.js` on start-up and whenever these keys change.

| Section | Applied to |
|---|---|
| General | Browser title, prototype badge, rows per page in administration lists |
| Company | Summary; edited in Organization › Company |
| Localization | Country, timezone, number format, date and time format — all formatters |
| Currency | Base currency, display, decimals, compact style — all amount formatters (no FX conversion) |
| Numbering | Order, dispatch, delivery note, replenishment, forecast and employee ID prefixes |
| Notifications | Categories raised for the organisation, user muting, retention |
| Security | Session timeout, lockout, password rules, reset code validity, forced change after reset |
| Approval | Mandatory approval remarks, block approval when credit is exceeded, minimum rejection remarks |
| Inventory | Defaults for new products, expiry warning window |
| Warehouse | Default receiving hub (applied); picking, put-away, QA hold (stored for the WMS module) |
| Cold chain | Ranges used by the QA dashboard and the warehouse master (no sensors connected) |
| Integration | Live status of gateway, email, WhatsApp, AI provider; ERP placeholder |
| AI | AI features on / off (hides AI menus), floating Jarvis button |

Each section validates, previews unsaved values, asks for confirmation, can be reset to defaults and is audited.

## 5. Organization master

Company (name, legal name, logo, address, country, currency, timezone, TRN with UAE 15-digit check, trade licence),
Branches, Business Units, Departments, Designations, Warehouses (storage areas per hub with type, temperature range and
capacity), Employee Master (users through the organisation structure) and Hub Master (links to the Phase 2 hubs).
Items still referenced by another record cannot be deleted; items assigned to active users cannot be deactivated.

## 6. Storage keys and versions

| Key | Contents | In backups |
|---|---|---|
| `bellomassi_roles` | Role definitions and permissions | yes |
| `bellomassi_permissions` | Catalog version and known keys | yes |
| `bellomassi_company` | Company profile | yes |
| `bellomassi_organization` | Branches, business units, departments, designations, warehouses | yes |
| `bellomassi_audit_logs` | Audit entries (latest 3,000) | yes |
| `bellomassi_notification_preferences` | Per-user muted categories and pop-up preference | yes |
| `bellomassi_auth` | Remembered username, failed attempts, reset codes, last activity | no (device-local) |
| `bellomassi_demo_users` | Users (now with username, employee ID, department, designation, hub, additional roles, portal links) | yes |
| `bellomassi_settings` | UI preferences + `application` settings + sales targets | yes |

Data version 7. Migration 6 → 7 keeps every existing record unchanged, adds the new keys, adds the new user fields to
existing users (ids, emails, passwords and roles preserved), appends the six new demo accounts, the Phase 1 demo
notifications and — only if none exist — one approved demo replenishment draft for the supplier portal. Older backups
are migrated the same way on import.
