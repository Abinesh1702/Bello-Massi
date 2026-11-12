# Architecture Diagrams

## Document control

| Field | Value |
|---|---|
| Document title | Architecture Diagrams |
| Document ID | BM-ARC-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | System Architecture |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Collect the architecture diagrams required for design review.

## Scope

Context, component, application, logical, order processing, data flow, deployment, network, authentication, integration, driver delivery, customer app and RBAC diagrams.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-ARC-001 — High-Level Design (HLD)](BM-ARC-001_High_Level_Design.md)
- [BM-ARC-002 — Low-Level Design (LLD)](BM-ARC-002_Low_Level_Design.md)
- [BM-DGM-001 — Diagram Catalogue and Visual Documentation](../21_DIAGRAMS_AND_VISUAL_DOCUMENTATION/BM-DGM-001_Diagram_Catalogue.md)

## Contents

- 1. System context diagram (DGM-19)
- 2. Component diagram (DGM-20)
- 3. Application / logical architecture diagram (DGM-01)
- 4. Order processing architecture (DGM-23)
- 5. Data flow diagram (DGM-12)
- 6. Deployment architecture diagram (DGM-13)
- 7. Network architecture (DGM-14)
- 8. Authentication flow diagram (DGM-15)
- 9. Integration architecture diagram (DGM-16)
- 10. Driver delivery architecture (DGM-21)
- 11. Customer application architecture (DGM-22)
- 12. RBAC diagram (DGM-10)

## 1. System context diagram (DGM-19)

Label: **VERIFIED (actors) / PROPOSED (external systems)**

```mermaid
flowchart TB
    SE[Salesman] --> SYS((Bellomassi))
    SM[Sales Manager] --> SYS
    CS[Customer Service] --> SYS
    DP[Dispatcher] --> SYS
    DR[Driver] --> SYS
    FI[Finance] --> SYS
    AD[Administrator] --> SYS
    CU[Customer] --> SYS
    SYS --> SAP[SAP]
    SYS --> MAPS[Maps / Routes]
    SYS --> MSG[SMS / WhatsApp]
    SYS --> MAIL[Email]
    SYS --> OCR[OCR]
```

## 2. Component diagram (DGM-20)

Label: **VERIFIED**

```mermaid
flowchart TB
    subgraph UI[Presentation]
        L[Layouts: App, Driver, Customer] --> PG[Pages - 134 files]
        PG --> CMP[Components - 121 files]
    end
    subgraph LOGIC[Logic]
        HK[Hooks - 19] --> SV[Services - 84]
        SV --> CFG[Config: navigation, roles, permissions, statuses]
    end
    subgraph DATA[Data]
        STS[storageService] --> LS[(LocalStorage)]
        SEED[Seed modules] --> STS
    end
    PG --> HK
    SV --> STS
    SV --> SIM[Simulators: GPS, OTP, email, WhatsApp, OCR, AI]
```

## 3. Application / logical architecture diagram (DGM-01)

Label: **VERIFIED (prototype) / PROPOSED (target)**

```mermaid
flowchart LR
    subgraph NOW[Prototype - VERIFIED]
        B1[Browser: React SPA] --> B2[Services in browser] --> B3[(LocalStorage)]
    end
    subgraph TARGET[Production - PROPOSED]
        C1[React web app] --> GW[Nginx / load balancer]
        C2[React Native Drivers App] --> GW
        GW --> API[Django REST API]
        GW --> WS[Django Channels]
        API --> PG[(PostgreSQL)]
        API --> RD[(Redis)]
        API --> OB[(Object storage)]
        WK[Celery workers] --> EXT[Maps, SMS / WhatsApp, Email, OCR, SAP]
        API --> WK
    end
    NOW -. migrate rules and UI .-> TARGET
```

## 4. Order processing architecture (DGM-23)

Label: **VERIFIED (logic) / PROPOSED (server)**

```mermaid
flowchart LR
    IN[Order input: office or customer app] --> VAL[validateOrder]
    VAL --> SUB[submitOrder: number, warnings, timeline]
    SUB --> CHK[getApprovalChecks: 6 checks]
    CHK --> DEC[approve / return / reject]
    DEC --> CON[consolidateOrder: 5 checks]
    CON --> RDY[markReadyForDispatch]
    RDY --> DSP[dispatch: create, assign, confirm - stock deducted]
    DSP --> DEL[deliveries]
```

## 5. Data flow diagram (DGM-12)

Label: **PROPOSED**

```mermaid
flowchart LR
    SE((Salesman)) -->|order| P1[1 Capture order]
    CU((Customer)) -->|order, OTP| P1
    P1 -->|order| DS1[(Orders)]
    DS1 --> P2[2 Approve and check credit]
    DS2[(Customers)] --> P2
    P2 -->|approved| P3[3 Consolidate]
    DS3[(Stock)] --> P3
    P3 --> P4[4 Plan and confirm dispatch]
    P4 -->|deduct| DS3
    P4 -->|deliveries| DS4[(Deliveries)]
    DS4 --> P5[5 Deliver with OTP and POD]
    DR((Driver)) --> P5
    P5 -->|GPS| DS5[(Tracking)]
    P5 -->|note| DS6[(Delivery notes)]
    DS6 -->|SMS / WhatsApp| CU
```

## 6. Deployment architecture diagram (DGM-13)

Label: **PROPOSED**

```mermaid
flowchart TB
    U[Users - browsers and phones] --> CDN[CDN - web app static files]
    U --> LB[Load balancer + WAF - HTTPS / WSS]
    subgraph VPC[Private network]
        LB --> N1[API container x2+]
        LB --> N2[Channels container x2]
        N1 --> PG[(Managed PostgreSQL - primary + standby)]
        N1 --> RD[(Managed Redis)]
        W1[Celery workers] --> PG
        W1 --> RD
        N2 --> RD
        N1 --> S3[(Object storage)]
    end
    W1 --> EXT[External providers]
    PG --> BK[(Backups + PITR, other region)]
```

## 7. Network architecture (DGM-14)

Label: **PROPOSED**

```mermaid
flowchart LR
    INET[Internet] --> WAF[WAF / DDoS protection]
    WAF --> LB[Public load balancer - 443 only]
    subgraph PUB[Public subnet]
        LB
        NAT[NAT gateway]
    end
    subgraph APP[Private app subnet]
        API[API / Channels / workers]
    end
    subgraph DATA[Private data subnet]
        DB[(PostgreSQL)]
        RD[(Redis)]
    end
    LB --> API
    API --> DB
    API --> RD
    API --> NAT --> EXT[Provider APIs - egress allow-list]
    ADM[Admins via VPN / bastion + MFA] --> APP
```

## 8. Authentication flow diagram (DGM-15)

Label: **PROPOSED**

```mermaid
sequenceDiagram
    actor U as User
    participant C as Web / mobile app
    participant A as Auth API
    participant DB as Database
    U->>C: identifier + password
    C->>A: POST /api/v1/auth/login
    A->>DB: find user, check status and lockout
    A->>A: verify Argon2id hash
    alt MFA required
        A-->>C: mfa_required
        U->>C: TOTP code
        C->>A: POST /api/v1/auth/mfa
    end
    A-->>C: access token (15 min) + refresh token (httpOnly cookie / secure storage)
    C->>A: API calls with Bearer token
    C->>A: POST /api/v1/auth/refresh when expired
    U->>C: Sign out
    C->>A: POST /api/v1/auth/logout - refresh token revoked
```

## 9. Integration architecture diagram (DGM-16)

Label: **PROPOSED**

```mermaid
flowchart LR
    API[Django services] --> OUT[(Outbox table)]
    OUT --> WK[Celery integration workers]
    WK --> MAPS[Google Maps / Routes]
    WK --> MSG[SMS / WhatsApp provider]
    WK --> MAIL[Email provider]
    WK --> OCR[OCR engine]
    WK --> SAP[SAP - stage 2]
    MSG -->|delivery receipts webhook| HK[Webhook endpoint]
    HK --> API
    WK --> LOG[(Integration log + retries + dead letter)]
```

## 10. Driver delivery architecture (DGM-21)

Label: **PROPOSED**

```mermaid
flowchart LR
    APP[React Native Drivers App] -->|HTTPS| API[Delivery API]
    APP -->|GPS every 10-15 s while active| TRK[Tracking API]
    TRK --> RD[(Redis channel layer)]
    TRK --> PG[(location_points)]
    RD --> WSA[Admin map - all vehicles]
    RD --> WSC[Customer map - own order only]
    API --> OTP[OTP service - hashed, rate limited]
    OTP --> MSG[SMS / WhatsApp]
    API --> POD[(Object storage - photo, signature)]
    API --> DN[Delivery note PDF worker] --> MSG
```

## 11. Customer application architecture (DGM-22)

Label: **VERIFIED (prototype) / PROPOSED (production)**

```mermaid
flowchart LR
    CUA[Customer app - /customer] --> CAS[customerAppService]
    CAS --> ORD[orderService.submitOrder - source customer_app]
    CAS --> CART[(customer_carts)]
    CUA --> TRK[Tracking - own order only]
    CUA --> DOCS[Delivery notes and invoices - linked customer]
    ORD --> APR[Sales Manager approval]
```

## 12. RBAC diagram (DGM-10)

Label: **VERIFIED (prototype) / PROPOSED (server enforcement)**

```mermaid
flowchart LR
    U[User] -->|has 1..n| R[Role]
    R -->|grants| P[Permission keys - 110]
    R -->|defines| SC[Data scope]
    R -->|defines| LP[Landing page]
    P --> NAV[Menus and routes - navigation.js]
    P --> SVC[Service checks - can user, key]
    SC --> Q[Record filters: own, linked customer, own deliveries, all ...]
    SVC --> ACT[Allowed action]
    Q --> DATA[Visible records]
```

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |