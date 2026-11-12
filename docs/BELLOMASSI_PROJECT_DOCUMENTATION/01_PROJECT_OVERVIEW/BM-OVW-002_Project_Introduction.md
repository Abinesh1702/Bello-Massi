# Project Introduction

## Document control

| Field | Value |
|---|---|
| Document title | Project Introduction |
| Document ID | BM-OVW-002 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Project Overview |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Introduce the Bellomassi project to new team members and stakeholders.

## Scope

Project context, deliverables, current state and next steps.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-OVW-001 — Project Overview Document](BM-OVW-001_Project_Overview.md)
- [BM-OVW-006 — Project Background](BM-OVW-006_Project_Background.md)

## 1. Introduction

The Bellomassi project digitises the distributor's order-to-delivery process. The client's Scope of Work (October 2026)
describes an Order Taking App, a Drivers App and an Admin Panel built on one shared platform. A clickable, data-driven
**prototype** has been built in six phases plus a finalisation and a UI redesign to validate workflows with the client
before backend development.

## 2. Deliverables named in the SOW — VERIFIED (SOW slide 4)

| Deliverable | Platform | Users |
|---|---|---|
| Order Taking App | Mobile and web | Salesman, Sales Manager, Customer Service, Dispatcher |
| Drivers App | Mobile (iOS and Android) | Driver |
| Admin Panel | Web | Administrator, management |

## 3. Current state — VERIFIED

A frontend prototype (React, LocalStorage) implements the SOW workflows and several extensions. It runs from a static
build in any modern browser with seeded demo data and 13 demo accounts. See [BM-OVW-015 — Project Status and Implementation Summary](BM-OVW-015_Project_Status_and_Implementation_Summary.md).

## 4. Next steps — PROPOSED

1. Client review of this documentation and of the open decisions ([BM-HND-012 — Pending Requirements Document](../19_CLIENT_HANDOVER/BM-HND-012_Pending_Requirements.md)).
2. Scope baseline sign-off ([BM-SOW-001 — Scope of Work](../02_BUSINESS_REQUIREMENTS/BM-SOW-001_Scope_of_Work.md)).
3. Backend, mobile and integration build per [BM-RMP-001 — Prototype-to-Production Migration Roadmap (Master)](../20_FUTURE_ROADMAP/BM-RMP-001_Prototype_to_Production_Roadmap.md).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |