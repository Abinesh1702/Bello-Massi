const pptxgen = require('pptxgenjs');
const { applyTheme } = require('/root/.claude/skills/synced/9f89280b-a498-411b-ab1b-ab9200961afc_3f25c1d5-ebac-42d6-bd77-87e8eea304e2/pptx/scripts/apply_theme.js');
const path = require('path');
const SHOTS = path.resolve(__dirname, '../shots');
const OUT = process.argv[2];
const THEME = { name: 'Bellomassi', headFontFace: 'Cambria', bodyFontFace: 'Calibri',
  colors: { dk1: '1C2350', lt1: 'FFFFFF', dk2: '374151', lt2: 'F4F6FA', accent1: '232B5F', accent2: 'F5A623', accent3: '15803D', accent4: 'B45309', accent5: 'DC2626', accent6: '2563EB', hlink: '2563EB', folHlink: '34427A' } };
const pres = new pptxgen(); pres.layout = 'LAYOUT_WIDE'; pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'Bellomassi — Project Documentation Overview'; pres.author = 'Project documentation team';
const C = pres.SchemeColor;
const FOOT = { text: 'Bellomassi Order-to-Delivery Platform · BM-PRS-001 · Draft for client review', options: { x: 0.6, y: 7.05, w: 9, h: 0.3, fontSize: 10, color: C.text2 } };
pres.defineSlideMaster({ title: 'DARK', background: { color: C.text1 }, objects: [],
  placeholders: [] });
pres.defineSlideMaster({ title: 'TITLE_ONLY', background: { color: C.background1 },
  objects: [{ text: FOOT }],
  slideNumber: { x: 12.2, y: 7.05, w: 0.6, h: 0.3, fontSize: 10, color: C.text2 } ,
  placeholders: [] });
// helper because placeholders with scheme colours are simple here
const title = (s, t) => s.addText(t, { x: 0.6, y: 0.4, w: 12.1, h: 0.9, fontSize: 34, bold: true, color: C.text1, fontFace: 'Cambria', isTextBox: true, margin: 0 });
const sub = (s, t) => s.addText(t, { x: 0.6, y: 1.25, w: 12.1, h: 0.45, fontSize: 16, color: C.text2, isTextBox: true, margin: 0, italic: true });
const card = (s, x, y, w, h, head, body, tone) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: 'E4E8F0', width: 0.75 } });
  s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.28, w: 0.32, h: 0.32, fill: { color: tone || C.accent2 }, line: { color: tone || C.accent2 } });
  s.addText(head, { x: x + 0.7, y: y + 0.18, w: w - 0.9, h: 0.5, fontSize: 17, bold: true, color: C.text1, isTextBox: true, margin: 0, valign: 'middle' });
  s.addText(body, { x: x + 0.25, y: y + 0.8, w: w - 0.5, h: h - 0.95, fontSize: 14, color: C.text2, isTextBox: true, margin: 0, valign: 'top', paraSpaceAfter: 4 });
};
const bullets = (arr) => arr.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < arr.length - 1 } }));
const S = (sec) => pres.addSlide({ masterName: 'TITLE_ONLY', sectionTitle: sec });

// 1 title
pres.addSection({ title: 'Introduction' });
let s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Introduction' });
s.addText('BELLOMASSI', { x: 0.8, y: 1.2, w: 11, h: 0.5, fontSize: 16, bold: true, color: C.accent2, charSpacing: 6, isTextBox: true, margin: 0 });
s.addText('From customer order to confirmed delivery', { x: 0.8, y: 1.8, w: 11.5, h: 1.6, fontSize: 44, bold: true, color: C.background1, fontFace: 'Cambria', isTextBox: true, margin: 0 });
s.addText('Prototype review and A–Z project documentation package', { x: 0.8, y: 3.5, w: 11, h: 0.6, fontSize: 20, color: 'C3C9E4', isTextBox: true, margin: 0 });
s.addText('Draft for client review · 12 November 2026 · Not approved', { x: 0.8, y: 6.3, w: 11, h: 0.4, fontSize: 14, color: 'C3C9E4', isTextBox: true, margin: 0 });
s.addNotes('Purpose: present what the prototype does, what is documented, what is still simulated, and the decisions we need from you.');

// 2 key message
s = S('Introduction'); title(s, 'Where we are today');
sub(s, 'A working prototype validates the whole order-to-delivery flow — production work starts after your scope decisions');
const stats = [['35', 'modules documented'], ['179', 'functional requirements'], ['292', 'test cases written (not executed)'], ['234', 'documents in the package']];
stats.forEach((st, i) => { const x = 0.6 + i * 3.08;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.1, w: 2.85, h: 2.0, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: 'E4E8F0', width: 0.75 } });
  s.addText(st[0], { x, y: 2.25, w: 2.85, h: 1.1, fontSize: 54, bold: true, color: C.accent1, align: 'center', fontFace: 'Cambria', isTextBox: true, margin: 0 });
  s.addText(st[1], { x: x + 0.2, y: 3.35, w: 2.45, h: 0.6, fontSize: 14, color: C.text2, align: 'center', isTextBox: true, margin: 0 }); });
s.addText(bullets(['Prototype: React web app with office, driver and customer layouts; data stays in the browser (LocalStorage).',
  'GPS, OTP messages, email, WhatsApp, OCR and AI are simulated and labelled in the UI.',
  'No client approval, UAT, production deployment or SAP integration exists yet.']), { x: 0.6, y: 4.5, w: 12.1, h: 2.1, fontSize: 16, color: C.text2, isTextBox: true, margin: 0, paraSpaceAfter: 8 });
s.addNotes('Counts: 179 FRs from the FRD set; 228 functional + 64 cross-cutting test cases, all "Not run".');

// 3 flow
pres.addSection({ title: 'The prototype' });
s = S('The prototype'); title(s, 'One record from order to delivery note');
const steps = ['Capture', 'Approve', 'Consolidate', 'Dispatch', 'Deliver (OTP + POD)', 'Delivery note'];
const who = ['Salesman / customer app', 'Sales Manager (credit checks)', 'Customer Service', 'Dispatcher (zone, driver, vehicle)', 'Driver', 'Customer'];
steps.forEach((t, i) => { const x = 0.6 + i * 2.05;
  s.addShape(pres.shapes.OVAL, { x: x + 0.55, y: 2.0, w: 0.8, h: 0.8, fill: { color: i === 4 ? C.accent2 : C.accent1 }, line: { color: C.accent1 } });
  s.addText(String(i + 1), { x: x + 0.55, y: 2.0, w: 0.8, h: 0.8, fontSize: 22, bold: true, color: C.background1, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
  if (i < steps.length - 1) s.addShape(pres.shapes.LINE, { x: x + 1.45, y: 2.4, w: 1.15, h: 0, line: { color: 'CFD6E3', width: 2, endArrowType: 'triangle' } });
  s.addText(t, { x, y: 3.0, w: 1.9, h: 0.7, fontSize: 16, bold: true, color: C.text1, align: 'center', isTextBox: true, margin: 0 });
  s.addText(who[i], { x, y: 3.7, w: 1.9, h: 0.9, fontSize: 13, color: C.text2, align: 'center', isTextBox: true, margin: 0 }); });
s.addText('Stock is deducted when the Dispatcher confirms loading. The driver cannot complete a stop without the customer\'s 6-digit OTP. Failed or partial stops return to the Dispatcher for review.', { x: 0.6, y: 5.1, w: 12.1, h: 1.0, fontSize: 15, color: C.text2, isTextBox: true, margin: 0 });

// 4 screenshots office
s = S('The prototype'); title(s, 'The office web app');
sub(s, 'Real screenshots of the prototype with demo data');
s.addImage({ path: path.join(SHOTS, 'UX-DASH-SA.png'), x: 0.6, y: 1.9, w: 7.2, h: 4.5, altText: 'Super Admin dashboard screenshot' });
s.addImage({ path: path.join(SHOTS, 'UX-APPROVAL.png'), x: 8.1, y: 1.9, w: 4.6, h: 2.875, altText: 'Order approval queue screenshot' });
s.addText('Role dashboards with period filter · approval queue with automatic checks · 13 roles, 110 permissions', { x: 8.1, y: 4.95, w: 4.6, h: 1.4, fontSize: 14, color: C.text2, isTextBox: true, margin: 0 });

// 5 driver/customer
s = S('The prototype'); title(s, 'Driver and customer apps');
['UX-DRV-DASH', 'MAN-DRV-05-arrived', 'MAN-CUS-04-tracking', 'UX-CUS-CATALOG'].forEach((f, i) =>
  s.addImage({ path: path.join(SHOTS, f + '.png'), x: 0.6 + i * 2.2, y: 1.6, w: 1.98, h: 4.29, altText: f + ' screenshot' }));
s.addText(bullets(['Driver: stops in sequence, reach location, OTP, POD, delivery note', 'Customer: catalog, cart, order tracking, OTP display, documents', 'Mobile web today; native driver app proposed']),
  { x: 9.6, y: 1.8, w: 3.1, h: 4.0, fontSize: 14, color: C.text2, isTextBox: true, margin: 0, paraSpaceAfter: 10 });

// 6 status chart
pres.addSection({ title: 'Status' });
s = S('Status'); title(s, 'Most modules work — integrations are simulated');
s.addChart(pres.charts.BAR, [{ name: 'Modules', labels: ['Implemented and working', 'With limitations', 'Simulated', 'Over simulated channels'], values: [20, 10, 4, 1] }],
  { x: 0.6, y: 1.6, w: 7.2, h: 4.9, barDir: 'bar', showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 14, dataLabelColor: '374151', chartColors: ['232B5F'],
    catAxisLabelFontSize: 14, catAxisLabelColor: '374151', valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false,
    showTitle: true, title: 'Prototype modules by status (35)', titleFontSize: 16, titleColor: '1C2350', catAxisLabelFontFace: '+mn-lt', titleFontFace: '+mn-lt', dataLabelFontFace: '+mn-lt' });
card(s, 8.2, 1.6, 4.5, 2.3, 'Simulated today', 'DEMO GPS tracking, OTP / delivery-note sending, email and WhatsApp, OCR, AI', C.accent4);
card(s, 8.2, 4.2, 4.5, 2.3, 'Not built', 'Backend, database, server security, SAP integration, native mobile app', C.accent5);

// 7 gaps
s = S('Status'); title(s, 'Gaps against the Scope of Work');
const gaps = [['G-01', 'Approved value / quantity change'], ['G-03', 'Zone drag-and-drop board'], ['G-04 / 05', 'Fastest route, turn-by-turn'], ['G-06 / 07', 'OTP and delivery note by SMS / WhatsApp'],
  ['G-08', 'Native iOS / Android driver app'], ['G-10', 'Items from SAP (stage 2)'], ['G-12', 'Order channel captured'], ['G-13', 'Real authentication']];
gaps.forEach((g, i) => { const col = i % 2, row = Math.floor(i / 2); const x = 0.6 + col * 6.15, y = 1.6 + row * 1.2;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.95, h: 1.0, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: 'E4E8F0', width: 0.75 } });
  s.addText(g[0], { x: x + 0.25, y, w: 1.3, h: 1.0, fontSize: 15, bold: true, color: C.accent1, valign: 'middle', isTextBox: true, margin: 0 });
  s.addText(g[1], { x: x + 1.6, y, w: 4.2, h: 1.0, fontSize: 15, color: C.text2, valign: 'middle', isTextBox: true, margin: 0 }); });
s.addText('Full list: BM-DOC-003 Gap Analysis and BM-HND-012 Pending Requirements', { x: 0.6, y: 6.5, w: 12, h: 0.4, fontSize: 12, color: C.text2, isTextBox: true, margin: 0, italic: true });

// 8 extensions
s = S('Status'); title(s, 'The prototype goes beyond the SOW');
sub(s, 'Eleven extensions need a scope decision before production (X-01 … X-11)');
card(s, 0.6, 2.0, 3.9, 3.9, 'Likely keep', 'Inventory check at dispatch\nVMS document compliance\nMessaging needed for OTP', C.accent3);
card(s, 4.7, 2.0, 3.9, 3.9, 'Decide', 'Customer self-service app\nReports Center (choose go-live set)\nExtra roles', C.accent2);
card(s, 8.8, 2.0, 3.9, 3.9, 'Phase 5 or retire', 'Invoicing (SOW: outside)\nScrap, OCR, call history\nAI, forecasting, supplier portal', C.accent4);
s.addText('Effort ranges per extension: BM-RSK-004 (estimates)', { x: 0.6, y: 6.2, w: 12, h: 0.4, fontSize: 12, color: C.text2, isTextBox: true, margin: 0, italic: true });

// 9 roadmap
pres.addSection({ title: 'Next steps' });
s = S('Next steps'); title(s, 'Indicative path to production (estimate)');
const ph = [['1', 'Prototype', 'Done'], ['2', 'Backend', '12–14 weeks'], ['3', 'Mobile + integrations', '~9 weeks, overlapping'], ['4', 'Deployment, UAT, go-live', '6–8 weeks'], ['5', 'SAP + enhancements', 'To be estimated']];
ph.forEach((p, i) => { const x = 0.6 + i * 2.48;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.0, w: 2.3, h: 3.0, rectRadius: 0.08, fill: { color: i === 0 ? C.accent1 : C.background2 }, line: { color: 'E4E8F0', width: 0.75 } });
  s.addText('Phase ' + p[0], { x: x + 0.2, y: 2.2, w: 1.9, h: 0.4, fontSize: 13, bold: true, color: i === 0 ? C.accent2 : C.accent1, isTextBox: true, margin: 0 });
  s.addText(p[1], { x: x + 0.2, y: 2.65, w: 1.9, h: 1.1, fontSize: 18, bold: true, color: i === 0 ? C.background1 : C.text1, isTextBox: true, margin: 0, valign: 'top' });
  s.addText(p[2], { x: x + 0.2, y: 4.0, w: 1.9, h: 0.8, fontSize: 14, color: i === 0 ? 'C3C9E4' : C.text2, isTextBox: true, margin: 0 }); });
s.addText('Durations are estimates; the assumed start (4 Jan 2027) is not agreed. Target stack: Django + PostgreSQL, React web, React Native driver app.', { x: 0.6, y: 5.4, w: 12.1, h: 0.8, fontSize: 14, color: C.text2, isTextBox: true, margin: 0 });

// 10 decisions
s = S('Next steps'); title(s, 'Decisions we need from you');
const dec = ['Scope: which extensions stay (X-01 … X-11)', 'Country, currency and tax model (UAE / AED vs India data)', 'Order status model: 8 (SOW) or 13 (prototype)', 'Credit exceeded: warn or block',
  'Hosting provider and region', 'Messaging provider for OTP and delivery notes', 'SAP interface and timing', 'UAT users and pilot hub'];
dec.forEach((d, i) => { const col = i % 2, row = Math.floor(i / 2); const x = 0.6 + col * 6.15, y = 1.6 + row * 1.15;
  s.addShape(pres.shapes.OVAL, { x, y: y + 0.2, w: 0.5, h: 0.5, fill: { color: C.accent2 }, line: { color: C.accent2 } });
  s.addText(String(i + 1), { x, y: y + 0.2, w: 0.5, h: 0.5, fontSize: 15, bold: true, color: C.text1, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
  s.addText(d, { x: x + 0.7, y, w: 5.2, h: 0.9, fontSize: 16, color: C.text1, valign: 'middle', isTextBox: true, margin: 0 }); });
s.addText('Business approval form: BM-HND-005 (blank)', { x: 0.6, y: 6.4, w: 12, h: 0.4, fontSize: 12, color: C.text2, isTextBox: true, margin: 0, italic: true });

// 11 package
s = S('Next steps'); title(s, 'What the documentation package contains');
const pk = [['Business', 'Overview, BRD, SOW, phase plan'], ['Requirements', 'SRS, 35 FRDs, NFRs, rules, RTM'], ['Design', 'HLD / LLD, database, API + OpenAPI, 23 diagrams'], ['Security & infra', 'Policies, RBAC matrix, hosting, cost estimate'],
  ['Quality', 'Strategy, plans, 292 test cases, UAT plan'], ['Users', 'Driver, customer, office and 14 role manuals'], ['Delivery', 'Deployment, release, rollback, checklists'], ['Handover', 'Known issues, limitations, blank sign-offs']];
pk.forEach((p, i) => { const col = i % 4, row = Math.floor(i / 4); const x = 0.6 + col * 3.08, y = 1.6 + row * 2.45;
  card(s, x, y, 2.9, 2.2, p[0], p[1], [C.accent1, C.accent2, C.accent3, C.accent6][col]); });
s.addText('Index: 25_DOCUMENTATION_INDEX/BELLOMASSI_DOCUMENTATION_INDEX.xlsx', { x: 0.6, y: 6.55, w: 12, h: 0.4, fontSize: 12, color: C.text2, isTextBox: true, margin: 0, italic: true });

// 12 close
s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Next steps' });
s.addText('Next step', { x: 0.8, y: 1.6, w: 11, h: 0.5, fontSize: 16, bold: true, color: C.accent2, charSpacing: 4, isTextBox: true, margin: 0 });
s.addText('Review the package and take the scope decisions at gate G0', { x: 0.8, y: 2.2, w: 11.5, h: 1.8, fontSize: 38, bold: true, color: C.background1, fontFace: 'Cambria', isTextBox: true, margin: 0 });
s.addText('Then: hosting and providers (G1) → Phase 2 kick-off', { x: 0.8, y: 4.3, w: 11, h: 0.6, fontSize: 20, color: 'C3C9E4', isTextBox: true, margin: 0 });

(async () => { await pres.writeFile({ fileName: OUT }); await applyTheme(OUT, THEME); console.log('written'); })();
