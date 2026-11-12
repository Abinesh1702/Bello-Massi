"""INF-004 infrastructure cost estimate workbook — all values are indicative ESTIMATES, not quotations."""
import xlsxlib
E = 'ESTIMATE — not a quotation'
items = [  # component, AWS low, AWS high, Azure low, Azure high, DO low, DO high, basis
 ('API + Channels containers (4–6 small)', 120, 250, 120, 260, 60, 120, '2–4 API + 2 channels, 0.5–1 vCPU each'),
 ('Celery workers + beat', 60, 120, 60, 130, 30, 60, '2–3 workers'),
 ('PostgreSQL managed (primary + standby)', 250, 450, 250, 480, 120, 200, '2 vCPU / 8 GB, 100 GB, HA'),
 ('Redis managed', 40, 90, 40, 100, 15, 30, '1 GB with replica'),
 ('Object storage (100–300 GB) + requests', 5, 20, 5, 20, 5, 15, 'Standard tier'),
 ('Load balancer + WAF', 40, 80, 40, 90, 12, 40, 'One public LB'),
 ('Data transfer / CDN', 20, 60, 20, 60, 0, 20, 'Moderate egress'),
 ('Backups (snapshots, second region)', 20, 60, 20, 60, 10, 30, '35-day retention'),
 ('Monitoring / logs (cloud native + Sentry team)', 40, 120, 40, 120, 30, 80, '30-day hot logs'),
 ('Staging + test environments', 150, 300, 150, 300, 60, 120, 'Smaller than production'),
]
rows = [[c, a1, a2, z1, z2, d1, d2, b, E] for c, a1, a2, z1, z2, d1, d2, b in items]
n = len(rows)
rows.append(['TOTAL (monthly, USD)'] + [f'=SUM({col}2:{col}{n + 1})' for col in 'BCDEFG'] + ['Sum of rows above', E])
usage = [
 ('Google Maps Platform — Maps JS / Routes', 'Per 1,000 requests after free credit', 'Depends on map loads and route calls; estimate after pilot', E),
 ('SMS OTP / delivery notification', 'Per message, country dependent', 'Approx. 2–3 messages per delivery', E),
 ('WhatsApp Business (official provider)', 'Per conversation, country dependent', 'Delivery note + OTP if channel chosen', E),
 ('Email provider', 'Per 1,000 emails / monthly plan', 'Low volume', E),
 ('OCR engine', 'Self-hosted (worker CPU) or per page (cloud OCR)', 'Depends on documents volume', E),
 ('Mobile app stores', 'Apple USD 99 / year; Google one-time USD 25', 'Public list prices — confirm', E),
 ('Domain + TLS certificates', 'Low; managed certificates often free', '', E),
]
onprem = [
 ('Servers (2 app + 2 DB, redundant)', 'One-time hardware', 'Depends on vendor; quotation required', E),
 ('Storage / backup appliance', 'One-time', 'Quotation required', E),
 ('Licences (OS, virtualisation, backup software)', 'Annual', 'Quotation required', E),
 ('Data-centre space, power, network', 'Monthly', 'Client facility', E),
 ('Operations staff (patching, backups, monitoring)', 'Monthly', 'Internal or managed service', E),
]
assumptions = [
 ('A-01', 'Prices are indicative public list-price ranges (USD) prepared without quotations; real costs must come from provider calculators / quotations in the chosen region.'),
 ('A-02', 'Volumes: hundreds of orders / day, ≤ 50 drivers, ≤ 100 concurrent users — PENDING CONFIRMATION.'),
 ('A-03', 'No reserved-instance or enterprise discounts applied.'),
 ('A-04', 'Taxes (e.g. VAT) excluded.'),
 ('A-05', 'Development effort, licences for SAP and support contracts are NOT included.'),
 ('A-06', 'Region: UAE or India — prices differ per region.'),
]
xlsxlib.write_book(dict(id='BM-INF-004', title='Infrastructure Cost Estimation (ESTIMATE)', folder='11', file='BM-INF-004_Infrastructure_Cost_Estimate', category='Infrastructure and DevOps',
    purpose='Indicative monthly running-cost ranges for hosting options to support the hosting decision. All figures are ESTIMATES, not quotations or real costs.',
    scope='Production + non-production hosting, usage-based services, on-premises cost items. Excludes development effort and SAP.',
    related=['BM-INF-002', 'BM-INF-003'], references=['BM-INF-002 Hosting Options Comparison']), [
    dict(name='Monthly Hosting Estimate', headers=['Component', 'AWS low', 'AWS high', 'Azure low', 'Azure high', 'DigitalOcean low', 'DigitalOcean high', 'Basis', 'Label'], rows=rows, widths=[42, 11, 11, 11, 11, 15, 15, 36, 26]),
    dict(name='Usage-based Services', headers=['Service', 'Pricing unit', 'Driver / note', 'Label'], rows=usage, widths=[40, 40, 46, 26]),
    dict(name='On-premises Items', headers=['Item', 'Cost type', 'Note', 'Label'], rows=onprem, widths=[44, 18, 40, 26]),
    dict(name='Assumptions', headers=['ID', 'Assumption'], rows=assumptions, widths=[8, 110])])
print('inf ok')
