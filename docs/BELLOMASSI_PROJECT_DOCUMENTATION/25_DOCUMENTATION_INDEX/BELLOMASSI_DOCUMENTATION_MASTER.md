# Bellomassi Documentation Master

## Document control

| Field | Value |
|---|---|
| Document title | Bellomassi Documentation Master |
| Document ID | BM-IDX-002 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Documentation Index |
| Related module(s) | All modules |
| Document owner | Documentation Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Explain how the Bellomassi documentation repository is organised, named, versioned, cross-referenced and maintained.

## Scope

All documents in BELLOMASSI_PROJECT_DOCUMENTATION (this package) and their relation to the existing documents in docs/.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-IDX-001 — Bellomassi Documentation Index](BELLOMASSI_DOCUMENTATION_INDEX.xlsx)
- [BM-IDX-003 — Documentation Coverage Map (Brief to Documents)](BM-IDX-003_Documentation_Coverage_Map.xlsx)
- [BM-DOC-001 — Existing Documentation Review and Inventory](../23_DOCUMENT_CONTROL/BM-DOC-001_Existing_Documentation_Review.md)
- [BM-DOC-002 — Document Inventory](../23_DOCUMENT_CONTROL/BM-DOC-002_Document_Inventory.xlsx)
- [BM-DOC-003 — Gap Analysis — Scope of Work, Prototype and Documentation](../23_DOCUMENT_CONTROL/BM-DOC-003_Gap_Analysis.md)
- [BM-DOC-004 — Document Control Procedure](../23_DOCUMENT_CONTROL/BM-DOC-004_Document_Control_Procedure.md)

## Contents

- 1. Folder structure
- 2. Naming conventions
- 3. Formats
- 4. Document status and labels
- 5. Version control
- 6. Cross-references
- 7. Maintenance process
- 8. Existing documents

## 1. Folder structure

| Folder | Content |
|---|---|
| 01_PROJECT_OVERVIEW | Overview, vision, problem, benefits, stakeholders, feature catalogue and inventory, status summary |
| 02_BUSINESS_REQUIREMENTS | BRD, Scope of Work, business requirement traceability |
| 03_SYSTEM_REQUIREMENTS | SRD, SRS, consolidated FRD, NFR, constraints, assumptions, business rules, RTM, change log |
| 04_FUNCTIONAL_REQUIREMENTS | One FRD per module (35) |
| 05_SCOPE_AND_PLANNING | Phase plan and phase-wise scope matrix |
| 06_BUSINESS_WORKFLOWS | Workflow catalogue and 24 workflows with diagrams |
| 07_SYSTEM_ARCHITECTURE | HLD, LLD, architecture diagrams |
| 08_DATABASE_AND_DATA_DESIGN | Prototype data model, proposed database, data dictionary, migration, retention, storage dictionary |
| 09_API_AND_INTEGRATION | API specification, endpoint catalogue, 15 domain API designs, OpenAPI draft (YAML), integration specification |
| 10_SECURITY_AND_COMPLIANCE | Security requirements, architecture, auth, RBAC, policies, incident response, testing, RBAC matrix, risk register |
| 11_INFRASTRUCTURE_AND_DEVOPS | Stack, hosting comparison, infrastructure, cost estimate, environments, Docker, CI/CD, monitoring, backup / DR, scaling |
| 12_UI_UX_AND_DESIGN | UI/UX design, design system, sitemap, screen inventory, screen specifications, screenshot gallery, mobile UX, accessibility, content standards |
| 13_TESTING_AND_QUALITY_ASSURANCE | Strategy, plan, UAT plan, defect process, report templates, scenarios and test cases |
| 14_DEPLOYMENT_AND_RELEASE | Release process, deployment guide, release notes, go-live, rollback, verification, setup guides, versioning, checklists |
| 15_USER_MANUALS | Driver, customer and office manuals, 14 role manuals, role responsibility matrix |
| 16_ADMINISTRATION_AND_CONFIGURATION | Administration guide, configuration reference, master data, maintenance |
| 17_PROJECT_MANAGEMENT | Plan, WBS, deliverables, resources / RACI, registers, templates, status report, closure template |
| 18_RISK_AND_CHANGE_MANAGEMENT | Risk plan, risk register, change process, impact analysis |
| 19_CLIENT_HANDOVER | Handover, acceptance, sign-off forms (blank), technical / source / configuration handover, known issues, limitations, pending requirements, support drafts |
| 20_FUTURE_ROADMAP | Master roadmap and track roadmaps |
| 21_DIAGRAMS_AND_VISUAL_DOCUMENTATION | Diagram catalogue; `mermaid/` sources, `svg/` and `png/` renders |
| 22_GLOSSARY_AND_REFERENCE | Glossary, acronyms, quick reference |
| 23_DOCUMENT_CONTROL | Existing-document review, document inventory, gap analysis, document control procedure |
| 24_PROJECT_PRESENTATION | Project presentation (PPTX) and speaker notes |
| 25_DOCUMENTATION_INDEX | This master file, the documentation index (XLSX) and the requirement coverage map |
| _build | Sources (Markdown with front matter), data extracted from the code, generators and build scripts |

## 2. Naming conventions

| Item | Convention | Example |
|---|---|---|
| Document ID | `BM-<CATEGORY>-<NNN>` (FRDs use the module code, workflows `WF-NN`, role manuals `MAN-1NN`) | BM-SEC-005, BM-FRD-ORD, BM-WF-08 |
| File name | `<Document ID>_<Title_With_Underscores>.<ext>` | BM-QA-011_Functional_Test_Cases.xlsx |
| Index files | Fixed names required by the brief | BELLOMASSI_DOCUMENTATION_INDEX.xlsx |
| Requirement IDs | BR-NNN, FR-<MOD>-NNN, NFR-<AREA>-NNN, RULE-NNN | FR-OTP-003 |
| Test IDs | TS-NNN scenarios, TC-<MOD>-NNN, TC-X-NNN, UAT-NN | TC-DSP-004 |
| Screens | SCR-NNN (screen inventory), UX-<NAME> (screenshots) | SCR-042 |
| Other | G-NN gaps, X-NN extensions, KI-NN known issues, R-NN risks, ISS / DEP / DEC registers | KI-01 |

Category codes: OVW, BRD, SOW, SYS, FRD, PLN, WF, ARC, DAT, API, SEC, INF, UX, QA, DEP, MAN, ADM, PM, RSK, HND, RMP,
DGM, GLO, DOC, PRS, IDX.

## 3. Formats

Each Markdown source produces a `.md` (repository reference, relative links) and a `.docx` (business / technical
editing). Client-ready documents also produce a `.pdf` (cover page, header with ID and version). Matrices, registers,
estimates and test cases are `.xlsx` with a *Document Control* sheet. Diagrams are Mermaid sources with SVG / PNG renders.

## 4. Document status and labels

| Field | Values |
|---|---|
| Status | Draft — for client review (all documents in this release) → Reviewed → Approved → Superseded |
| Reviewed by | Pending until a named reviewer reviews the document |
| Approval | Not approved — no client approval exists for any document; signature fields are blank |
| Content labels | VERIFIED, PROTOTYPE, PROPOSED, PENDING CONFIRMATION, NOT IMPLEMENTED, NOT VERIFIED |
| Feature classification | Implemented and working · Implemented with limitations · UI-only · Simulated · Partially implemented · Planned · Not implemented · Not verified |

## 5. Version control

- Version `MAJOR.MINOR`: 1.0 for this first release; minor increment for edits; major increment when a document is approved.
- Every document has a control block (ID, version, status, prepared / reviewed / approval, dates) and a revision history table.
- Sources live in `_build/src/<folder>/*.md`; keep them under Git together with the generators; generated files are rebuilt, not edited by hand.

## 6. Cross-references

References between documents use document IDs. In sources they are written as `{{ref:<ID>}}` and resolved at build time
into links (Markdown) or "ID — Title" text (DOCX / PDF). The build fails on unknown IDs. Each document also lists
*Related documents* in its control block. Requirement traceability runs BR → FR → TC in [BM-SYS-008 — Requirement Traceability Matrix](../03_SYSTEM_REQUIREMENTS/BM-SYS-008_Requirement_Traceability_Matrix.xlsx) and
[BM-BRD-002 — Business Requirement Traceability](../02_BUSINESS_REQUIREMENTS/BM-BRD-002_Business_Requirement_Traceability.xlsx); brief-to-document coverage in [BM-IDX-003 — Documentation Coverage Map (Brief to Documents)](BM-IDX-003_Documentation_Coverage_Map.xlsx).

## 7. Maintenance process

1. Change the Markdown source (or the data file for generated documents) in `_build`.
2. Run the generators that apply (`gen_*.py`), then `python3 copy_shots.py` and `python3 build.py` (add `--no-pdf` for a quick check).
3. Run `python3 gen_idx.py` to refresh the inventory, index and coverage map.
4. Increase the version, add a revision-history line, update status.
5. Record the change in [BM-DOC-002 — Document Inventory](../23_DOCUMENT_CONTROL/BM-DOC-002_Document_Inventory.xlsx) / [BM-SYS-009 — Requirement Change Log](../03_SYSTEM_REQUIREMENTS/BM-SYS-009_Requirement_Change_Log.xlsx) as applicable.
6. Procedure details: [BM-DOC-004 — Document Control Procedure](../23_DOCUMENT_CONTROL/BM-DOC-004_Document_Control_Procedure.md).

Build requirements: Python 3 with PyYAML, openpyxl, pypdf, Pillow; pandoc; Node with Playwright (PDF and screenshots);
Mermaid CLI.

## 8. Existing documents

Documents that existed before this package (README, docs/FINALISATION.md, RBAC_AND_ADMINISTRATION.md,
INTEGRATION_GATEWAY.md, UI_DESIGN_SYSTEM.md, docs/workflow) are preserved unchanged and referenced; see
[BM-DOC-001 — Existing Documentation Review and Inventory](../23_DOCUMENT_CONTROL/BM-DOC-001_Existing_Documentation_Review.md).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |