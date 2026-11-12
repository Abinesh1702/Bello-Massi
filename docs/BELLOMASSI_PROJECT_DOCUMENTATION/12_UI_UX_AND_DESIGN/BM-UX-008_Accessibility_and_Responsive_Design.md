# Accessibility and Responsive Design Guidelines

## Document control

| Field | Value |
|---|---|
| Document title | Accessibility and Responsive Design Guidelines |
| Document ID | BM-UX-008 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | UI/UX and Design |
| Related module(s) | All modules |
| Document owner | UX Designer |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define accessibility and responsive-layout requirements and record the prototype's current state.

## Scope

Target WCAG 2.2 AA (PROPOSED). Current conformance NOT VERIFIED — no accessibility audit has been carried out.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-UX-002 — Design System and Style Guide](BM-UX-002_Design_System_and_Style_Guide.md)
- [BM-QA-001 — Test Strategy](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-001_Test_Strategy.md)

## 1. Current state (prototype)

| Item | Observation | Label |
|---|---|---|
| ARIA usage | `aria-*` attributes used in about 150 source files (icons hidden, labels on icon buttons) | VERIFIED (presence only) |
| Form labels | Inputs rendered with visible `<label>` and required markers | VERIFIED |
| Status colours | Always with text badges | VERIFIED |
| Dark mode | Available | VERIFIED |
| Keyboard navigation, focus order, screen reader | Not tested | NOT VERIFIED |
| Colour contrast | Tokens chosen for contrast; not measured on every screen | NOT VERIFIED |
| RTL / Arabic | Not supported | NOT IMPLEMENTED |

## 2. Requirements — PROPOSED

| ID | Requirement |
|---|---|
| A11Y-01 | Text contrast ≥ 4.5:1, large text and UI components ≥ 3:1 in both themes |
| A11Y-02 | All functions usable by keyboard; visible focus; logical tab order; skip link |
| A11Y-03 | Every input has a programmatic label and error message association |
| A11Y-04 | Icons-only buttons have accessible names |
| A11Y-05 | Tables have header cells; charts have text summaries |
| A11Y-06 | Dialogs trap focus and return focus on close |
| A11Y-07 | Touch targets ≥ 44 × 44 px on mobile |
| A11Y-08 | Respect reduced-motion preference |
| A11Y-09 | Language and direction attributes; RTL layout if Arabic is in scope (PENDING CONFIRMATION) |

## 3. Responsive breakpoints (Tailwind defaults, VERIFIED in layouts)

| Width | Behaviour |
|---|---|
| < 640 px | Single column; driver / customer apps designed for this width |
| 640–1023 px | Sidebar becomes drawer (MobileSidebar); tables scroll horizontally |
| ≥ 1024 px | Fixed sidebar (collapsible); multi-column dashboards |
| ≥ 1480 px | Content width capped |

## 4. Testing approach

Automated checks (axe) in E2E tests, manual keyboard and screen-reader pass (NVDA / VoiceOver) on key journeys, and
device testing on representative Android phones for the driver app — see [BM-QA-001 — Test Strategy](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-001_Test_Strategy.md).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |