"""Project-management, risk and handover workbooks: PM-002 WBS, PM-003 deliverables, PM-004 resources/RACI, PM-005 registers,
RSK-002 risk register, HND-002 deliverables checklist, HND-010 known issues register."""
import xlsxlib
E = 'ESTIMATE'
# ---------- PM-002 WBS (effort in person-weeks, estimates)
wbs = [
 ('1', 'Phase 1 — Prototype', '', 'Complete (VERIFIED: prototype exists)', '', ''),
 ('1.1', 'Workflow prototype (React / LocalStorage)', 'Frontend', 'Complete', '—', 'Actual effort not recorded — NOT VERIFIED'),
 ('1.2', 'A–Z documentation package', 'Documentation', 'Draft delivered for review', '—', 'This package'),
 ('2', 'Phase 2 — Backend', '', 'Not started', '', ''),
 ('2.1', 'Architecture, environments, CI/CD set-up', 'DevOps / Architect', 'Not started', '3', E),
 ('2.2', 'Data model and migrations (PostgreSQL)', 'Backend', 'Not started', '4', E),
 ('2.3', 'Authentication, users, RBAC, audit', 'Backend', 'Not started', '4', E),
 ('2.4', 'Masters API (customers, products, hubs, zones, drivers, vehicles)', 'Backend', 'Not started', '4', E),
 ('2.5', 'Order, approval, credit, consolidation services', 'Backend', 'Not started', '6', E),
 ('2.6', 'Dispatch, assignment, delivery, OTP, POD, delivery note services', 'Backend', 'Not started', '6', E),
 ('2.7', 'Web app integration (replace browser services with API clients)', 'Frontend', 'Not started', '8', E),
 ('2.8', 'Unit / API tests', 'Backend / QA', 'Not started', '4', E),
 ('3', 'Phase 3 — Mobile and integrations', '', 'Not started', '', ''),
 ('3.1', 'React Native driver app (screens, offline, camera, signature)', 'Mobile', 'Not started', '9', E),
 ('3.2', 'GPS tracking + WebSockets (Channels, Redis)', 'Backend / Mobile', 'Not started', '4', E),
 ('3.3', 'Maps / Routes integration', 'Backend', 'Not started', '2', E),
 ('3.4', 'SMS / WhatsApp provider (OTP, delivery note)', 'Backend', 'Not started', '3', E),
 ('3.5', 'Email provider', 'Backend', 'Not started', '1', E),
 ('3.6', 'Customer app (if confirmed — X-01)', 'Mobile / Frontend', 'Pending confirmation', '6', E),
 ('4', 'Phase 4 — Production deployment', '', 'Not started', '', ''),
 ('4.1', 'System, regression and accessibility testing', 'QA', 'Not started', '4', E),
 ('4.2', 'Security testing and hardening, pen test', 'Security', 'Not started', '2', E),
 ('4.3', 'Performance testing', 'QA / DevOps', 'Not started', '1', E),
 ('4.4', 'Data migration (master data)', 'Data', 'Not started', '2', E),
 ('4.5', 'UAT support and training', 'BA / Trainer', 'Not started', '3', E),
 ('4.6', 'Go-live and hypercare', 'All', 'Not started', '3', E),
 ('5', 'Phase 5 — Enhancements', '', 'Not started', '', ''),
 ('5.1', 'SAP integration (stage 2)', 'Integration', 'Pending confirmation', 'TBD', 'Needs SAP interface specification'),
 ('5.2', 'Confirmed extensions (X-02 … X-11)', 'Various', 'Pending confirmation', 'TBD', 'Per change request'),
 ('6', 'Project management and BA (all phases)', 'PM / BA', 'Ongoing', '15% of delivery effort', E),
]
# ---------- PM-003 deliverables
deliv = [
 ('D-01', 'Workflow prototype (web, driver, customer layouts)', 'Phase 1', 'Delivered (prototype exists)', 'Not accepted — no client acceptance recorded'),
 ('D-02', 'Workflow documentation (docs/workflow)', 'Phase 1', 'Delivered (existing)', 'Not accepted'),
 ('D-03', 'A–Z documentation package', 'Phase 1', 'Draft for review', 'Not accepted'),
 ('D-04', 'Signed BRD and SOW baseline', 'Gate G0', 'Pending', 'Pending client'),
 ('D-05', 'Backend API and database', 'Phase 2', 'Not started', '—'),
 ('D-06', 'Integrated web application', 'Phase 2', 'Not started', '—'),
 ('D-07', 'React Native driver app (Android / iOS)', 'Phase 3', 'Not started', '—'),
 ('D-08', 'Integrations: maps, SMS / WhatsApp, email', 'Phase 3', 'Not started', '—'),
 ('D-09', 'Test reports and UAT sign-off', 'Phase 4', 'Not started', '—'),
 ('D-10', 'Production environment and go-live', 'Phase 4', 'Not started', '—'),
 ('D-11', 'Training and user manuals (final)', 'Phase 4', 'Drafts exist (this package)', '—'),
 ('D-12', 'Handover package (source, configuration, runbooks)', 'Phase 4', 'Drafts exist (this package)', '—'),
 ('D-13', 'SAP integration', 'Phase 5', 'Pending confirmation', '—'),
]
# ---------- PM-004 resources and RACI
res = [
 ('Project Manager', '1', 'All phases', 'Plan, risks, reporting, client communication', E),
 ('Business Analyst', '1', 'Phases 2–4', 'Requirements, acceptance criteria, UAT', E),
 ('Solution Architect', '0.5', 'Phases 2–3', 'Architecture, reviews, integrations', E),
 ('Backend developers (Django)', '2', 'Phases 2–4', 'API, services, integrations', E),
 ('Frontend developer (React)', '1', 'Phases 2–4', 'Web app integration', E),
 ('Mobile developer (React Native)', '1–2', 'Phases 3–4', 'Driver app (and customer app if confirmed)', E),
 ('QA engineers', '1–2', 'Phases 2–4', 'Test design, automation, execution', E),
 ('DevOps engineer', '0.5', 'Phases 2–4', 'Infrastructure, CI/CD, monitoring', E),
 ('UX designer', '0.5', 'Phases 2–3', 'Zone board, mobile app design', E),
 ('Client sponsor / key users', 'TBD', 'All phases', 'Decisions, UAT, acceptance', 'PENDING CONFIRMATION'),
]
R = ['Client Sponsor', 'Project Manager', 'Business Analyst', 'Architect', 'Dev Team', 'QA', 'DevOps', 'Client IT', 'Client Key Users']
raci = [
 ('Approve scope (BRD / SOW)', 'A', 'R', 'C', 'C', 'I', 'I', 'I', 'C', 'C'),
 ('Hosting and provider decisions', 'A', 'R', 'I', 'C', 'I', 'I', 'C', 'R', 'I'),
 ('Requirements and acceptance criteria', 'C', 'A', 'R', 'C', 'C', 'C', 'I', 'I', 'C'),
 ('Architecture and design', 'I', 'A', 'C', 'R', 'C', 'C', 'C', 'C', 'I'),
 ('Development', 'I', 'A', 'C', 'C', 'R', 'C', 'C', 'I', 'I'),
 ('Testing (system)', 'I', 'A', 'C', 'I', 'C', 'R', 'C', 'I', 'I'),
 ('Infrastructure and deployment', 'I', 'A', 'I', 'C', 'C', 'C', 'R', 'C', 'I'),
 ('Data migration', 'I', 'A', 'R', 'C', 'R', 'C', 'C', 'R', 'C'),
 ('UAT', 'A', 'R', 'R', 'I', 'C', 'C', 'I', 'I', 'R'),
 ('Training', 'I', 'A', 'R', 'I', 'C', 'I', 'I', 'I', 'R'),
 ('Go-live decision', 'A', 'R', 'C', 'C', 'C', 'C', 'C', 'C', 'C'),
 ('Change requests', 'A', 'R', 'R', 'C', 'C', 'C', 'C', 'C', 'C'),
]
# ---------- PM-005 registers
issues = [
 ('ISS-01', 'Operating country / currency conflict: company profile UAE / AED, seed master data India (pincode, GSTIN, +91)', 'High', 'Open', 'Client', 'Confirm country, tax model and address format'),
 ('ISS-02', 'Order status model: SOW 8 statuses vs 13 in the prototype', 'Medium', 'Open', 'BA / Client', 'Agree mapping (BM-WF-17)'),
 ('ISS-03', 'Invoicing implemented although SOW says invoicing stays outside (X-02)', 'High', 'Open', 'Client', 'Confirm or retire module'),
 ('ISS-04', 'Extensions X-01 … X-11 beyond SOW not yet confirmed', 'High', 'Open', 'Client sponsor', 'Scope decision at gate G0'),
 ('ISS-05', 'Driver app is responsive web, SOW / GPS guide expect native app', 'Medium', 'Open', 'Architect', 'Confirm React Native for phase 3'),
 ('ISS-06', 'Customer cart line amount shows AED 0 (CustomerCart.jsx uses lineTotal; pricing returns totalAmount)', 'Low', 'Open', 'Dev team', 'Fix in next prototype or production build'),
 ('ISS-07', 'OpenWA is an unofficial WhatsApp client (terms / ban risk)', 'Medium', 'Open', 'Client', 'Choose official WhatsApp Business provider or SMS'),
 ('ISS-08', 'Credit policy: warn only vs block when credit exceeded', 'Medium', 'Open', 'Client finance', 'Decide setting'),
 ('ISS-09', 'Sales Manager change of approved quantity / value (G-01)', 'Medium', 'Open', 'Client', 'Confirm requirement'),
]
deps = [
 ('DEP-01', 'Signed scope baseline (BRD, SOW)', 'Client sponsor', 'Phase 2 start', 'Open'),
 ('DEP-02', 'Hosting decision and cloud account', 'Client IT', 'Environment set-up', 'Open'),
 ('DEP-03', 'Maps / Routes API account and billing', 'Client IT', 'Phase 3 tracking, routes', 'Open'),
 ('DEP-04', 'SMS / WhatsApp Business provider and approved templates', 'Client', 'OTP and delivery note sending', 'Open'),
 ('DEP-05', 'Email domain and provider (SPF / DKIM)', 'Client IT', 'Email notifications', 'Open'),
 ('DEP-06', 'Master data extracts (customers, products, prices, drivers, vehicles)', 'Client', 'Data migration', 'Open'),
 ('DEP-07', 'SAP interface specification and test system', 'Client SAP team', 'Phase 5', 'Open'),
 ('DEP-08', 'Driver phones (Android / iOS) and MDM policy', 'Client logistics', 'Driver app pilot', 'Open'),
 ('DEP-09', 'UAT users nominated and available', 'Client', 'UAT', 'Open'),
 ('DEP-10', 'Apple / Google developer accounts in client name', 'Client', 'Mobile store release', 'Open'),
]
decisions = [
 ('DEC-01', '2026-11-12', 'Documentation labels VERIFIED / PROTOTYPE / PROPOSED / PENDING CONFIRMATION / NOT IMPLEMENTED / NOT VERIFIED used throughout', 'Documentation team', 'Per documentation brief', 'Made'),
 ('DEC-02', '2026-11-12', 'Existing documents preserved; reused content referenced, not rewritten', 'Documentation team', 'Per documentation brief', 'Made'),
 ('DEC-03', '—', 'Approve scope including / excluding extensions X-01 … X-11', 'Client sponsor', '—', 'Pending'),
 ('DEC-04', '—', 'Hosting provider and region', 'Client IT', '—', 'Pending'),
 ('DEC-05', '—', 'Messaging channel for OTP and delivery note (SMS / WhatsApp provider)', 'Client', '—', 'Pending'),
 ('DEC-06', '—', 'Country, currency and tax model', 'Client', '—', 'Pending'),
 ('DEC-07', '—', 'Status model mapping (8 vs 13)', 'Client / BA', '—', 'Pending'),
 ('DEC-08', '—', 'Credit exceeded: warn or block', 'Client finance', '—', 'Pending'),
]
xlsxlib.write_book(dict(id='BM-PM-002', title='Work Breakdown Structure', folder='17', file='BM-PM-002_Work_Breakdown_Structure', category='Project Management',
    purpose='Break the remaining work into packages with indicative effort. Effort figures are ESTIMATES based on stated assumptions, not commitments.',
    scope='Phases 1–5. Assumes team as in BM-PM-004 and scope without unconfirmed extensions unless marked.', related=['BM-PM-001', 'BM-PLN-001', 'BM-PM-004'], references=['BM-PLN-001']), [
    dict(name='WBS', headers=['WBS ID', 'Work package', 'Team', 'Status', 'Effort (person-weeks)', 'Label / note'], rows=wbs, widths=[8, 60, 20, 30, 20, 40])])
xlsxlib.write_book(dict(id='BM-PM-003', title='Deliverables Matrix', folder='17', file='BM-PM-003_Deliverables_Matrix', category='Project Management',
    purpose='List project deliverables with phase, status and acceptance status. No deliverable has recorded client acceptance.', scope='All phases.', related=['BM-PM-001', 'BM-HND-002'], references=['BM-PLN-001']), [
    dict(name='Deliverables', headers=['ID', 'Deliverable', 'Phase / gate', 'Status', 'Acceptance'], rows=deliv, widths=[7, 55, 14, 30, 36])])
xlsxlib.write_book(dict(id='BM-PM-004', title='Resource Allocation and RACI Matrix', folder='17', file='BM-PM-004_Resources_and_RACI', category='Project Management',
    purpose='Proposed team for phases 2–4 (ESTIMATE) and project responsibility (RACI) matrix.', scope='Named persons are not assigned (PENDING CONFIRMATION).', related=['BM-PM-001', 'BM-PM-002', 'BM-OVW-010'], references=['BM-PLN-001']), [
    dict(name='Resources', headers=['Role', 'FTE', 'Period', 'Responsibilities', 'Label'], rows=res, widths=[30, 8, 14, 50, 22]),
    dict(name='RACI', headers=['Activity'] + R, rows=raci, widths=[38] + [13] * len(R))])
xlsxlib.write_book(dict(id='BM-PM-005', title='Issue, Dependency and Decision Registers', folder='17', file='BM-PM-005_Issue_Dependency_Decision_Registers', category='Project Management',
    purpose='Track open issues, external dependencies and decisions. Pending decisions are listed as pending — no client decision is recorded.', scope='Status as of 2026-11-12.',
    related=['BM-RSK-002', 'BM-DOC-003', 'BM-PM-007'], references=['BM-DOC-003 Gap Analysis']), [
    dict(name='Issues', headers=['Issue ID', 'Issue', 'Priority', 'Status', 'Owner', 'Next action'], rows=issues, widths=[8, 70, 9, 9, 16, 40], validations={3: ['Open', 'In progress', 'Closed']}),
    dict(name='Dependencies', headers=['Dep ID', 'Dependency', 'Provider', 'Needed for', 'Status'], rows=deps, widths=[8, 55, 18, 32, 9]),
    dict(name='Decision Log', headers=['Decision ID', 'Date', 'Decision', 'Decided by', 'Basis', 'Status'], rows=decisions, widths=[11, 11, 70, 20, 22, 10])])
# ---------- RSK-002 risk register
risks = [
 ('R-01', 'Scope', 'Unconfirmed extensions (X-01…X-11) enlarge scope, cost and timeline', 'High', 'High', 'Scope decision at G0; phase extensions to 5', 'PM', 'Open'),
 ('R-02', 'Requirements', 'Country / tax / currency ambiguity leads to rework', 'High', 'Medium', 'Decide before data model freeze', 'BA', 'Open'),
 ('R-03', 'Technical', 'Prototype rules re-implemented incorrectly on server', 'High', 'Medium', 'Rules catalogue BM-SYS-007; test cases from prototype behaviour', 'Architect', 'Open'),
 ('R-04', 'Technical', 'Background GPS on Android vendors kills app / battery drain', 'Medium', 'High', 'Native foreground service, device testing, adaptive interval', 'Mobile lead', 'Open'),
 ('R-05', 'Integration', 'Messaging provider / template approval delays OTP go-live', 'High', 'Medium', 'Start provider onboarding early; SMS fallback', 'Client', 'Open'),
 ('R-06', 'Integration', 'SAP interface not available or undefined', 'Medium', 'High', 'Keep SAP in phase 5; manual masters meanwhile', 'Client SAP', 'Open'),
 ('R-07', 'Data', 'Poor master data quality (addresses, zones, prices)', 'High', 'Medium', 'Data cleansing and validation reports before migration', 'Client', 'Open'),
 ('R-08', 'Adoption', 'Drivers resist app / OTP process', 'Medium', 'Medium', 'Pilot, training, simple UI, support on site', 'Client logistics', 'Open'),
 ('R-09', 'Security', 'Prototype used with real data or exposed publicly', 'High', 'Medium', 'Demo data only; restricted hosting; banner', 'Client IT', 'Open'),
 ('R-10', 'Security', 'Customer data / location privacy breach', 'High', 'Low', 'Server-side scope checks, tests, pen test', 'Security', 'Open'),
 ('R-11', 'Schedule', 'Client decision and UAT availability delays', 'Medium', 'High', 'Decision gates with dates; UAT plan agreed early', 'PM', 'Open'),
 ('R-12', 'Cost', 'Usage-based costs (maps, messages) higher than expected', 'Medium', 'Medium', 'Estimate after pilot; quotas and alerts', 'Client finance', 'Open'),
 ('R-13', 'Compliance', 'OpenWA unofficial WhatsApp use breaches terms', 'Medium', 'High', 'Official provider', 'Client', 'Open'),
 ('R-14', 'Operations', 'No support / hypercare arrangement defined', 'Medium', 'Medium', 'Agree support agreement BM-HND-014', 'PM', 'Open'),
 ('R-15', 'Quality', 'Prototype verification not independently reproducible (no tests in repository)', 'Medium', 'High', 'Automated test suites in phase 2', 'QA', 'Open'),
 ('R-16', 'Technical', 'Status model mismatch causes reporting / integration errors', 'Medium', 'Medium', 'Agree mapping before API design', 'BA', 'Open'),
]
xlsxlib.write_book(dict(id='BM-RSK-002', title='Project Risk Register', folder='18', file='BM-RSK-002_Project_Risk_Register', category='Risk and Change Management',
    purpose='Project risks with impact, likelihood, mitigation and owner. Security-specific risks are in BM-SEC-012.', scope='Status as of 2026-11-12; ratings are the documentation team\'s assessment — to be reviewed with the client.',
    related=['BM-RSK-001', 'BM-SEC-012', 'BM-PM-005'], references=['BM-DOC-003 Gap Analysis']), [
    dict(name='Risks', headers=['Risk ID', 'Category', 'Risk', 'Impact', 'Likelihood', 'Mitigation', 'Owner', 'Status'], rows=risks, widths=[7, 13, 55, 8, 10, 50, 15, 8],
         validations={3: ['High', 'Medium', 'Low'], 4: ['High', 'Medium', 'Low'], 7: ['Open', 'Mitigating', 'Closed']})])
# ---------- HND-002 deliverables checklist
hd = [[d[0], d[1], d[2], d[3], '☐', '', ''] for d in deliv] + [
 ['H-01', 'Source code repository access transferred', 'Handover', 'Pending', '☐', '', ''], ['H-02', 'Documentation package (this)', 'Handover', 'Draft', '☐', '', ''],
 ['H-03', 'Configuration and secrets inventory (no secret values in documents)', 'Handover', 'Pending (production)', '☐', '', ''], ['H-04', 'Runbooks (deployment, rollback, backup)', 'Handover', 'Drafts exist', '☐', '', ''],
 ['H-05', 'Training records', 'Handover', 'Not started', '☐', '', ''], ['H-06', 'Known issues and limitations accepted', 'Handover', 'Pending', '☐', '', '']]
xlsxlib.write_book(dict(id='BM-HND-002', title='Project Deliverables Checklist (Handover)', folder='19', file='BM-HND-002_Deliverables_Checklist', category='Client Handover',
    purpose='Checklist used at handover to confirm each deliverable has been received. All boxes are unticked — no handover has taken place.', scope='Prototype and future production deliverables.',
    related=['BM-HND-001', 'BM-PM-003'], references=['BM-PM-003 Deliverables Matrix']), [
    dict(name='Checklist', headers=['ID', 'Deliverable', 'Phase', 'Current status', 'Received (client)', 'Received by', 'Date'], rows=hd, widths=[7, 60, 12, 30, 14, 20, 12])])
# ---------- HND-010 known issues register
ki = [
 ('KI-01', 'Customer app — Cart', 'Each cart line shows "AED 0"; subtotal, tax and total are correct', 'src/pages/customer/CustomerCart.jsx:64 reads it.lineTotal but pricing returns totalAmount', 'Low', 'Read the totals at the bottom', 'VERIFIED (screenshot 2026-11-12)'),
 ('KI-02', 'Code quality', 'Lint passes with about 20 warnings (React compiler memoisation, fast-refresh exports, impure Date in render)', 'oxlint output 2026-11-12', 'Low', '—', 'VERIFIED'),
 ('KI-03', 'Master data', 'Seed data in India format (pincode, GSTIN / PAN, +91) while organisation defaults are UAE / AED', 'Seed modules vs runtimeConfig ORG_DEFAULTS', 'Medium', 'Treat as demo data', 'VERIFIED'),
 ('KI-04', 'Reports', '24 of 118 reports show "No source data" (payments, credit notes, expenses, fuel, maintenance, batches, cycle counts, returns)', 'FINALISATION.md §6', 'Low', 'By design in prototype', 'VERIFIED'),
 ('KI-05', 'Tracking', 'Positions and ETAs simulated (DEMO GPS)', 'utils/demoGeo.js', 'Medium', 'Labelled in UI', 'PROTOTYPE'),
 ('KI-06', 'OTP / delivery note', 'OTP and delivery note not sent by SMS / WhatsApp / email', 'otpService, deliveryNoteService', 'High (for production)', 'OTP shown in customer app', 'PROTOTYPE'),
 ('KI-07', 'Storage', 'Data only in one browser (~5 MB); photos / signatures downscaled; no sharing between devices', 'storageService', 'High (for production)', 'Single-browser demos', 'PROTOTYPE'),
 ('KI-08', 'Security', 'Client-side authentication; demo passwords shown on sign-in screen', 'authService, Login.jsx', 'High (for production)', 'Do not use real data', 'PROTOTYPE'),
 ('KI-09', 'Customer app', 'Customer cannot cancel or edit placed orders; no online payment', 'customerAppService', 'Medium', 'Through sales team', 'NOT IMPLEMENTED'),
 ('KI-10', 'Dispatch', 'Zone drag-and-drop board not implemented (zone chosen in form)', 'Gap G-03', 'Medium', 'Use planning list', 'NOT IMPLEMENTED'),
 ('KI-11', 'Approval', 'Sales Manager cannot change approved quantity / value (return instead)', 'Gap G-01', 'Medium', 'Return for correction', 'PENDING CONFIRMATION'),
 ('KI-12', 'Notifications', 'Finance not notified on approval / credit exceeded', 'Gap G-02', 'Medium', 'Finance checks dashboard', 'NOT IMPLEMENTED'),
 ('KI-13', 'Fonts', 'Inter font loaded from Google Fonts; offline / restricted networks fall back to system font', 'index.html / CSS', 'Low', '—', 'VERIFIED'),
 ('KI-14', 'Supplier portal', 'Read-only; suppliers cannot accept requests or submit invoices', 'Workflow ch. 04 §4.13', 'Low', '—', 'NOT IMPLEMENTED'),
 ('KI-15', 'Order channel', 'Channel (call / email / WhatsApp) not captured for office orders', 'Gap G-12', 'Low', 'Use notes', 'NOT IMPLEMENTED'),
 ('KI-16', 'Status model', '13 prototype order statuses vs 8 in SOW', 'BM-WF-17', 'Medium', '—', 'PENDING CONFIRMATION'),
]
xlsxlib.write_book(dict(id='BM-HND-010', title='Known Issues Register', folder='19', file='BM-HND-010_Known_Issues_Register', category='Client Handover',
    purpose='Known defects and limitations of the delivered prototype with evidence and workaround.', scope='Prototype data version 8 as reviewed 2026-11-12.', related=['BM-HND-011', 'BM-DOC-003', 'BM-PM-005'],
    references=['docs/FINALISATION.md §14', 'BM-DOC-003 Gap Analysis']), [
    dict(name='Known Issues', headers=['KI ID', 'Area', 'Issue', 'Evidence / location', 'Severity', 'Workaround', 'Label'], rows=ki, widths=[7, 18, 55, 45, 16, 26, 26], label_col=6)])
print('pm ok')
