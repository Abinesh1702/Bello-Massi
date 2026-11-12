"""QA-013 cross-cutting test cases: responsive UI, LocalStorage persistence, date filters, role access, UI, accessibility, security, performance."""
import json, os
import xlsxlib
H = os.path.dirname(os.path.abspath(__file__))
INV = json.load(open(os.path.join(H, 'data', 'inv.json')))
C = []
def tc(area, scen, pre, steps, data, exp, pri='High', req=''):
    C.append([f'TC-X-{len(C) + 1:03d}', area, scen, 'Cross-cutting', req, pre, steps, data, exp, '', 'Not run', pri, '', '', ''])
# responsive
for w, name in ((390, 'phone'), (768, 'tablet'), (1024, 'small laptop'), (1440, 'desktop')):
    tc('Responsive UI', f'Office pages render at {w} px ({name})', 'Signed in as Super Admin', f'1. Set viewport {w} px\n2. Open every sidebar page\n3. Check layout', f'Viewport {w}×900', 'No horizontal page overflow; sidebar is drawer below 1024 px; tables scroll inside their card; no overlapping text', 'Medium', 'NFR-USE')
tc('Responsive UI', 'Driver app at 360 px and 390 px', 'Driver signed in', '1. Open Today, Deliveries, stop, confirm, Route, Completed, Profile', 'Viewport 360 and 390 px', 'Bottom navigation visible; buttons ≥ 44 px; no overflow', 'High', 'NFR-USE')
tc('Responsive UI', 'Customer app at 360 px and 390 px', 'Customer signed in', '1. Open Home, Catalog, Cart, Orders, Tracking, Notes, Invoices, Profile', 'Viewport 360 and 390 px', 'No overflow; cart totals and Place order button visible', 'High', 'NFR-USE')
tc('Responsive UI', 'Customer cart line amount', 'Customer with 2 products in cart', '1. Open Cart\n2. Read the amount on each product line', 'Qty 1 each', 'Each line shows quantity × price (+ tax) and the sum equals the subtotal / total', 'High', 'FR-CAP')
# persistence
tc('LocalStorage persistence', 'Data survives page reload', 'Any role', '1. Create a record (e.g. order draft)\n2. Reload the page', '—', 'Record still present', 'High', 'PROTOTYPE')
tc('LocalStorage persistence', 'Data survives sign-out / sign-in', 'Salesman', '1. Submit order\n2. Sign out\n3. Sign in as Sales Manager', '—', 'Order visible in approval queue', 'High', 'PROTOTYPE')
tc('LocalStorage persistence', 'First visit seeds demo data', 'Empty browser profile', '1. Open app', '—', 'Seed data loaded; bellomassi_app_version = 8', 'Medium', 'PROTOTYPE')
tc('LocalStorage persistence', 'Migration from earlier data version', 'Browser with version 7 data', '1. Open app', 'v7 snapshot', 'Data migrated to v8; nothing existing removed; new keys added', 'Medium', 'PROTOTYPE')
tc('LocalStorage persistence', 'Clearing site data resets demo', 'Any', '1. Clear site data\n2. Reload', '—', 'Seed data restored; session cleared', 'Low', 'PROTOTYPE')
tc('LocalStorage persistence', 'Storage quota with photos', 'Driver', '1. Complete several deliveries with photo and signature', 'Photos ≤ 350 KB', 'No quota error under normal demo usage; error shown clearly if quota exceeded', 'Medium', 'PROTOTYPE')
tc('LocalStorage persistence', 'Two browsers do not share data', 'Two browsers', '1. Create order in browser A\n2. Open browser B', '—', 'Order not visible in B (expected prototype limitation)', 'Low', 'PROTOTYPE')
# date filters
for p in ('All time', 'Today', 'This week', 'This month', 'Date range', 'Specific period', 'Compare with previous period'):
    tc('Date filters', f'Dashboard period filter — {p}', 'Super Admin dashboard', f'1. Select "{p}"\n2. Compare KPI values with records in that period', 'Seed data', 'KPIs recalculated for the period; "Showing" label updated; comparison shows delta when enabled', 'Medium', 'FR-DASH')
tc('Date filters', 'Report date from / to', 'Reports Center', '1. Open a report\n2. Set date from / to', '—', 'Only rows in range; totals recalculated', 'Medium', 'FR-RPT')
# role access per role
roles = [r for r in INV['roleMeta'] if r != 'SUPER_ADMIN']
for r in ['SUPER_ADMIN'] + roles:
    tc('Role-based access', f'{r}: menus match permission matrix', f'Signed in as {r}', '1. Compare sidebar / bottom bar with BM-SEC-005 Screen Access Matrix', 'Default role permissions', 'Only permitted screens shown', 'High', 'FR-RBAC')
    tc('Role-based access', f'{r}: direct URL to a forbidden screen', f'Signed in as {r}', '1. Type URL of a screen not permitted for the role', 'e.g. /admin/users', 'Access denied page or redirect; no data shown', 'High', 'FR-RBAC')
tc('Role-based access', 'Driver cannot open another driver\'s delivery', 'Driver A', '1. Open /driver/deliveries/<id of driver B>', '—', '"Access denied"', 'Critical', 'FR-DRV')
tc('Role-based access', 'Customer cannot open another customer\'s order or tracking', 'Customer A', '1. Open /customer/orders/<id of customer B> and /customer/tracking/<id>', '—', 'Access denied / not found', 'Critical', 'FR-CAP')
tc('Role-based access', 'Permission change takes effect', 'Admin + custom role user', '1. Remove a permission from a role\n2. User reloads', '—', 'Menu item and action disappear', 'High', 'FR-RBAC')
# UI
tc('UI', 'Required field markers and messages', 'Any form', '1. Submit empty form', '—', 'Messages under each required field; focus on first error', 'Medium', 'UX-009')
tc('UI', 'Confirmation before destructive actions', 'Admin', '1. Delete / deactivate a record', '—', 'Confirmation dialog names the record', 'Medium', 'UX-009')
tc('UI', 'Dark mode', 'Any', '1. Toggle theme on each main page', '—', 'Readable contrast; charts use dark palette', 'Low', 'UX-002')
tc('UI', 'Empty states', 'New filters with no results', '1. Filter to no rows', '—', 'Empty state with explanation', 'Low', 'UX-005')
tc('UI', 'Global search', 'Any office role', '1. Ctrl K\n2. Search order number, customer, driver', '—', 'Results limited to permitted pages', 'Medium', 'UX-003')
# accessibility
tc('Accessibility', 'Keyboard-only order creation', 'Salesman', '1. Create and submit order without mouse', '—', 'All controls reachable; visible focus', 'Medium', 'A11Y-02')
tc('Accessibility', 'Automated axe scan of key pages', 'Any', '1. Run axe on 20 key pages', '—', 'No critical violations', 'Medium', 'A11Y-01')
# security (production)
tc('Security', 'Server rejects action without permission (production)', 'API', '1. Call approve endpoint with Salesman token', '—', '403; audit entry', 'Critical', 'SEC-REQ-06')
tc('Security', 'IDOR on tracking endpoint (production)', 'API', '1. Customer token requests other customer tracking', '—', '403 / 404', 'Critical', 'SEC')
tc('Security', 'OTP brute force (production)', 'API', '1. Submit 6 wrong OTPs', '—', 'Locked after 5; rate limited', 'Critical', 'SEC')
tc('Security', 'Login lockout', 'Any', '1. Enter wrong password 5 times', '—', 'Account locked for configured minutes; audit ACCOUNT_LOCKED', 'High', 'FR-AUTH')
# performance (production, targets proposed)
tc('Performance', 'API p95 latency under load (production)', 'Staging, 100 concurrent users', '1. Run k6 scenario', 'k6 script', 'p95 within NFR target (to be confirmed)', 'High', 'NFR-PERF')
tc('Performance', 'GPS ingestion 50 drivers (production)', 'Staging', '1. Simulate 50 drivers every 10–15 s for 1 h', '—', 'No message loss; map lag < 10 s', 'High', 'NFR-PERF')
xlsxlib.write_book(dict(id='BM-QA-013', title='Cross-cutting Test Cases (Responsive, Persistence, Date Filters, Role Access, UI, Accessibility, Security, Performance)', folder='13',
    file='BM-QA-013_Cross_Cutting_Test_Cases', category='Testing and Quality Assurance',
    purpose='Test cases that cut across modules. All are "Not run" — no execution results exist.',
    scope='Prototype (persistence, responsive, filters, RBAC in browser) and production-only cases (marked "(production)").',
    related=['BM-QA-011', 'BM-QA-002', 'BM-SEC-005'], references=['BM-QA-002 Test Plan']), [
    dict(name='Test Cases', headers=['Test Case ID', 'Area', 'Test Scenario', 'Type', 'Related Requirement', 'Preconditions', 'Test Steps', 'Test Data', 'Expected Result', 'Actual Result', 'Status', 'Priority', 'Defect ID', 'Tester', 'Execution Date'],
         rows=C, widths=[11, 18, 40, 13, 14, 24, 40, 16, 44, 18, 10, 9, 10, 12, 12], validations={10: ['Not run', 'Pass', 'Fail', 'Blocked', 'N/A']})])
print('qa2 ok', len(C))
