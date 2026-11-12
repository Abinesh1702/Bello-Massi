# Authorization and RBAC Design

## Document control

| Field | Value |
|---|---|
| Document title | Authorization and RBAC Design |
| Document ID | BM-SEC-004 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Security and Compliance |
| Related module(s) | All modules |
| Document owner | Security Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Describe the role-based access control model (roles, permission keys, data scopes) as implemented in the prototype and required server-side.

## Scope

13 system roles, custom roles, 110 permission keys, 9 data scopes.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-SEC-005 — RBAC and Access Control Matrix](BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx)
- [BM-FRD-RBAC — Functional Requirements — Role and Permission Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-RBAC_Role_and_Permission_Management.md)
- [BM-DGM-001 — Diagram Catalogue and Visual Documentation](../21_DIAGRAMS_AND_VISUAL_DOCUMENTATION/BM-DGM-001_Diagram_Catalogue.md)

## 1. Model — VERIFIED in prototype

- **Role** → set of **permission keys** (110, `src/config/rbacCatalog.js`) + **data scope** + **landing page**.
- **Permission key** gates a menu / route (`navigation.js`) and a service action (`can(user, key)`).
- **Data scope** filters records: ADMIN (all), SALES_MANAGER (non-draft orders), SALESMAN (own), CUSTOMER_SERVICE
  (orders from approval on), FINANCE (non-draft), DISPATCHER (from consolidation on; also used by warehouse and QA roles),
  DRIVER (own deliveries), CUSTOMER (linked customer), SUPPLIER (linked supplier).
- Super Admin holds every key and is the only role that can manage Super Admin accounts. Administrators manage
  non-locked roles. Default grants: [BM-SEC-005 — RBAC and Access Control Matrix](BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 2. Notable rules found in the code

- The **Administrator does not hold** `orders.approve`, `orders.reject` or `orders.consolidate` by default (segregation of
  duties: approval belongs to the Sales Manager, consolidation to Customer Service).
- Scrap: requester cannot approve own request.
- Replenishment approval only `procurement.approve` (Administrator).
- Customers see only their own vehicle on tracking; drivers only their own deliveries.

## 3. Production enforcement — PROPOSED

1. DRF permission classes per endpoint referencing the same keys (API catalogue lists them).
2. Querysets filtered by scope in a single `ScopedQuerySet` helper (never in views ad hoc).
3. Object-level checks on detail endpoints (return 404 when out of scope).
4. Role and permission changes audited; privileged grants (Super Admin, Admin) require a second administrator (PROPOSED).
5. Quarterly access review exported from the permission matrix.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |