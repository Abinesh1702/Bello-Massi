---
id: "BM-FRD-AUTH"
title: "Functional Requirements — Authentication and Login"
folder: "04"
file: "BM-FRD-AUTH_Authentication_and_Login"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Authentication and Login"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Authentication and Login module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Authentication and Login module (/login, /driver/login, /customer/login, /forgot-password, /reset-password, /logout)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `AUTH` |
| Module name | Authentication and Login |
| Current implementation status | **Implemented with limitations (browser-only demo security)** |
| Main routes | `/login, /driver/login, /customer/login, /forgot-password, /reset-password, /logout` |
| Services / components | `authService, SessionWatcher, ProtectedRoute` |
| LocalStorage keys (prototype) | `bellomassi_demo_users, bellomassi_session, bellomassi_auth` |


## 2. Purpose

Sign-in for office, driver and customer apps; session, lockout, password reset and sign-out.

## 3. Business objectives

Only authorised, active users reach the workspace for their role; sessions are protected against idle use and guessing.

Related business requirements: BR-017, BR-029.

## 4. User roles

- Administrator
- All signed-in users
- Customer (portal / app)
- Driver
- Finance Executive
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): (public sign-in pages; profile pages need only a signed-in session). Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Change Password | `/account/change-password` | `—` |
| Sign Out | `/logout` | `—` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-AUTH-001 | P1 | The system shall authenticate office users by email or username and password and open the role landing page. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-AUTH-002 | P1 | The driver app shall accept mobile number, email or username as the identifier. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-AUTH-003 | P1 | The customer app shall accept mobile number, email or username as the identifier. | Customer (portal / app) | VERIFIED | Implemented and working (prototype) |
| FR-AUTH-004 | P1 | The system shall lock an account for the configured lockout period after the configured number of failed attempts (default 5 attempts, 15 minutes). | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-AUTH-005 | P1 | The system shall block sign-in for inactive accounts with a clear message. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-AUTH-006 | P1 | The system shall sign users out after the configured idle period (default 60 minutes). | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-AUTH-007 | P2 | "Keep me signed in" shall persist the session across browser restarts; otherwise the session ends with the tab. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-AUTH-008 | P2 | Users shall reset a forgotten password with a 6-digit code valid for 15 minutes. | All signed-in users | PROTOTYPE | Simulated in prototype |
| FR-AUTH-009 | P1 | Users shall be forced to change their password after an administrator reset when the setting is enabled. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-AUTH-010 | P1 | Sign-out shall return the user to the sign-in page of the app they were using. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-AUTH-011 | P1 | Every route shall require sign-in and the route's permission; unauthorised users see the Unauthorized page. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-AUTH-012 | P1 | Production authentication shall use server-side hashed passwords (Argon2/PBKDF2) and short-lived JWT access tokens with refresh tokens. | All signed-in users | PROPOSED | Planned (production) |
| FR-AUTH-013 | P2 | Privileged roles shall use multi-factor authentication (TOTP) in production. | Administrator, Super Admin, Finance Executive | PROPOSED | Planned (production) |

## 8. Input fields

Email or username (office) · mobile / email / username (driver, customer) · password · Keep me signed in · Remember username · reset code · new password + confirmation

## 9. Validation rules

- **RULE-001** — Account locks after 5 failed sign-ins for 15 minutes (configurable 3–20 / 1–1440). _(enforced by `authService.login`; message: "Too many failed attempts…")_
- **RULE-002** — Inactive accounts cannot sign in. _(enforced by `authService.login`; message: "This account is inactive…")_
- **RULE-003** — Session ends after 60 minutes idle (configurable 5–1440). _(enforced by `SessionWatcher`; message: Signed out.)_
- **RULE-004** — Password minimum length 8 with mixed characters (configurable). _(enforced by `authService.passwordPolicy`; message: Policy message.)_

## 10. Business rules

- FR-AUTH-001: expected behaviour — Valid credentials open the landing page of the user's role.
- FR-AUTH-002: expected behaviour — Driver signs in with +91 98400 11206 / Driver@123 and lands on /driver/dashboard.
- FR-AUTH-003: expected behaviour — Customer signs in with +91 98410 22310 / Customer@123 and lands on /customer/dashboard.
- FR-AUTH-004: expected behaviour — Sixth attempt shows "Too many failed attempts. This account is locked for 15 minutes."
- FR-AUTH-005: expected behaviour — "This account is inactive. Contact your administrator to reactivate it."
- FR-AUTH-006: expected behaviour — Session ends after inactivity; user returns to the sign-in page of the same app.
- FR-AUTH-007: expected behaviour — Session stored in localStorage when ticked, sessionStorage otherwise.
- FR-AUTH-009: expected behaviour — User is redirected to /account/change-password?required=1 until the password is changed.
- FR-AUTH-010: expected behaviour — Driver → /driver/login, customer → /customer/login, office → /login.
- FR-AUTH-011: expected behaviour — Opening /admin/users as Salesman shows /unauthorized.

## 11. Workflow

See {{ref:BM-WF-01}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Session: signed out → signed in → idle-expired / signed out. Account: active / inactive; temporarily locked. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None to users; audit entry ACCOUNT_LOCKED on lockout.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-AUTH-N01 | Wrong password | "The email/username or password is incorrect…"; failed attempt counted |
| TC-AUTH-N02 | Lockout after 5 failures | Account locked for 15 minutes; correct password refused until unlock |
| TC-AUTH-N03 | Inactive user | "This account is inactive…" |
| TC-AUTH-N04 | Unauthorised route | Unauthorized page; no data shown |
| TC-AUTH-N05 | Expired reset code | "This code has expired. Request a new code." |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_demo_users, bellomassi_session, bellomassi_auth`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Security events in Audit Log (`/admin/audit-logs`).

## 19. Audit requirements

Lockouts, password resets, forced password changes, sign-ins recorded in activity / audit logs. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-AUTH-001 | Valid credentials open the landing page of the user's role. | TC-AUTH-001, TC-AUTH-N01 |
| FR-AUTH-002 | Driver signs in with +91 98400 11206 / Driver@123 and lands on /driver/dashboard. | TC-AUTH-002 |
| FR-AUTH-003 | Customer signs in with +91 98410 22310 / Customer@123 and lands on /customer/dashboard. | TC-AUTH-003 |
| FR-AUTH-004 | Sixth attempt shows "Too many failed attempts. This account is locked for 15 minutes." | TC-AUTH-004, TC-AUTH-N02 |
| FR-AUTH-005 | "This account is inactive. Contact your administrator to reactivate it." | TC-AUTH-005, TC-AUTH-N03 |
| FR-AUTH-006 | Session ends after inactivity; user returns to the sign-in page of the same app. | TC-AUTH-006 |
| FR-AUTH-007 | Session stored in localStorage when ticked, sessionStorage otherwise. | TC-AUTH-007 |
| FR-AUTH-008 | Code is displayed on screen in the prototype (no email is sent). | TC-AUTH-008, TC-AUTH-N05 |
| FR-AUTH-009 | User is redirected to /account/change-password?required=1 until the password is changed. | TC-AUTH-009 |
| FR-AUTH-010 | Driver → /driver/login, customer → /customer/login, office → /login. | TC-AUTH-010 |
| FR-AUTH-011 | Opening /admin/users as Salesman shows /unauthorized. | TC-AUTH-011, TC-AUTH-N04 |
| FR-AUTH-012 | No credentials or password hashes are stored in the browser. | TC-AUTH-012 |
| FR-AUTH-013 | Admin sign-in requires a second factor. | TC-AUTH-013 |

## 21. Current implementation status

**Implemented with limitations (browser-only demo security).** Labels: VERIFIED 10, PROTOTYPE 1, PROPOSED 2. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Server-side authentication (Django), Argon2id hashing, JWT + refresh tokens, MFA for privileged roles, SSO (Azure AD) option, SMS / email delivery of reset codes, device binding for drivers.

- FR-AUTH-012 (PROPOSED): Production authentication shall use server-side hashed passwords (Argon2/PBKDF2) and short-lived JWT access tokens with refresh tokens.
- FR-AUTH-013 (PROPOSED): Privileged roles shall use multi-factor authentication (TOTP) in production.
