# File Upload, OCR, OTP, Email and OpenWA Security

## Document control

| Field | Value |
|---|---|
| Document title | File Upload, OCR, OTP, Email and OpenWA Security |
| Document ID | BM-SEC-009 |
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

Specify security controls for files, OCR, OTP, proof of delivery, email and WhatsApp (OpenWA).

## Scope

Prototype status (VERIFIED) and production controls (PROPOSED).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-SEC-001 — Security Requirements Document](BM-SEC-001_Security_Requirements.md)
- [BM-API-019 — Integration Specification (External Systems)](../09_API_AND_INTEGRATION/BM-API-019_Integration_Specification.md)
- [BM-FRD-OTP — Functional Requirements — Delivery OTP](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-OTP_Delivery_OTP.md)
- [BM-FRD-DOC — Functional Requirements — Document Management and OCR](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DOC_Document_Management_and_OCR.md)

## 1. File upload security

| Control | Prototype | Production |
|---|---|---|
| Allowed types | Images / PDF via file picker; downscaled images | Allow-list (PDF, JPEG, PNG, WEBP), magic-byte check |
| Size | POD ≤ 350 KB each; documents limited by storage quota | 5 MB documents, 2 MB POD images (configurable) |
| Malware | None | Antivirus scan (ClamAV) before availability; quarantine |
| Storage | Data URL in LocalStorage | Private object storage; random keys; signed URLs (5 min) |
| Metadata | — | Strip EXIF location from photos except POD geo-stamp when required |

## 2. OCR security

Server-side processing only; files never sent to third-party OCR without a data-processing agreement; OCR output stored
separately from verified fields (originals kept, as in the prototype) for audit.

## 3. OTP security

| Control | Prototype (VERIFIED) | Production (PROPOSED) |
|---|---|---|
| Generation | 6 digits on arrival | CSPRNG 6 digits on arrival |
| Storage | Plain text in LocalStorage | HMAC hash only |
| Delivery | Shown in customer app | SMS / WhatsApp to the customer's registered number |
| Expiry | 10 min (1–60) | 10 min |
| Attempts | 5, then LOCKED | 5, then LOCKED + alert |
| Regeneration | Driver can regenerate | Rate-limited (3 per 10 min); old OTP invalidated |
| Exposure | Dispatcher can inspect OTP | Dispatcher sees status only, never the code |
| Fallback | — | Supervisor-approved photo + signature exception (PENDING CONFIRMATION) |

## 4. Proof of delivery

Signature and photo stored privately; linked to delivery with timestamp (and location if confirmed); accessible to the
customer (own), dispatcher, finance via signed URLs; retention 2 years.

## 5. Email security

Dedicated sending domain with SPF, DKIM, DMARC (p=quarantine → reject); TLS to provider; no secrets in the browser
(prototype already restricts credentials to the gateway); templates escape variables; attachments via signed links.

## 6. OpenWA / WhatsApp security

- OpenWA automates WhatsApp Web and is **not an official WhatsApp API**; the number may be banned and message
  delivery is not guaranteed. Recommendation: WhatsApp Business Platform through an official provider.
- If OpenWA is accepted: run in an isolated container, API key on the gateway only, session data encrypted,
  outbound only from the worker network, monitor session status, no customer data retained in OpenWA logs.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |