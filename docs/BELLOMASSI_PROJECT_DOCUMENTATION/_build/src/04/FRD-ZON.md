---
id: "BM-FRD-ZON"
title: "Functional Requirements — Zone Management"
folder: "04"
file: "BM-FRD-ZON_Zone_Management"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Zone Management"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Zone Management module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Zone Management module (/dispatch/zones)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `ZON` |
| Module name | Zone Management |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/dispatch/zones` |
| Services / components | `zoneService` |
| LocalStorage keys (prototype) | `bellomassi_dispatch_zones` |


## 2. Purpose

Delivery zones as pincode groups per hub; zone of each order and neighbouring-zone warning.

## 3. Business objectives

Every order falls into a delivery zone that drives planning.

Related business requirements: BR-006, BR-014.

## 4. User roles

- Administrator
- Dispatcher
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `fleet.view`, `fleet.manage`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Dispatch Zones | `/dispatch/zones` | `fleet.view` |
| New Zone | `/dispatch/zones/create` | `fleet.manage` |
| Edit Zone | `/dispatch/zones/:id/edit` | `fleet.manage` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-ZON-001 | P1 | Administrators shall maintain zones per hub with a list of pincodes. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-ZON-002 | P2 | The system shall warn when a dispatch mixes orders from non-neighbouring zones. | Dispatcher | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Zone code · name · hub · pincodes · neighbouring zones · status

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-ZON-001: expected behaviour — Zone saved; code unique; at least one pincode.
- FR-ZON-002: expected behaviour — Neighbouring-zone warning shown.

## 11. Workflow

See {{ref:BM-WF-08}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Zone: Active / Inactive. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_dispatch_zones`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Zone delivery performance (dispatch dashboard).

## 19. Audit requirements

Activity log. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-ZON-001 | Zone saved; code unique; at least one pincode. | TC-ZON-001 |
| FR-ZON-002 | Neighbouring-zone warning shown. | TC-ZON-002 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 2. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Polygon zones on a map with geocoded customer locations.


