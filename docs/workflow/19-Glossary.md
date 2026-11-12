# 19 · Glossary

## 19.1 Business terms

| Term | Meaning in Bellomassi |
|---|---|
| Approval checks | Six automatic checks shown to the Sales Manager: customer active, hub active, credit within limit, stock available, order total valid, products active. |
| Available stock | Total − reserved − damaged quantity at a hub. |
| Batch-controlled product | A product whose scrap requests must name a batch number. Batch tracking on stock is not implemented. |
| Closed with exceptions | Label of dispatch status PARTIALLY_DELIVERED: all stops closed, at least one failed or partial. |
| Cold chain | Keeping frozen (−25 to −18 °C) and chilled (0 to 4 °C) goods in range. Ranges are configured; live readings are not available. |
| Consolidation | Customer Service's five-point check of an approved order before it is released to dispatch. |
| Credit limit / balance | Maximum outstanding amount allowed for a customer / the outstanding amount recorded on the customer. |
| Credit warning | Flag on an order whose total would take the customer over the credit limit. |
| Customer app | Mobile-first part of the application for customers (`/customer/*`). |
| Data scope | Which records a role can see (all, own, linked customer, etc.). |
| Delivery | One stop on a dispatch, created per order when the dispatch is confirmed. |
| Delivery note | Proof-of-delivery document generated when a stop is completed (BM-DN-YYYY-NNNNN). |
| DEMO GPS | Simulated vehicle position used for tracking; no real GPS device. |
| Dispatch | One vehicle run from one hub on one date with a driver and a sequence of stops. |
| Dispatch confirmation | The Dispatcher's loading sign-off. Stock is deducted and the driver can start. |
| Driver app | Mobile-first part of the application for drivers (`/driver/*`). |
| Exception review | The Dispatcher's decision on a failed or partial delivery (return goods, re-queue). |
| FEFO | First-expiry-first-out picking strategy (a setting only). |
| Follow-up | A future action scheduled on a call record. |
| GRN | Goods receipt note — a stock receipt. |
| Hub | Location that holds stock and runs dispatches. |
| Invoice basis | Bill ordered quantities or delivered quantities (from the delivery note). |
| Landing page | First page a role sees after sign-in. |
| OTP | One-time 6-digit code the customer gives the driver to confirm the handover (simulated, shown in the customer app). |
| POD | Proof of delivery: receiver name, optional signature and photo, customer remarks. |
| Quarantine | Damaged quantity held at a hub (shown on the QA dashboard). |
| Re-queue | Putting a failed order back to READY_FOR_DISPATCH so it can be planned again. |
| Ready for dispatch | Order released by Customer Service to the Dispatcher. |
| Reorder level | Available quantity at or below which a stock line is Low Stock. |
| Replenishment | Purchase request to a supplier (draft → approval → goods receipt). |
| Return for correction | Sales Manager sends an order back to the salesman with a reason; the salesman fixes and resubmits. |
| Scrap / write-off | Removing unusable stock after approval; posts a Scrap Write-off movement. |
| Sequence | The order in which a driver must deliver the stops of a dispatch. |
| Simulated | Works realistically in the demo without a real external system. |
| Supplier portal | Read-only dashboard for a supplier showing approved replenishment. |
| VIP customer | Customer flag; customer-app orders get High priority and VIP reports. |
| VMS | Vehicle Management System — vehicle and driver document compliance. |
| Zone | Group of pincodes served from a hub. |

## 19.2 Technical terms

| Term | Meaning |
|---|---|
| `can(user, key)` | Permission check used by routes and services (`src/config/permissions.js`). |
| Data version | `APP_DATA_VERSION` 8 — the LocalStorage schema version; older data is migrated on load. |
| Integration gateway | Optional backend proxy (`VITE_INTEGRATION_GATEWAY_URL`) for live email, WhatsApp, OCR and AI. Not configured in the demo. |
| LocalStorage key | Browser storage entry; all start with `bellomassi_` (chapter 01 §1.6). |
| `navigation.js` | Single list of 206 route entries driving menus, routes, breadcrumbs and access. |
| Permission key | Name of one capability, e.g. `orders.approve` (110 keys). |
| `ProtectedRoute` | Router guard that sends signed-out users to sign-in and unauthorised users to `/unauthorized`. |
| Service | Module in `src/services` that owns the business rules for one area and returns `{ ok, record }` or `{ ok: false, error }`. |
| `storageService` | Only module that reads / writes browser storage; JSON safety, in-memory fallback, transactions. |
| Timeline | Event history of an order (`bellomassi_order_timeline`) or dispatch (`bellomassi_dispatch_timeline`). |
| Transaction | Several LocalStorage keys written together (`storage.transaction`) so a step is all-or-nothing. |

## 19.3 Document numbering

| Record | Format / prefix |
|---|---|
| Order | BM-ORD-… |
| Dispatch | BM-DSP-… |
| Delivery note | BM-DN-YYYY-NNNNN |
| Invoice | BM-INV-YYYY-NNNNN (prefix, year and digits configurable) |
| Stock receipt | GRN-… |
| Stock transfer | TRF-… |
| Stock adjustment | ADJ-… |
| Scrap request | SCR-… |
| Replenishment request | RPL-… |
| Call | CALL-… |

## 19.4 Role abbreviations

SA Super Admin · AD Administrator · SE Sales Executive (SALESMAN) · SM Sales Manager · CS Customer Service · DP
Dispatcher · DR Driver · FI Finance Executive · WM Warehouse Manager · IE Inventory Executive · QA QA Manager · CU
Customer · SU Supplier.

## 19.5 Status label legend

Implemented · Partially Implemented · Simulated · UI Only · Coming Soon · Not Implemented · Not Verified — see the
README.
