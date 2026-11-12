# Delivery API Design

## Document control

| Field | Value |
|---|---|
| Document title | Delivery API Design |
| Document ID | BM-API-011 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | API and Integration |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the proposed delivery api endpoints for the Django REST backend.

## Scope

11 endpoints under /api/v1.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-API-001 — API Specification (Overview and Conventions)](BM-API-001_API_Specification.md)
- [BM-API-002 — API Endpoint Catalogue](BM-API-002_API_Endpoint_Catalogue.xlsx)
- [BM-SEC-003 — Authentication, Password, MFA and Session Management Design](../10_SECURITY_AND_COMPLIANCE/BM-SEC-003_Authentication_and_Session_Design.md)

## 1. Status

**PROPOSED.** No API exists in the prototype; the same behaviour is implemented today by browser services (see section 4). Paths, payloads and codes will be finalised during backend design.

## 2. Endpoints

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| POST | `/api/v1/deliveries/{id}/start` | `driver.app` | Start stop; open tracking session |
| POST | `/api/v1/tracking/location` | `driver.app` | Send GPS points (batch) |
| POST | `/api/v1/deliveries/{id}/arrived` | `driver.app` | Record arrival; generate and send OTP |
| POST | `/api/v1/deliveries/{id}/otp/regenerate` | `driver.app` | New OTP (old invalidated) |
| POST | `/api/v1/deliveries/{id}/complete` | `driver.app` | Verify OTP, record quantities and POD, close stop, issue note |
| POST | `/api/v1/deliveries/{id}/fail` | `driver.app` | Report failure |
| POST | `/api/v1/deliveries/{id}/review` | `dispatch.manage` | Review failed / partial delivery |
| GET | `/api/v1/deliveries` | `deliveries.view` | Delivery tracking list |
| GET | `/api/v1/deliveries/{id}/otp-status` | `dispatch.otp.inspect` | OTP status (never the code) |
| GET | `/api/v1/delivery-notes/{id}` | `deliveryNotes.view` | Delivery note (PDF link) |
| GET | `/api/v1/customer/orders/{id}/tracking` | `customer.app` | Customer view: own order's vehicle position |

### POST `/api/v1/deliveries/{id}/start`

| Item | Specification |
|---|---|
| Purpose | Start stop; open tracking session |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `Delivery (OUT_FOR_DELIVERY)` |
| Validation / errors | 409 blockers (RULE-026) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/tracking/location`

| Item | Specification |
|---|---|
| Purpose | Send GPS points (batch) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{session_id, points[{lat, lng, accuracy, speed, heading, recorded_at}]}` |
| Response body | `202` |
| Validation / errors | 403 no active session |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/deliveries/{id}/arrived`

| Item | Specification |
|---|---|
| Purpose | Record arrival; generate and send OTP |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{lat, lng}` |
| Response body | `Delivery` |
| Validation / errors | 409 not out for delivery |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/deliveries/{id}/otp/regenerate`

| Item | Specification |
|---|---|
| Purpose | New OTP (old invalidated) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{expires_at}` |
| Validation / errors | 429 rate limit |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/deliveries/{id}/complete`

| Item | Specification |
|---|---|
| Purpose | Verify OTP, record quantities and POD, close stop, issue note |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{otp, items[{order_item_id, delivered_qty, damaged_qty, rejected_qty, short_reason}], received_by, customer_remarks, signature (file), photo (file)}` |
| Response body | `Delivery + DeliveryNote` |
| Validation / errors | 400 POD validation (RULE-028); 422 OTP wrong / expired / locked (RULE-027); 409 already closed |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/deliveries/{id}/fail`

| Item | Specification |
|---|---|
| Purpose | Report failure |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{reason, remarks}` |
| Response body | `Delivery (FAILED)` |
| Validation / errors | 409 not out for delivery |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/deliveries/{id}/review`

| Item | Specification |
|---|---|
| Purpose | Review failed / partial delivery |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{remarks, return_to_hub, requeue}` |
| Response body | `Delivery` |
| Validation / errors | 400 remarks; 409 reviewed / not reviewable (RULE-031) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/deliveries`

| Item | Specification |
|---|---|
| Purpose | Delivery tracking list |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `deliveries.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `?dispatch=&status=&date=` |
| Response body | `page<Delivery>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/deliveries/{id}/otp-status`

| Item | Specification |
|---|---|
| Purpose | OTP status (never the code) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.otp.inspect` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{status, attempts, expires_at}` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/delivery-notes/{id}`

| Item | Specification |
|---|---|
| Purpose | Delivery note (PDF link) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `deliveryNotes.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `DeliveryNote` |
| Validation / errors | 404 / scope |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/customer/orders/{id}/tracking`

| Item | Specification |
|---|---|
| Purpose | Customer view: own order's vehicle position |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `customer.app` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{driver, vehicle, last_position, eta, otp_visible?}` |
| Validation / errors | 404 not own order |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `deliveries` ([BM-DAT-003 — Data Dictionary (Proposed Production Schema)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-003_Data_Dictionary.xlsx)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |