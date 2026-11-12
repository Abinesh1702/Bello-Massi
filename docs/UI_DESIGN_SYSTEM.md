# Bellomassi — UI design system & dashboard period filter

Presentation-layer release. No business logic, workflow, validation, permission, route, service contract or
LocalStorage key/structure was changed — the full regression suites pass unchanged.

## 1. Universal dashboard period filter

**Where:** every dashboard — Admin / Super Admin, Salesman, Sales Manager, Customer Service, Dispatcher, Finance,
Warehouse Manager, Inventory Executive, QA, Supplier, Driver app home, Customer app home. (The permission-driven
workspace launcher for custom roles has no dated data and shows no filter.)

**Options:** Today, Yesterday, This Week, Last Week, Last 7 Days, Last 30 Days, This Month, Last Month, Month to Date,
This Quarter, Last Quarter, Quarter to Date, This Half-Year, Last Half-Year, Half-Year to Date, This Year, Last Year,
Year to Date, Custom Date Range, All Time — plus **Specific period**: a day, week (Mon–Sun), month, quarter, half-year,
calendar year or financial year.

**Financial year:** default April – March (FY 2026–27 = 01-Apr-2026 … 31-Mar-2027; Q1 Apr–Jun … Q4 Jan–Mar; H1 Apr–Sep,
H2 Oct–Mar). The start month can be changed in the Specific-period panel. Quarter / half-year presets follow the FY.
(The company record's `fiscalYearStartMonth` is January in the demo data; it was intentionally not modified.)

**Custom range:** start / end date with calendar pickers, Clear, Cancel, Apply; start after end, missing or invalid
dates show a message; the applied range is always visible ("Showing 01-Nov-2026 – 12-Nov-2026").

**Comparison:** optional "Compare" toggle → each KPI shows % change, absolute difference, trend direction and the
previous value, against the previous equivalent period (whole months/quarters/years compare to the previous whole
unit; other ranges to the same number of days before). Disabled for All Time; no value is shown when there is no
valid previous figure.

**Defaults:** office and customer dashboards — All Time (identical numbers to before); driver — Today. Reset restores the
default. The selection is kept per dashboard in memory while the app is open (nothing is written to storage).

**Layout:** desktop/tablet — one wrapping toolbar (period select, Date range, Specific period, Compare, active range,
"dates used" help, Reset). Mobile — a compact button that opens a bottom sheet with the same options.

**How data is selected (presentation only).** `useDashboardData`, `useOpsSnapshot` and the dispatch overview narrow
the *dated* collections to the period, each on its own business date, and pass them to the **existing** calculations:

| Data | Date used |
|---|---|
| Orders | order date |
| Approval decisions | timeline event date |
| Dispatches | dispatch date |
| Deliveries | completion / failure date |
| Invoices | invoice date |
| Stock receipts / transfers / adjustments | receipt / transfer / adjustment date |
| Replenishment (purchase) | created date |
| Documents (QA queue) | upload date |
| Delivery notes | delivery date |
| AI insights | generated date |

Stock levels, inventory value, credit balances, customers, products, vehicles and drivers are current positions and are
marked **Current**. Monthly sales targets always use the current month (labelled). Trend charts follow the period
(per day up to ~6 weeks, per week up to ~6 months, then per month); All Time keeps the original 14-day / 7-day views.
Rolling-window KPIs ("Sales, 30 days", "Delivery, 7 days", "Receipts, 7 days", "Approved today") switch to the
selected period when one is chosen and keep their original definition under All Time.

Files: `src/utils/periods.js`, `src/utils/dashboardFilter.js`, `src/utils/dashboardTrends.js`,
`src/context/DashboardPeriodContext.jsx`, `src/hooks/useDashboardPeriod.js`, `src/components/dashboard/DashboardFilterBar.jsx`,
`src/components/driver/DriverPerformance.jsx`.

## 2. Design system

Tokens live in `src/styles/index.css` (Light and Dark values; components only use tokens):

- **Brand:** navy `#232B5F` / `#34427A`, amber `#F5A623`; status success / warning / danger / info; neutrals
  canvas, surface, surface-2, surface-3, ink, ink-2, muted, line, line-strong; sidebar tokens; focus ring.
- **Typography (Inter):** `.text-page-title`, `.text-section-title`, `.text-kpi`, `.text-label`; table headers 11 px
  uppercase; body 14 px.
- **Sizes:** inputs and default buttons 36 px, small 32 px, large 44 px (driver/customer touch targets); radius 6/8/12 px;
  content max width 1480 px.
- **Shadows:** xs / card / pop; dark mode uses borders instead of heavy shadows.
- **Motion:** 150–220 ms fades, sheet slide-up on mobile; all disabled with `prefers-reduced-motion`.

## 3. Components refreshed (APIs unchanged)

Button (new `outline` and `success` variants; existing variants kept), Badge (token-based status colours, compact
rounded-md), Card / CardHeader, StatCard (optional `compare` and `live`), DataTable (header band, full-bleed rows,
hover, pagination bar), Input / Select / Textarea (36 px, hover and focus states), FilterToolbar, FormSection (header
band), FormActions (sticky with safe-area padding), Modal (bottom sheet on mobile, consistent header/footer, sizes
sm/md/lg/xl), Tabs, EmptyState, InfoList, PageHeader, Sidebar (section label, guide line for sub-items, accent active
bar, quieter collapse control), Header (56 px, lighter), content area (max width, rhythm), footer.

Driver and customer apps: bottom navigation with an active indicator and 56 px targets; sticky primary actions above the
tab bar (Start delivery / Reach location / Enter OTP, Verify OTP & complete, Place order).

Hard-coded Tailwind palette colours in pages were replaced by theme tokens (except the printed delivery note).

## 4. Verification

Build and lint pass (no new lint errors). Browser tests: 67 dashboard-filter checks (all presets, FY quarter/half/year,
specific week/month, custom range validation, empty range, KPI = source count, table and chart follow the period,
comparison, reset, in-app persistence, 9 role dashboards, driver/customer mobile bottom sheet, dark mode) · 71 workflow
scenario checks · 83 Phase-1 checks · 30 regression checks · 31 migration checks · all 13 roles × every sidebar page ·
137 pages at 390 px with no horizontal overflow.

## 5. Remaining visual notes

- Wide tables (e.g. Order List) still scroll horizontally inside their card on smaller laptops by design (no columns
  were removed).
- Some secondary pages keep their own internal layouts; they now inherit the refreshed tokens and components.
