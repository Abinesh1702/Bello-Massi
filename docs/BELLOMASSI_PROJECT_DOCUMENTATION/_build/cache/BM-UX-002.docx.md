---
title: "Design System and Style Guide"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-UX-002 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Design System and Style Guide |
| Document ID | BM-UX-002 |
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

Record the visual design tokens and reusable components used by the prototype so that production work keeps the same look.

## Scope

Tokens from src/styles/index.css and components in src/components/common (VERIFIED).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- src/styles/index.css
- src/components/common/*.jsx
- **BM-UX-001** (UI/UX Design Document)
- **BM-UX-008** (Accessibility and Responsive Design Guidelines)
- **BM-UX-009** (UI Content, Messages and Status Display Standards)

## 1. Colour tokens (VERIFIED)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | #232B5F | #9AA7F2 | Brand navy: primary buttons, headings accents |
| `--brand-2` | #34427A | #B4BDF6 | Hover / secondary brand |
| `--accent` | #F5A623 | #F5A623 | Amber accent: highlights, demo badge |
| `--canvas` | #F4F6FA | #0B0F1E | Page background |
| `--surface` | #FFFFFF | #131830 | Cards, tables |
| `--ink` / `--ink-2` | #111827 / #374151 | #E8EBF6 / #C9CEE3 | Text |
| `--muted` | #64748B | #949FBD | Secondary text |
| `--line` / `--line-strong` | #E4E8F0 / #CFD6E3 | #262D4C / #353D62 | Borders |
| `--success` | #15803D | #34C27A | Delivered, approved, verified |
| `--warning` | #B45309 | #F2B14B | Pending, expiring, warnings |
| `--danger` | #DC2626 | #F06A6A | Rejected, failed, blocked |
| `--info` | #2563EB | #6AA0FF | Information, in progress |
| `--sidebar` | #1C2350 | #0E1226 | Sidebar background |
| `--chart-1..5` | #2A78D6, #EB6834, #1BAF7A, #EDA100, #E87BA4 | stepped for dark | Chart series (validated palette) |

Status colours carry meaning only; they are always paired with a text label (badge), never colour alone.

## 2. Typography and shape

| Item | Value |
|---|---|
| Font | Inter, fallback system UI (loaded from Google Fonts; system font used when offline) |
| Radius | 6 px (small), 8 px (default), 12 px (large cards) |
| Content width | max 1480 px |
| Focus ring | `--ring` (navy 25 %) |
| Themes | Light and Dark (toggle in header; stored per browser) |

## 3. Components (VERIFIED — src/components/common)

| Component | Use |
|---|---|
| Button | Primary, secondary, ghost, danger variants; loading state |
| Input, Select, Textarea, Checkbox, Toggle | Form controls with label, required marker, error text |
| FormSection | Titled group of fields |
| Card, InfoList | Content containers and key-value lists |
| DataTable | Sortable / paged tables with row actions (RowActions) |
| FilterToolbar | Search and filters above tables |
| Badge | Status labels (colour + text) |
| Tabs | Section switching |
| Modal, ConfirmDialog | Dialogs; confirmation before destructive actions |
| Timeline | Order / dispatch history |
| EmptyState, LoadingSpinner, NotFoundRecord, ErrorBoundary | States |
| PageHeader | Title, description, primary actions |
| Avatar, Logo | Identity |

Layout components: AppLayout, DriverLayout, CustomerLayout, Sidebar, Header, Breadcrumbs, GlobalSearch, NotificationCenter,
ProfileMenu, PrototypeBadge, SessionWatcher. Dashboard building blocks are in `src/components/dashboard` (KPI cards, period
filter with comparison).

## 4. Production guidance — PROPOSED

Keep the tokens as the single source; share them with the React Native app (same names) so web and mobile match; add
RTL-aware spacing utilities if Arabic is required.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |