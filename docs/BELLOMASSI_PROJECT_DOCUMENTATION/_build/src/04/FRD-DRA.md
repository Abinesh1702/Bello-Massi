---
id: "BM-FRD-DRA"
title: "Functional Requirements — Driver and Vehicle Assignment"
folder: "04"
file: "BM-FRD-DRA_Driver_and_Vehicle_Assignment"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Driver and Vehicle Assignment"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Driver and Vehicle Assignment module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Driver and Vehicle Assignment module (/dispatch/assignments, /dispatch/drivers, /dispatch/vehicles)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `DRA` |
| Module name | Driver and Vehicle Assignment |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/dispatch/assignments, /dispatch/drivers, /dispatch/vehicles` |
| Services / components | `dispatchService.assignDispatch, driverService, vehicleService` |
| LocalStorage keys (prototype) | `bellomassi_drivers, bellomassi_vehicles` |


## 2. Purpose

Assign compliant, available drivers and vehicles from the same hub with capacity checks.

## 3. Business objectives

Only available, compliant drivers and vehicles of the right hub and size are assigned.

Related business requirements: BR-006, BR-014, BR-021.

## 4. User roles

- Administrator
- Dispatcher
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `dispatch.manage`, `fleet.view`, `fleet.manage`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Driver Assignment | `/dispatch/assignments` | `dispatch.manage` |
| Drivers | `/dispatch/drivers` | `fleet.view` |
| Vehicles | `/dispatch/vehicles` | `fleet.view` |
| New Driver | `/dispatch/drivers/create` | `fleet.manage` |
| Edit Driver | `/dispatch/drivers/:id/edit` | `fleet.manage` |
| Driver Details | `/dispatch/drivers/:id` | `fleet.view` |
| New Vehicle | `/dispatch/vehicles/create` | `fleet.manage` |
| Edit Vehicle | `/dispatch/vehicles/:id/edit` | `fleet.manage` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-DRA-001 | P1 | Dispatchers shall assign a driver and a vehicle to a planned dispatch. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DRA-002 | P1 | Drivers shall be refused when inactive, busy on another active dispatch, offline, from another hub, or with an expired or missing licence. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DRA-003 | P1 | Vehicles shall be refused when inactive, in maintenance, busy, from another hub, over capacity, or with expired required documents. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DRA-004 | P1 | Administrators shall maintain drivers (licence, hub, zone, vehicle, app login) and vehicles (number, type, capacity, hub, documents). | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Driver: code, name, mobile, employee number, licence number and expiry, hub, zone, vehicle, user login, status, availability · Vehicle: number, type, capacity + unit, hub, category, fuel, ownership, document dates, status

## 9. Validation rules

- **RULE-023** — Driver must be active, free, online, from the dispatch hub, with a valid licence and required documents. _(enforced by `driverAssignmentIssues`; message: Issue list.)_
- **RULE-024** — Vehicle must be active, not in maintenance, free, from the hub, within capacity and compliant. _(enforced by `vehicleAssignmentIssues`; message: Issue list.)_

## 10. Business rules

- FR-DRA-001: expected behaviour — Status ASSIGNED; driver notified.
- FR-DRA-002: expected behaviour — Specific refusal messages.
- FR-DRA-003: expected behaviour — "Load of N exceeds … capacity" etc.
- FR-DRA-004: expected behaviour — Records validated (Indian vehicle number format, unique licence).

## 11. Workflow

See {{ref:BM-WF-09}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Driver availability Available / Assigned / On Delivery / Offline; vehicle Available / Assigned / In Transit / Maintenance / Inactive. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Driver: new dispatch assigned / removed.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-DRA-N01 | Driver with expired licence | "…driving licence expired on …" |
| TC-DRA-N02 | Vehicle over capacity | "Load of N exceeds … capacity" |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_drivers, bellomassi_vehicles`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Fleet category; driver performance.

## 19. Audit requirements

Dispatch timeline (assignment events). Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-DRA-001 | Status ASSIGNED; driver notified. | TC-DRA-001 |
| FR-DRA-002 | Specific refusal messages. | TC-DRA-002, TC-DRA-N01 |
| FR-DRA-003 | "Load of N exceeds … capacity" etc. | TC-DRA-003, TC-DRA-N02 |
| FR-DRA-004 | Records validated (Indian vehicle number format, unique licence). | TC-DRA-004 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 4. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Driver shift rosters, vehicle telematics, fatigue rules.


