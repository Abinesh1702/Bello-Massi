# Bellomassi — Application Workflow Documentation

| | |
|---|---|
| **Product** | Bellomassi Order-to-Delivery Platform (frozen & chilled food distribution) |
| **Document set** | Complete Application Workflow Documentation |
| **Version** | 1.0 · prepared from the source code of `bellomassi-premium-ui` (application data version 8) |
| **Audience** | Business users, client stakeholders, trainers, testers and developers |

This folder documents how the application **actually works today**. Every workflow, status, rule and message was taken
from the source code (`src/config`, `src/services`, `src/pages`, `src/routes`). Nothing in these documents changes the
application — no code, route, UI or LocalStorage structure was modified to produce them.

## How to read these documents

Each chapter has two layers:

- **Business explanation** — plain English: who does what, in which order, and why.
- **Technical reference** — the route, page component, service function, permission key and LocalStorage key behind
  each step, so a developer or tester can find it in the code.

## Implementation status legend

Every feature is classified with one of these labels. The label describes what the code really does, not what a menu
item suggests.

| Label | Meaning |
|---|---|
| **Implemented** | Works end to end in the browser; data is saved to LocalStorage and the rules are enforced by a service. |
| **Partially Implemented** | The main flow works but part of the business process is not built (the gap is named). |
| **Simulated** | Behaves realistically for a demo but no external system is involved (e.g. DEMO GPS, demo OTP, demo email). |
| **UI Only** | A screen or control exists but it does not change any data. |
| **Coming Soon** | Shown in the app as a placeholder for a later phase. |
| **Not Implemented** | The business step does not exist in the application. |
| **Not Verified** | Exists in code but its behaviour could not be confirmed with a live provider (e.g. backend gateway mode). |

## Chapters

| # | File | What it covers |
|---|---|---|
| 01 | [Application Overview](01-Application-Overview.md) | Purpose, apps, roles, modules, technology, data storage, simulations |
| 02 | [Overall Workflow](02-Overall-Workflow.md) | End-to-end business flow with the master flowchart and swimlane |
| 03 | [Login-Wise Workflow](03-Login-Wise-Workflow.md) | Sign-in pages, demo accounts, landing pages, session, lockout, password reset, sign-out |
| 04 | [Role-Wise Workflow](04-Role-Wise-Workflow.md) | All 13 roles: dashboard, menus, KPIs, actions, daily routine, limits, hand-offs |
| 05 | [Module-Wise Workflow](05-Module-Wise-Workflow.md) | Every module with the 17 standard headings |
| 06 | [Order-to-Delivery Workflow](06-Order-to-Delivery-Workflow.md) | The core process from order capture to delivery note and invoice |
| 07 | [Approval Workflow](07-Approval-Workflow.md) | Order approval, return and rejection; scrap and replenishment approvals; document review |
| 08 | [Driver Workflow](08-Driver-Workflow.md) | Driver app: today, start, arrive, OTP, proof of delivery, failure |
| 09 | [Customer Workflow](09-Customer-Workflow.md) | Customer app: catalog, cart, order, tracking, OTP, notes, invoices |
| 10 | [Inventory Workflow](10-Inventory-Workflow.md) | Receipts, transfers, adjustments, movements, low stock, scrap, replenishment |
| 11 | [Dispatch & VMS Workflow](11-Dispatch-VMS-Workflow.md) | Dispatch planning, assignment, confirmation, tracking, exceptions, vehicle/driver compliance |
| 12 | [Finance & Invoice Workflow](12-Finance-Invoice-Workflow.md) | Invoice templates, numbering, generation, cancellation, credit |
| 13 | [Communication & Documents Workflow](13-Communication-Documents-Workflow.md) | Email, WhatsApp, automation, call history, notifications, documents and OCR |
| 14 | [Reports & Dashboard Workflow](14-Reports-Dashboard-Workflow.md) | Role dashboards, period filter, Reports Center (118 reports), AI & Jarvis |
| 15 | [Exception Workflow](15-Exception-Workflow.md) | Every exception path and how it is resolved |
| 16 | [Role Responsibility Matrix](16-Role-Responsibility-Matrix.md) | Who creates, approves, views each record; permission matrix |
| 17 | [Status Lifecycle](17-Status-Lifecycle.md) | Every status set with its exact values and state diagrams |
| 18 | [Screen-Wise User Guide](18-Screen-Wise-User-Guide.md) | Every screen in simple English |
| 19 | [Glossary](19-Glossary.md) | Business and technical terms |

## Master flowcharts

The twelve master flowcharts are located as follows:

| # | Flowchart | Chapter |
|---|---|---|
| 1 | Complete application workflow | 02 |
| 2 | Login-wise workflow | 03 |
| 3 | Order-to-delivery workflow | 06 |
| 4 | Approval workflow | 07 |
| 5 | Driver workflow | 08 |
| 6 | Customer workflow | 09 |
| 7 | Inventory workflow | 10 |
| 8 | Dispatch / VMS workflow | 11 |
| 9 | Finance / invoice workflow | 12 |
| 10 | Communication workflow | 13 |
| 11 | Reports workflow | 14 |
| 12 | Exception workflow | 15 |

The swimlane diagram for Sales, Sales Manager, Warehouse/Customer Service, Dispatch, Driver, Customer and Finance is in
chapter 02 (section 2.3) and repeated for the order lifecycle in chapter 06.

## Consolidated editions

The same content is published as one document in three formats, in `docs/workflow/dist/`:

- `Bellomassi-Workflow-Documentation.html` — single page, diagrams rendered, printable
- `Bellomassi-Workflow-Documentation.pdf` — cover page, table of contents, headers, footers and page numbers
- `Bellomassi-Workflow-Documentation.docx` — Word edition with the same structure

The diagrams are written in Mermaid. They render directly on GitHub, GitLab and in VS Code's Markdown preview, and are
pre-rendered as images in the consolidated editions.
