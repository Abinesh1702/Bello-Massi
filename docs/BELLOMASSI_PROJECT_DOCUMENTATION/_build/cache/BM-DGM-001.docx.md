---
title: "Diagram Catalogue and Visual Documentation"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-DGM-001 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Diagram Catalogue and Visual Documentation |
| Document ID | BM-DGM-001 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Diagrams and Visual Documentation |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Provide all required architecture, process, data and operations diagrams in one place with editable sources.

## Scope

23 diagrams (system architecture, business process, workflows, lifecycle, roles, RBAC, ER, data flow, deployment, network, authentication, integration, CI/CD, backup and recovery).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-ARC-003** (Architecture Diagrams)
- **BM-ARC-001** (High-Level Design (HLD))
- **BM-WF-00** (Business Workflow Catalogue)

## Contents

- 1. Catalogue
- 2. Editing
- DGM-01 — Overall System Architecture (prototype and target)
- DGM-02 — Business Process Architecture
- DGM-03 — Order-to-Delivery Flowchart
- DGM-04 — Order Status Lifecycle
- DGM-05 — Approval Workflow
- DGM-06 — Dispatch Workflow
- DGM-07 — Driver Delivery Workflow
- DGM-08 — Customer Order Workflow
- DGM-09 — Role Interaction Diagram
- DGM-10 — RBAC Diagram
- DGM-11 — ER Diagram (overview)
- DGM-12 — Data Flow Diagram
- DGM-13 — Deployment Architecture
- DGM-14 — Network Architecture
- DGM-15 — Authentication Flow (production)
- DGM-16 — Integration Architecture
- DGM-17 — CI/CD Pipeline
- DGM-18 — Backup and Recovery Architecture
- DGM-19 — System Context Diagram
- DGM-20 — Component Diagram (prototype)
- DGM-21 — Driver Delivery Architecture (production)
- DGM-22 — Customer Application Architecture
- DGM-23 — Order Processing Architecture

## 1. Catalogue

Editable sources are Mermaid (`.mmd`) files; previews are exported as SVG and PNG in this folder. Diagrams never show a production component as existing: labels state VERIFIED (prototype) or PROPOSED (target).

| ID | Diagram | Label | Files | Source |
|---|---|---|---|---|
| DGM-01 | Overall System Architecture (prototype and target) | VERIFIED (prototype) / PROPOSED (target) | `mermaid/DGM-01_Overall_System_Architecture_prototype_and_target.mmd` · `svg/DGM-01_Overall_System_Architecture_prototype_and_target.svg` · `png/DGM-01_Overall_System_Architecture_prototype_and_target.png` | this catalogue |
| DGM-02 | Business Process Architecture | VERIFIED | `mermaid/DGM-02_Business_Process_Architecture.mmd` · `svg/DGM-02_Business_Process_Architecture.svg` · `png/DGM-02_Business_Process_Architecture.png` | this catalogue |
| DGM-03 | Order-to-Delivery Flowchart | VERIFIED | `mermaid/DGM-03_Order_to_Delivery_Flowchart.mmd` · `svg/DGM-03_Order_to_Delivery_Flowchart.svg` · `png/DGM-03_Order_to_Delivery_Flowchart.png` | docs/workflow chapter 06 |
| DGM-04 | Order Status Lifecycle | VERIFIED | `mermaid/DGM-04_Order_Status_Lifecycle.mmd` · `svg/DGM-04_Order_Status_Lifecycle.svg` · `png/DGM-04_Order_Status_Lifecycle.png` | docs/workflow chapter 17 |
| DGM-05 | Approval Workflow | VERIFIED | `mermaid/DGM-05_Approval_Workflow.mmd` · `svg/DGM-05_Approval_Workflow.svg` · `png/DGM-05_Approval_Workflow.png` | docs/workflow chapter 07 |
| DGM-06 | Dispatch Workflow | VERIFIED | `mermaid/DGM-06_Dispatch_Workflow.mmd` · `svg/DGM-06_Dispatch_Workflow.svg` · `png/DGM-06_Dispatch_Workflow.png` | docs/workflow chapter 11 |
| DGM-07 | Driver Delivery Workflow | VERIFIED (GPS / OTP delivery simulated) | `mermaid/DGM-07_Driver_Delivery_Workflow.mmd` · `svg/DGM-07_Driver_Delivery_Workflow.svg` · `png/DGM-07_Driver_Delivery_Workflow.png` | docs/workflow chapter 08 |
| DGM-08 | Customer Order Workflow | VERIFIED (customer app scope PENDING CONFIRMATION) | `mermaid/DGM-08_Customer_Order_Workflow.mmd` · `svg/DGM-08_Customer_Order_Workflow.svg` · `png/DGM-08_Customer_Order_Workflow.png` | docs/workflow chapter 09 |
| DGM-09 | Role Interaction Diagram | VERIFIED | `mermaid/DGM-09_Role_Interaction_Diagram.mmd` · `svg/DGM-09_Role_Interaction_Diagram.svg` · `png/DGM-09_Role_Interaction_Diagram.png` | docs/workflow chapter 04 |
| DGM-10 | RBAC Diagram | VERIFIED (prototype) / PROPOSED (server enforcement) | `mermaid/DGM-10_RBAC_Diagram.mmd` · `svg/DGM-10_RBAC_Diagram.svg` · `png/DGM-10_RBAC_Diagram.png` | this catalogue |
| DGM-11 | ER Diagram (overview) | PROPOSED | `mermaid/DGM-11_ER_Diagram_overview.mmd` · `svg/DGM-11_ER_Diagram_overview.svg` · `png/DGM-11_ER_Diagram_overview.png` | this catalogue |
| DGM-12 | Data Flow Diagram | PROPOSED | `mermaid/DGM-12_Data_Flow_Diagram.mmd` · `svg/DGM-12_Data_Flow_Diagram.svg` · `png/DGM-12_Data_Flow_Diagram.png` | this catalogue |
| DGM-13 | Deployment Architecture | PROPOSED | `mermaid/DGM-13_Deployment_Architecture.mmd` · `svg/DGM-13_Deployment_Architecture.svg` · `png/DGM-13_Deployment_Architecture.png` | this catalogue |
| DGM-14 | Network Architecture | PROPOSED | `mermaid/DGM-14_Network_Architecture.mmd` · `svg/DGM-14_Network_Architecture.svg` · `png/DGM-14_Network_Architecture.png` | this catalogue |
| DGM-15 | Authentication Flow (production) | PROPOSED | `mermaid/DGM-15_Authentication_Flow_production.mmd` · `svg/DGM-15_Authentication_Flow_production.svg` · `png/DGM-15_Authentication_Flow_production.png` | this catalogue |
| DGM-16 | Integration Architecture | PROPOSED | `mermaid/DGM-16_Integration_Architecture.mmd` · `svg/DGM-16_Integration_Architecture.svg` · `png/DGM-16_Integration_Architecture.png` | this catalogue |
| DGM-17 | CI/CD Pipeline | PROPOSED | `mermaid/DGM-17_CI_CD_Pipeline.mmd` · `svg/DGM-17_CI_CD_Pipeline.svg` · `png/DGM-17_CI_CD_Pipeline.png` | this catalogue |
| DGM-18 | Backup and Recovery Architecture | PROPOSED | `mermaid/DGM-18_Backup_and_Recovery_Architecture.mmd` · `svg/DGM-18_Backup_and_Recovery_Architecture.svg` · `png/DGM-18_Backup_and_Recovery_Architecture.png` | this catalogue |
| DGM-19 | System Context Diagram | VERIFIED (actors) / PROPOSED (external systems) | `mermaid/DGM-19_System_Context_Diagram.mmd` · `svg/DGM-19_System_Context_Diagram.svg` · `png/DGM-19_System_Context_Diagram.png` | this catalogue |
| DGM-20 | Component Diagram (prototype) | VERIFIED | `mermaid/DGM-20_Component_Diagram_prototype.mmd` · `svg/DGM-20_Component_Diagram_prototype.svg` · `png/DGM-20_Component_Diagram_prototype.png` | this catalogue |
| DGM-21 | Driver Delivery Architecture (production) | PROPOSED | `mermaid/DGM-21_Driver_Delivery_Architecture_production.mmd` · `svg/DGM-21_Driver_Delivery_Architecture_production.svg` · `png/DGM-21_Driver_Delivery_Architecture_production.png` | this catalogue |
| DGM-22 | Customer Application Architecture | VERIFIED (prototype) / PROPOSED (production) | `mermaid/DGM-22_Customer_Application_Architecture.mmd` · `svg/DGM-22_Customer_Application_Architecture.svg` · `png/DGM-22_Customer_Application_Architecture.png` | this catalogue |
| DGM-23 | Order Processing Architecture | VERIFIED (logic) / PROPOSED (server) | `mermaid/DGM-23_Order_Processing_Architecture.mmd` · `svg/DGM-23_Order_Processing_Architecture.svg` · `png/DGM-23_Order_Processing_Architecture.png` | this catalogue |

## 2. Editing

Edit the `.mmd` file and re-render with Mermaid CLI: `mmdc -i mermaid/<file>.mmd -o svg/<file>.svg`. The workflow diagrams (DGM-03 … DGM-09) are maintained in `docs/workflow/` and copied here.

## DGM-01 — Overall System Architecture (prototype and target)

Label: **VERIFIED (prototype) / PROPOSED (target)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/827ba86b0560.png){width=17.00cm}



## DGM-02 — Business Process Architecture

Label: **VERIFIED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/89e8e532ace4.png){width=17.00cm}



## DGM-03 — Order-to-Delivery Flowchart

Label: **VERIFIED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/e6b350abc337.png){width=17.00cm}



## DGM-04 — Order Status Lifecycle

Label: **VERIFIED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/f725453ae2c2.png){width=17.00cm}



## DGM-05 — Approval Workflow

Label: **VERIFIED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/f8b6128f1234.png){width=17.00cm}



## DGM-06 — Dispatch Workflow

Label: **VERIFIED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/fe85814da394.png){width=17.00cm}



## DGM-07 — Driver Delivery Workflow

Label: **VERIFIED (GPS / OTP delivery simulated)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/bd6eeee162c1.png){width=17.00cm}



## DGM-08 — Customer Order Workflow

Label: **VERIFIED (customer app scope PENDING CONFIRMATION)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/786aa194d027.png){width=17.00cm}



## DGM-09 — Role Interaction Diagram

Label: **VERIFIED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/ceb83cfefe36.png){width=17.00cm}



## DGM-10 — RBAC Diagram

Label: **VERIFIED (prototype) / PROPOSED (server enforcement)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/f4c296791e02.png){width=17.00cm}



## DGM-11 — ER Diagram (overview)

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/562a10be29ec.png){width=17.00cm}



## DGM-12 — Data Flow Diagram

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/259d95dfaf40.png){width=17.00cm}



## DGM-13 — Deployment Architecture

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/4de5ca52245c.png){width=17.00cm}



## DGM-14 — Network Architecture

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/a05c841d415b.png){width=17.00cm}



## DGM-15 — Authentication Flow (production)

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/9d0b0b2411d8.png){width=17.00cm}



## DGM-16 — Integration Architecture

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/deafe897f126.png){width=17.00cm}



## DGM-17 — CI/CD Pipeline

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/a2b04c067941.png){width=17.00cm}



## DGM-18 — Backup and Recovery Architecture

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/ae5e0ec1e30a.png){width=17.00cm}



## DGM-19 — System Context Diagram

Label: **VERIFIED (actors) / PROPOSED (external systems)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/fdcd6b4e5e0a.png){width=17.00cm}



## DGM-20 — Component Diagram (prototype)

Label: **VERIFIED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/8a94846f0143.png){width=17.00cm}



## DGM-21 — Driver Delivery Architecture (production)

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/ba0494bd4cba.png){width=17.00cm}



## DGM-22 — Customer Application Architecture

Label: **VERIFIED (prototype) / PROPOSED (production)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/58b24d28fb4c.png){width=17.00cm}



## DGM-23 — Order Processing Architecture

Label: **VERIFIED (logic) / PROPOSED (server)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/5e2c4bc1159d.png){width=17.00cm}



## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |