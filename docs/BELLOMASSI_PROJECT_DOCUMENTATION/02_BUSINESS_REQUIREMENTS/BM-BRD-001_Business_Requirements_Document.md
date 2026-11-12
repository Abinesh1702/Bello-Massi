# Business Requirements Document (BRD)

## Document control

| Field | Value |
|---|---|
| Document title | Business Requirements Document (BRD) |
| Document ID | BM-BRD-001 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Business Requirements |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define what the business needs from the Bellomassi platform, independent of technology, so that the client can approve the requirement baseline for production.

## Scope

Order-to-delivery process from order capture to OTP-confirmed delivery and delivery note, the Admin Panel, and the prototype extensions that need a scope decision.

## Definitions

| Term | Definition |
|---|---|
| Business requirement (BR) | A need of the business, stated without design detail, traced to functional requirements |
| Prototype | The React / LocalStorage application used to validate workflows; not production software |

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- Scope of Work presentation, October 2026 (slides 2–18)
- Driver App GPS Implementation Guide (sections 1–12)
- Prototype source code (data version 8)
- [BM-SOW-001 — Scope of Work](BM-SOW-001_Scope_of_Work.md)
- [BM-BRD-002 — Business Requirement Traceability](BM-BRD-002_Business_Requirement_Traceability.xlsx)
- [BM-SYS-002 — Software Requirements Specification (SRS)](../03_SYSTEM_REQUIREMENTS/BM-SYS-002_Software_Requirements_Specification.md)
- [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md)
- [BM-DOC-003 — Gap Analysis — Scope of Work, Prototype and Documentation](../23_DOCUMENT_CONTROL/BM-DOC-003_Gap_Analysis.md)
- [BM-RSK-002 — Project Risk Register](../18_RISK_AND_CHANGE_MANAGEMENT/BM-RSK-002_Project_Risk_Register.xlsx)

## Contents

- 1. Executive summary
- 2. Business background
- 3. Business objectives
- 4. Existing business problems
- 5. Proposed solution
- 6. Business scope
- 7. Stakeholders
- 8. Business requirements
- 9. Business rules
- 10. Business constraints
- 11. Assumptions
- 12. Dependencies
- 13. Business benefits
- 14. Success criteria — PROPOSED, pending confirmation
- 15. Acceptance criteria
- 16. Out-of-scope items
- 17. Risks
- 18. Business approval

## 1. Executive summary

Bellomassi distributes frozen and chilled food. Orders arrive by phone, email and WhatsApp and are handled manually
through approval, preparation, dispatch and delivery. The business needs **one digital order path** with manager
approval and credit control, consolidation by Customer Service, zone-based dispatch, a driver app with the fastest route,
and **customer-confirmed handover by OTP** with an instant delivery note, under the control of an Admin Panel and ready
for SAP integration. A working prototype demonstrates these workflows today; this BRD states the business requirements
for the production platform and identifies what still needs client decision.

## 2. Business background

See [BM-OVW-006 — Project Background](../01_PROJECT_OVERVIEW/BM-OVW-006_Project_Background.md). The client Scope of Work (October 2026) is the requirement baseline; the Driver App GPS guide adds
tracking requirements. The prototype has validated the workflows and introduced extensions (inventory, invoices,
customer app, VMS, documents, communication, AI) whose production scope is not yet agreed.

## 3. Business objectives

OBJ-01 Control · OBJ-02 Visibility · OBJ-03 One record · OBJ-04 Efficient delivery · OBJ-05 Accountability · OBJ-06 Proof
of delivery · OBJ-07 Ready for SAP — defined with proposed measures in [BM-OVW-003 — Project Vision and Objectives](../01_PROJECT_OVERVIEW/BM-OVW-003_Project_Vision_and_Objectives.md).

## 4. Existing business problems

P-01 multiple channels and re-entry · P-02 manual approval and credit · P-03 unclear consolidation · P-04 manual planning,
late driver information · P-05 no proof of handover · P-06 no single status · P-07 item data from emails — see
[BM-OVW-004 — Business Problem Statement](../01_PROJECT_OVERVIEW/BM-OVW-004_Business_Problem_Statement.md).

## 5. Proposed solution

A shared platform with three applications (SOW slide 4):

- **Order Taking App** (mobile and web) — capture, approve, consolidate, dispatch.
- **Drivers App** (iOS and Android) — next-day plan, suggested route, OTP handover.
- **Admin Panel** (web) — users, customers, items, zones, rules, live monitor, reports.

Shared services: one order record, workflow and approvals, live notifications, OTP service, maps and routing, audit trail.
Second stage: SAP integration.

## 6. Business scope

| In scope (SOW) | Scope to be confirmed (prototype extensions) | Out of scope (SOW) |
|---|---|---|
| Order capture, approval, credit check, consolidation, zone dispatch, driver app, route, OTP, delivery note, notifications, Admin Panel, reports, SAP (stage 2) | Customer app, invoicing, inventory, scrap, VMS, documents / OCR, email / WhatsApp, call history, AI, extra roles | Invoicing and finance documents (SOW slide 13), payments |

## 7. Stakeholders

See [BM-OVW-009 — Stakeholder Identification](../01_PROJECT_OVERVIEW/BM-OVW-009_Stakeholder_Identification.md) and [BM-OVW-010 — Stakeholder Responsibility Matrix](../01_PROJECT_OVERVIEW/BM-OVW-010_Stakeholder_Responsibility_Matrix.xlsx). Business owners named below are roles; names are PENDING CONFIRMATION.

## 8. Business requirements

| ID | P | Requirement | Business owner (role) | Source | Label | Functional requirements |
|---|---|---|---|---|---|---|
| BR-001 | P1 | Every customer order received by call, email or WhatsApp shall be captured once in one structured digital record. | Sales Director | SOW slide 2, 7 | VERIFIED | FR-ORD-001, FR-ORD-002, FR-ORD-003, FR-ORD-011 |
| BR-002 | P1 | No order shall be shipped without Sales Manager approval of value, quantity and credit position. | Sales Director | SOW slide 8 | VERIFIED | FR-APR-001, FR-APR-002, FR-APR-003, FR-APR-007 |
| BR-003 | P1 | Every order shall be checked against the customer's credit limit and exceptions shall be flagged. | Finance Manager | SOW slide 8, 18 | VERIFIED | FR-CRD-001, FR-CRD-002, FR-CRD-003, FR-APR-008 |
| BR-004 | P1 | Returned and rejected orders shall always carry the manager's reason back to the salesman. | Sales Director | SOW slide 8 | VERIFIED | FR-APR-004, FR-APR-005, FR-ORD-005 |
| BR-005 | P1 | Customer Service shall receive only approved orders, grouped per salesman, verify them and release them to dispatch. | Operations Manager | SOW slide 9 | VERIFIED | FR-CON-001, FR-CON-002, FR-CON-003, FR-CON-004 |
| BR-006 | P1 | The Dispatcher shall plan deliveries by zone and assign orders to drivers and vehicles. | Logistics Manager | SOW slide 10 | VERIFIED | FR-DSP-001, FR-DSP-002, FR-DSP-008, FR-ZON-001, FR-ZON-002, FR-DRA-001 |
| BR-007 | P1 | Drivers shall see the next day's delivery plan the day before. | Logistics Manager | SOW slide 10, 12 | VERIFIED | FR-DRV-001, FR-DSP-004 |
| BR-008 | P1 | Each driver shall receive a suggested fastest route using distance and live traffic, with VIP requested times respected or warned. | Logistics Manager | SOW slide 12; GPS guide §5 | PROPOSED | FR-DSP-003, FR-DSP-009, FR-DRV-009 |
| BR-009 | P1 | Every handover shall be confirmed with a one-time password given by the customer. | Operations Manager | SOW slide 13 | VERIFIED | FR-OTP-001, FR-OTP-002, FR-OTP-003, FR-OTP-005, FR-DRV-003, FR-DRV-004 |
| BR-010 | P1 | A delivery note shall be issued to the customer as soon as the handover is confirmed. | Operations Manager | SOW slide 13 | VERIFIED | FR-DN-001, FR-DN-002, FR-DN-003 |
| BR-011 | P1 | Every order shall have one clear status visible to every role, with a full history. | Operations Manager | SOW slide 17 | VERIFIED | FR-ORD-008, FR-DASH-001, FR-TRK-001, FR-CAP-003 |
| BR-012 | P1 | The right person shall be notified at each workflow event (in-app; customers by SMS or WhatsApp). | Management | SOW slide 16 | VERIFIED | FR-NOTF-001, FR-AUTO-001, FR-AUTO-002, FR-APR-008, FR-OTP-005 |
| BR-013 | P1 | Administrators shall control users, roles and what each role can see and do. | IT / Administrator | SOW slide 15 | VERIFIED | FR-USR-001, FR-USR-002, FR-RBAC-001, FR-RBAC-002, FR-RBAC-003, FR-RBAC-004, FR-RBAC-005 |
| BR-014 | P1 | Administrators shall maintain customers, delivery locations, credit limits, items, zones and drivers. | IT / Administrator | SOW slide 15 | VERIFIED | FR-CUS-001, FR-CUS-002, FR-PRD-001, FR-ZON-001, FR-DRA-004 |
| BR-015 | P2 | Management shall monitor orders live and export reports on orders, approvals, dispatch and delivery performance. | Management | SOW slide 15 | VERIFIED | FR-RPT-001, FR-RPT-002, FR-DASH-002, FR-DASH-006 |
| BR-016 | P1 | Admin users shall see all active vehicles live; each customer shall see only the vehicle of their own order. | Logistics Manager | GPS guide §1, §6, §9 | PROTOTYPE | FR-TRK-001, FR-TRK-002, FR-TRK-003, FR-CAP-004 |
| BR-017 | P1 | The driver app shall be a mobile app with admin-created accounts and background GPS during active deliveries only. | Logistics Manager | GPS guide §2–§4, §8 | PROPOSED | FR-DRV-002, FR-DRV-010, FR-DRV-011, FR-AUTH-002 |
| BR-018 | P2 | Items and quantities shall be updated from SAP in a second stage (today from emails). | IT / Administrator | SOW slide 4, 15 | PROPOSED | FR-PRD-004, FR-INV-008, FR-CRD-005 |
| BR-019 | P2 | Stock per product and hub shall be controlled with receipts, transfers, adjustments and a movement ledger. | Warehouse Manager | Phase 2 brief | VERIFIED | FR-INV-001, FR-INV-002, FR-INV-003, FR-INV-004, FR-INV-005, FR-INV-006 |
| BR-020 | P2 | Unusable stock shall be written off only after approval by a different user, with evidence. | Warehouse Manager | Finalisation brief | VERIFIED | FR-SCR-001, FR-SCR-002, FR-SCR-003, FR-SCR-004 |
| BR-021 | P2 | Vehicles and drivers with expired mandatory documents shall not be assigned to deliveries. | Fleet Manager | Phase 5 brief | VERIFIED | FR-VMS-001, FR-VMS-002, FR-VMS-003, FR-VMS-004, FR-DRA-002, FR-DRA-003 |
| BR-022 | P2 | Business documents shall be stored centrally, read by OCR and verified before use. | Operations Manager | Phase 5 brief | PROTOTYPE | FR-DOC-001, FR-DOC-002, FR-DOC-003, FR-DOC-004, FR-DOC-005 |
| BR-023 | P2 | Customer invoices shall be produced from orders with branded templates (SOW keeps invoicing outside the app). | Finance Manager | Phase 5 brief (beyond SOW) | PENDING CONFIRMATION | FR-INVC-001, FR-INVC-002, FR-INVC-003, FR-INVC-004, FR-INVC-005 |
| BR-024 | P2 | Staff shall communicate with customers by email and WhatsApp from the platform, manually and automatically. | Sales Director | Phase 5 brief | PROTOTYPE | FR-EML-001, FR-EML-002, FR-OWA-001, FR-OWA-003, FR-AUTO-001 |
| BR-025 | P3 | Customer calls and follow-ups shall be logged and linked to orders. | Sales Director | Finalisation brief | VERIFIED | FR-CALL-001, FR-CALL-002 |
| BR-026 | P2 | Customers shall order, track deliveries and access delivery notes and invoices in a self-service app. | Customer Experience | Finalisation brief (beyond SOW) | PENDING CONFIRMATION | FR-CAP-001, FR-CAP-002, FR-CAP-003, FR-CAP-004, FR-CAP-005, FR-CAP-006, FR-CAP-008 |
| BR-027 | P2 | Failed and partial deliveries shall be reviewed and resolved by the Dispatcher with stock returned correctly. | Operations Manager | Phase 4 brief | VERIFIED | FR-EXC-001, FR-EXC-002, FR-EXC-003, FR-DRV-005 |
| BR-028 | P2 | Every dashboard shall be filterable by period, including the financial year, with comparison to the previous period. | Management | UI/filter brief | VERIFIED | FR-DASH-002, FR-DASH-003, FR-DASH-004, FR-DASH-005 |
| BR-029 | P1 | Only authorised users with active accounts shall sign in; sessions shall expire and accounts lock after repeated failures. | IT / Security | GPS guide §2; Phase 1 brief | VERIFIED | FR-AUTH-001, FR-AUTH-004, FR-AUTH-005, FR-AUTH-006, FR-AUTH-011, FR-AUTH-012, FR-AUTH-013 |
| BR-030 | P1 | Administrative actions shall be auditable and configuration shall be centrally managed. | IT / Security | Phase 1 brief | VERIFIED | FR-SET-001, FR-SET-002, FR-SET-003, FR-SET-004 |
| BR-031 | P3 | Management shall get demand forecasts, reorder suggestions and an assistant for business questions. | Management | Phase 6 brief | PROTOTYPE | FR-AI-001, FR-AI-002, FR-AI-003, FR-AI-004, FR-AI-005 |
| BR-032 | P2 | Warehouse and QA staff shall see picking, quarantine, inspections and document expiry in one place. | Quality Manager | Finalisation brief | VERIFIED | FR-WQA-001, FR-WQA-002, FR-WQA-003 |
| BR-033 | P1 | Proof of delivery (quantities, receiver, signature, photo) shall be captured with every handover. | Operations Manager | SOW slide 13; Phase 4 brief | VERIFIED | FR-POD-001, FR-POD-002, FR-POD-003 |

Full traceability to functional requirements and test cases: [BM-BRD-002 — Business Requirement Traceability](BM-BRD-002_Business_Requirement_Traceability.xlsx).

## 9. Business rules

The 44 business rules enforced by the prototype are listed in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md). Key rules:

1. No order is shipped without Sales Manager approval (RULE-010 … RULE-015).
2. Credit over limit is a warning; it blocks approval when the client enables blocking (RULE-011).
3. Every return or rejection carries a reason (RULE-014).
4. Only approved, consolidated orders reach the Dispatcher (RULE-016, RULE-017).
5. Only compliant, available drivers and vehicles of the right hub and capacity are assigned (RULE-023 … RULE-025).
6. Stock leaves the hub once, at dispatch confirmation (RULE-020, RULE-021).
7. A delivery is completed only with the customer's valid OTP (RULE-027).
8. Failed and partial deliveries are reviewed by the Dispatcher (RULE-031).

## 10. Business constraints

- Customer messages (OTP, delivery note) require an SMS or WhatsApp provider account (SOW slide 16).
- Maps and routing depend on a paid provider (Google Maps Platform / Routes API; usage-based charges — GPS guide §12).
- Mobile GPS depends on drivers' phones, permissions, battery and connectivity (GPS guide §7–8).
- SAP integration depends on the client's SAP interfaces (stage 2).
- See [BM-SYS-005 — System Constraints Document](../03_SYSTEM_REQUIREMENTS/BM-SYS-005_System_Constraints.md).

## 11. Assumptions

- The SOW is the agreed functional baseline unless the client approves the extensions.
- Drivers have company-provided or compatible smartphones with data plans.
- Customers can receive SMS or WhatsApp messages on a registered mobile number.
- See [BM-SYS-006 — Assumptions and Dependencies](../03_SYSTEM_REQUIREMENTS/BM-SYS-006_Assumptions_and_Dependencies.md).

## 12. Dependencies

Client master data (customers, items, zones, drivers, vehicles) · provider accounts (maps, messaging, email) · hosting
decision · SAP team availability (stage 2). See [BM-PM-005 — Issue, Dependency and Decision Registers](../17_PROJECT_MANAGEMENT/BM-PM-005_Issue_Dependency_Decision_Registers.xlsx).

## 13. Business benefits

See [BM-OVW-005 — Business Benefits](../01_PROJECT_OVERVIEW/BM-OVW-005_Business_Benefits.md).

## 14. Success criteria — PROPOSED, pending confirmation

| # | Criterion |
|---|---|
| SC-01 | 100% of orders are captured in the platform within one month of go-live |
| SC-02 | 100% of dispatched orders have an approval record and credit check |
| SC-03 | Drivers receive the next-day plan before the end of the previous working day |
| SC-04 | ≥ 98% of deliveries confirmed by OTP; all exceptions reviewed within one working day |
| SC-05 | Delivery note received by the customer within 5 minutes of handover |
| SC-06 | Management can see the status of any order in real time |

## 15. Acceptance criteria

The BRD is accepted when the client confirms: (1) the business requirements table, (2) the scope decision for each
prototype extension (section 6), (3) the open decisions in [BM-HND-012 — Pending Requirements Document](../19_CLIENT_HANDOVER/BM-HND-012_Pending_Requirements.md). The delivered system is accepted through
UAT ([BM-QA-003 — User Acceptance Testing (UAT) Plan](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-003_UAT_Plan.md), [BM-QA-012 — UAT Test Cases](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-012_UAT_Test_Cases.xlsx)).

## 16. Out-of-scope items

Invoicing and financial documents (unless the client brings the prototype invoice module into scope) · payments,
receipts, credit notes and refunds · purchase invoices · fleet fuel and maintenance costing · cold-chain sensor hardware ·
driver self-registration (GPS guide §2) · dedicated truck GPS hardware (first release; GPS guide §7).

## 17. Risks

Key business risks (full register [BM-RSK-002 — Project Risk Register](../18_RISK_AND_CHANGE_MANAGEMENT/BM-RSK-002_Project_Risk_Register.xlsx)): unclear scope of extensions; country rules (UAE / India) undecided;
messaging provider policy (OpenWA is unofficial); mobile GPS reliability; SAP interface availability; user adoption by
drivers; data migration of customer and item master.

## 18. Business approval

This document has **not been approved**. Signature fields are intentionally blank.

| Role | Name | Signature | Date | Decision |
|---|---|---|---|---|
| Client Project Sponsor | | | | |
| Sales Director | | | | |
| Logistics / Operations Manager | | | | |
| Finance Manager | | | | |
| Delivery Project Manager | | | | |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |