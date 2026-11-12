"""Central diagram catalogue: id -> (title, label, mermaid code or ('ch', NN, idx) from docs/workflow)."""
D = {
'DGM-01': ('Overall System Architecture (prototype and target)', 'VERIFIED (prototype) / PROPOSED (target)', """flowchart LR
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
    NOW -. migrate rules and UI .-> TARGET"""),
'DGM-02': ('Business Process Architecture', 'VERIFIED', """flowchart LR
    S[Sales: capture and approve] --> C[Customer Service: verify and consolidate] --> D[Dispatch: plan, assign, confirm] --> R[Road: driver delivers with OTP] --> P[Proof: delivery note]
    P --> F[Finance: invoice - scope to confirm]
    M[Master data and rules - Admin Panel] --> S
    M --> D
    W[Warehouse: stock, scrap, replenishment - extension] --> D
    R --> X[Exceptions: review, return, re-queue] --> D
    A[Analytics: dashboards, reports, forecasts] -.-> S
    A -.-> D"""),
'DGM-03': ('Order-to-Delivery Flowchart', 'VERIFIED', ('ch', '06', 0)),
'DGM-04': ('Order Status Lifecycle', 'VERIFIED', ('ch', '17', 0)),
'DGM-05': ('Approval Workflow', 'VERIFIED', ('ch', '07', 0)),
'DGM-06': ('Dispatch Workflow', 'VERIFIED', ('ch', '11', 0)),
'DGM-07': ('Driver Delivery Workflow', 'VERIFIED (GPS / OTP delivery simulated)', ('ch', '08', 0)),
'DGM-08': ('Customer Order Workflow', 'VERIFIED (customer app scope PENDING CONFIRMATION)', ('ch', '09', 0)),
'DGM-09': ('Role Interaction Diagram', 'VERIFIED', ('ch', '04', 0)),
'DGM-10': ('RBAC Diagram', 'VERIFIED (prototype) / PROPOSED (server enforcement)', """flowchart LR
    U[User] -->|has 1..n| R[Role]
    R -->|grants| P[Permission keys - 110]
    R -->|defines| SC[Data scope]
    R -->|defines| LP[Landing page]
    P --> NAV[Menus and routes - navigation.js]
    P --> SVC[Service checks - can user, key]
    SC --> Q[Record filters: own, linked customer, own deliveries, all ...]
    SVC --> ACT[Allowed action]
    Q --> DATA[Visible records]"""),
'DGM-11': ('ER Diagram (overview)', 'PROPOSED', """erDiagram
    customers ||--o{ orders : places
    users ||--o{ orders : "salesman"
    hubs ||--o{ orders : fulfils
    orders ||--|{ order_items : contains
    products ||--o{ order_items : "ordered as"
    orders ||--o{ order_approvals : decided
    orders ||--o| consolidations : verified
    dispatches ||--|{ dispatch_stops : sequences
    orders ||--o{ dispatch_stops : "planned in"
    drivers ||--o{ dispatches : drives
    vehicles ||--o{ dispatches : carries
    dispatches ||--|{ deliveries : creates
    deliveries ||--o{ delivery_otps : verifies
    deliveries ||--o| proofs_of_delivery : evidences
    deliveries ||--o| delivery_notes : documents
    deliveries ||--o{ tracking_sessions : tracks
    hubs ||--o{ stock_items : holds
    products ||--o{ stock_items : stocked
    stock_items ||--o{ stock_movements : ledger
    orders ||--o{ invoices : bills"""),
'DGM-12': ('Data Flow Diagram', 'PROPOSED', """flowchart LR
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
    DS6 -->|SMS / WhatsApp| CU"""),
'DGM-13': ('Deployment Architecture', 'PROPOSED', """flowchart TB
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
    PG --> BK[(Backups + PITR, other region)]"""),
'DGM-14': ('Network Architecture', 'PROPOSED', """flowchart LR
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
    ADM[Admins via VPN / bastion + MFA] --> APP"""),
'DGM-15': ('Authentication Flow (production)', 'PROPOSED', """sequenceDiagram
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
    C->>A: POST /api/v1/auth/logout - refresh token revoked"""),
'DGM-16': ('Integration Architecture', 'PROPOSED', """flowchart LR
    API[Django services] --> OUT[(Outbox table)]
    OUT --> WK[Celery integration workers]
    WK --> MAPS[Google Maps / Routes]
    WK --> MSG[SMS / WhatsApp provider]
    WK --> MAIL[Email provider]
    WK --> OCR[OCR engine]
    WK --> SAP[SAP - stage 2]
    MSG -->|delivery receipts webhook| HK[Webhook endpoint]
    HK --> API
    WK --> LOG[(Integration log + retries + dead letter)]"""),
'DGM-17': ('CI/CD Pipeline', 'PROPOSED', """flowchart LR
    DEV[Developer push / PR] --> CI[CI: lint, unit tests, build]
    CI --> SEC[SAST, dependency scan, image scan]
    SEC --> IMG[Build images + web bundle]
    IMG --> TEST[Deploy to test - automatic]
    TEST --> E2E[API + E2E tests]
    E2E --> STG[Deploy to staging - on release tag]
    STG --> UAT[UAT / smoke tests]
    UAT --> APPR{Release approval}
    APPR -->|approved| PROD[Deploy to production - blue/green]
    PROD --> MON[Monitoring and rollback if needed]"""),
'DGM-18': ('Backup and Recovery Architecture', 'PROPOSED', """flowchart LR
    PG[(PostgreSQL primary)] -->|streaming| SB[(Standby)]
    PG -->|WAL archive continuous| WAL[(WAL archive)]
    PG -->|daily snapshot| SNAP[(Snapshots - 35 days)]
    OBJ[(Object storage)] -->|versioning + replication| OBJ2[(Replica bucket other region)]
    WAL --> PITR[Point-in-time restore]
    SNAP --> PITR
    PITR --> DR[DR environment - RTO 4h, RPO 15 min]"""),
'DGM-19': ('System Context Diagram', 'VERIFIED (actors) / PROPOSED (external systems)', """flowchart TB
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
    SYS --> OCR[OCR]"""),
'DGM-20': ('Component Diagram (prototype)', 'VERIFIED', """flowchart TB
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
    SV --> SIM[Simulators: GPS, OTP, email, WhatsApp, OCR, AI]"""),
'DGM-21': ('Driver Delivery Architecture (production)', 'PROPOSED', """flowchart LR
    APP[React Native Drivers App] -->|HTTPS| API[Delivery API]
    APP -->|GPS every 10-15 s while active| TRK[Tracking API]
    TRK --> RD[(Redis channel layer)]
    TRK --> PG[(location_points)]
    RD --> WSA[Admin map - all vehicles]
    RD --> WSC[Customer map - own order only]
    API --> OTP[OTP service - hashed, rate limited]
    OTP --> MSG[SMS / WhatsApp]
    API --> POD[(Object storage - photo, signature)]
    API --> DN[Delivery note PDF worker] --> MSG"""),
'DGM-22': ('Customer Application Architecture', 'VERIFIED (prototype) / PROPOSED (production)', """flowchart LR
    CUA[Customer app - /customer] --> CAS[customerAppService]
    CAS --> ORD[orderService.submitOrder - source customer_app]
    CAS --> CART[(customer_carts)]
    CUA --> TRK[Tracking - own order only]
    CUA --> DOCS[Delivery notes and invoices - linked customer]
    ORD --> APR[Sales Manager approval]"""),
'DGM-23': ('Order Processing Architecture', 'VERIFIED (logic) / PROPOSED (server)', """flowchart LR
    IN[Order input: office or customer app] --> VAL[validateOrder]
    VAL --> SUB[submitOrder: number, warnings, timeline]
    SUB --> CHK[getApprovalChecks: 6 checks]
    CHK --> DEC[approve / return / reject]
    DEC --> CON[consolidateOrder: 5 checks]
    CON --> RDY[markReadyForDispatch]
    RDY --> DSP[dispatch: create, assign, confirm - stock deducted]
    DSP --> DEL[deliveries]"""),
}
