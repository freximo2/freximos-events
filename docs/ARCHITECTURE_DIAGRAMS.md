# VibraMeet Visual Architecture Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VIBRAMEET PLATFORM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────┐          ┌──────────────────────────────┐   │
│  │    FRONTEND (React 19)   │          │   BACKEND (Node.js/Express) │   │
│  │                          │          │                              │   │
│  │  ┌────────────────────┐  │          │  ┌──────────────────────┐   │   │
│  │  │  Pages             │  │          │  │  Controllers         │   │   │
│  │  ├────────────────────┤  │          │  ├──────────────────────┤   │   │
│  │  │ • Home             │  │          │  │ • auth               │   │   │
│  │  │ • Login/Register   │  │          │  │ • users              │   │   │
│  │  │ • Events           │  │          │  │ • events             │   │   │
│  │  │ • EventDetail      │  │          │  │ • registrations      │   │   │
│  │  │ • MyRegistrations  │  │          │  │ • payments           │   │   │
│  │  │ • Payments         │  │          │  │ • penalties          │   │   │
│  │  │ • Requests         │  │          │  │ • requests           │   │   │
│  │  │ • Stats            │  │          │  │ • notifications      │   │   │
│  │  │ • AdminDashboard   │  │          │  │ • stats              │   │   │
│  │  │ • AdminSpaces      │  │          │  │ • spaces             │   │   │
│  │  │ • Groups           │  │          │  │ • groups             │   │   │
│  │  │ • Sponsors         │  │          │  │ • sponsors           │   │   │
│  │  │ • Clients          │  │          │  │ • clients            │   │   │
│  │  └────────────────────┘  │          │  └──────────────────────┘   │   │
│  │                          │          │                              │   │
│  │  ┌────────────────────┐  │          │  ┌──────────────────────┐   │   │
│  │  │  Components        │  │          │  │  Middleware          │   │   │
│  │  ├────────────────────┤  │          │  ├──────────────────────┤   │   │
│  │  │ • Navbar           │  │          │  │ • authenticate (JWT) │   │   │
│  │  │ • NotificationBell │  │          │  │ • authorize (roles)  │   │   │
│  │  │ • ProtectedRoute   │  │          │  │ • validate (express)│   │   │
│  │  │ • LocationPicker   │  │          │  │ • error handling     │   │   │
│  │  └────────────────────┘  │          │  └──────────────────────┘   │   │
│  │                          │          │                              │   │
│  │  ┌────────────────────┐  │          │  ┌──────────────────────┐   │   │
│  │  │  Services          │  │          │  │  Database (Prisma)   │   │   │
│  │  ├────────────────────┤  │          │  ├──────────────────────┤   │   │
│  │  │ • api.js (HTTP)    │  │ HTTP     │  │ • User               │   │   │
│  │  │ • AuthContext      │◄────────────┤• • Event              │   │   │
│  │  │ • eventImage       │  │  (proxy) │  │ • Registration       │   │   │
│  │  └────────────────────┘  │          │  │ • Payment            │   │   │
│  │                          │          │  │ • Penalty            │   │   │
│  │  ┌────────────────────┐  │          │  │ • Notification       │   │   │
│  │  │  State Management  │  │          │  │ • Request (PQRS)     │   │   │
│  │  ├────────────────────┤  │          │  │ • Space              │   │   │
│  │  │ • AuthContext      │  │          │  │ • Group              │   │   │
│  │  │ • localStorage     │  │          │  │ • Sponsor/Client     │   │   │
│  │  │ • JWT token        │  │          │  └──────────────────────┘   │   │
│  │  └────────────────────┘  │          │                              │   │
│  │                          │          │  ┌──────────────────────┐   │   │
│  │  http://localhost:5173   │          │  │  External Services   │   │   │
│  └──────────────────────────┘          │  ├──────────────────────┤   │   │
│                                        │  │ • bcryptjs (hash)    │   │   │
│                                        │  │ • JWT (auth)         │   │   │
│                                        │  │ • Multer (upload)    │   │   │
│                                        │  │ • CORS               │   │   │
│                                        │  └──────────────────────┘   │   │
│                                        │                              │   │
│                                        │  http://localhost:3000      │   │
│                                        └──────────────────────────────┘   │
│                                                    │                     │
│                                                    │                     │
│         ┌──────────────────────────────────────────┴──────────────────┐  │
│         │                                                             │  │
│         ▼                                                             ▼  │
│  ┌────────────────────────┐                          ┌────────────────┐  │
│  │  PostgreSQL 16         │                          │  Docker        │  │
│  │  (postgres:16-alpine)  │                          │  Volumes:      │  │
│  │                        │                          │  • pgdata      │  │
│  │  Databases:            │                          │  • uploads_data│  │
│  │  • vibrameet           │                          │                │  │
│  │                        │                          │  Port mapping: │  │
│  │  Schema:               │                          │  • 5432:5432   │  │
│  │  • users               │                          │  • 3000:3000   │  │
│  │  • events              │                          │  • 5173:5173   │  │
│  │  • registrations       │                          │                │  │
│  │  • payments            │                          └────────────────┘  │
│  │  • penalties           │                                              │
│  │  • notifications       │                          ┌────────────────┐  │
│  │  • requests            │                          │  Network       │  │
│  │  • spaces              │                          │  • bridge:     │  │
│  │  • groups              │                          │    vibrameet   │  │
│  │  • sponsors            │                          │  • All services│  │
│  │  • clients             │                          │    connected   │  │
│  │  • ...and more         │                          └────────────────┘  │
│  │                        │                                              │
│  │  Port: 5432            │                                              │
│  │  User: vibrameet       │                                              │
│  │  Pass: vibrameet_secret│                                              │
│  └────────────────────────┘                                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HTTP REQUEST FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FRONTEND                                                               │
│  ┌─────────────────────────┐                                          │
│  │ User Action             │                                          │
│  │ (Click, Submit, etc)    │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ Event Handler           │                                          │
│  │ (React Component)       │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ API Service             │                                          │
│  │ (api.js)                │                                          │
│  │ • Build request         │                                          │
│  │ • Add JWT token         │                                          │
│  │ • Set headers           │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               │ HTTP/POST/GET/PUT/DELETE                              │
│               │                                                        │
│               ▼                                                        │
│  ════════════════════════════════════════════════════════════          │
│                    NETWORK (localhost:3000)                            │
│  ════════════════════════════════════════════════════════════          │
│               │                                                        │
│               ▼                                                        │
│  BACKEND                                                              │
│  ┌─────────────────────────┐                                          │
│  │ Express Router          │                                          │
│  │ Match route pattern     │                                          │
│  │ /api/events/123         │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ Middleware Chain        │                                          │
│  │ 1. CORS                 │                                          │
│  │ 2. authenticate (JWT)   │                                          │
│  │ 3. authorize (role)     │                                          │
│  │ 4. validate (express)   │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ Controller Function     │                                          │
│  │ • Parse request data    │                                          │
│  │ • Business logic        │                                          │
│  │ • Call Prisma methods   │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ Prisma ORM              │                                          │
│  │ • Build SQL query       │                                          │
│  │ • Handle relations      │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               │ SQL Query                                             │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ PostgreSQL              │                                          │
│  │ • Execute query         │                                          │
│  │ • Return results        │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               │ Result Set                                            │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ Prisma (Parse)          │                                          │
│  │ • Convert rows to obj   │                                          │
│  │ • Handle relations      │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ Controller (Return)     │                                          │
│  │ • res.json(data)        │                                          │
│  │ • Set status code       │                                          │
│  │ • Set headers           │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               │ HTTP Response                                         │
│               │ JSON + Status Code                                    │
│               │                                                        │
│               ▼                                                        │
│  ════════════════════════════════════════════════════════════          │
│                    NETWORK (HTTP 200/400/500)                         │
│  ════════════════════════════════════════════════════════════          │
│               │                                                        │
│               ▼                                                        │
│  FRONTEND                                                              │
│  ┌─────────────────────────┐                                          │
│  │ Response Handler        │                                          │
│  │ • Parse JSON            │                                          │
│  │ • Check status          │                                          │
│  │ • Handle errors         │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ State Update            │                                          │
│  │ • AuthContext           │                                          │
│  │ • Component state       │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ Re-render Component     │                                          │
│  │ • Update UI             │                                          │
│  │ • Display data          │                                          │
│  └────────────┬────────────┘                                          │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐                                          │
│  │ User Sees Result        │                                          │
│  │ ✓ Success / ✗ Error    │                                          │
│  └─────────────────────────┘                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow (JWT)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         JWT AUTHENTICATION FLOW                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. LOGIN/REGISTER                                                      │
│     ┌──────────────┐                                                   │
│     │ User submits │                                                   │
│     │ email + pass │                                                   │
│     └────────┬─────┘                                                   │
│              │                                                         │
│              ▼                                                         │
│     POST /api/auth/login                                               │
│       {                                                                │
│         "email": "user@example.com",                                   │
│         "password": "mypassword"                                       │
│       }                                                                │
│              │                                                         │
│              ▼                                                         │
│     ┌──────────────────────────┐                                       │
│     │ Backend:                 │                                       │
│     │ • Find user by email     │                                       │
│     │ • Compare password hash  │                                       │
│     │ • Generate JWT token     │                                       │
│     │   jwt.sign({             │                                       │
│     │     id: user.id,         │                                       │
│     │     email,               │                                       │
│     │     role: ADMIN          │                                       │
│     │   }, JWT_SECRET)         │                                       │
│     └────────┬─────────────────┘                                       │
│              │                                                         │
│              ▼                                                         │
│     Response 200 OK                                                    │
│     {                                                                  │
│       "token": "eyJhbGc...",   ◄─── JWT Token (3 parts)               │
│       "user": {                                                        │
│         "id": 1,                                                       │
│         "email": "user@example.com",                                   │
│         "role": "ADMIN"                                                │
│       }                                                                │
│     }                                                                  │
│              │                                                         │
│              ▼                                                         │
│  2. STORE TOKEN (Frontend)                                             │
│     ┌──────────────────────┐                                           │
│     │ localStorage.setItem( │                                          │
│     │   'token',           │                                          │
│     │   'eyJhbGc...'       │                                          │
│     │ )                    │                                          │
│     └──────────────────────┘                                           │
│                                                                         │
│  3. AUTHENTICATED REQUESTS                                             │
│     ┌──────────────────────┐                                           │
│     │ GET /api/events      │                                           │
│     │ Header:              │                                           │
│     │ Authorization:       │                                           │
│     │ Bearer eyJhbGc...    │ ◄─── Token sent in header                │
│     └────────┬─────────────┘                                           │
│              │                                                         │
│              ▼                                                         │
│     ┌──────────────────────────┐                                       │
│     │ Backend Middleware:      │                                       │
│     │ • Extract token          │                                       │
│     │ • jwt.verify(token,      │                                       │
│     │   JWT_SECRET)            │                                       │
│     │ • If valid:              │                                       │
│     │   req.user = {           │                                       │
│     │     id: 1,               │                                       │
│     │     email,               │                                       │
│     │     role: ADMIN          │                                       │
│     │   }                       │                                       │
│     │ • If invalid:            │                                       │
│     │   Return 401 Unauthorized│                                       │
│     └────────┬─────────────────┘                                       │
│              │                                                         │
│              ▼                                                         │
│     ┌──────────────────────────┐                                       │
│     │ Authorization Middleware │                                       │
│     │ • Check req.user.role    │                                       │
│     │ • Verify permissions     │                                       │
│     │ • Grant/Deny access      │                                       │
│     └────────┬─────────────────┘                                       │
│              │                                                         │
│              ▼                                                         │
│     • Request allowed → Continue to controller                         │
│     • Request denied → Return 403 Forbidden                            │
│                                                                         │
│  4. TOKEN EXPIRATION                                                   │
│     • Token has exp claim                                              │
│     • Middleware checks: iat < exp < now                               │
│     • If expired → Return 401                                          │
│     • Frontend redirects to /login                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Event Lifecycle State Machine

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    EVENT STATUS LIFECYCLE                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────┐                                                            │
│  │  DRAFT  │  (Admin creating event, not published)                    │
│  └────┬────┘                                                            │
│       │ (Admin clicks "Publish")                                        │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────┐                   │
│  │ ACTIVE                                          │                   │
│  │ ┌─────────────────────────────────────────────┐ │                   │
│  │ │ Users can:                                  │ │                   │
│  │ │ • Register                                  │ │                   │
│  │ │ • Join waitlist                             │ │                   │
│  │ │ • Pay for event                             │ │                   │
│  │ │ • View event details                        │ │                   │
│  │ │ • Cancel registration                       │ │                   │
│  │ │                                             │ │                   │
│  │ │ Admin can:                                  │ │                   │
│  │ │ • Modify event details                      │ │                   │
│  │ │ • Manage registrations                      │ │                   │
│  │ │ • Accept/reject pending                     │ │                   │
│  │ └─────────────────────────────────────────────┘ │                   │
│  └────┬──────────────────────────────┬──────────────┘                   │
│       │                              │                                 │
│       │ (Admin cancels)              │ (Event date passes)             │
│       │                              │ (Auto-transition)               │
│       ▼                              ▼                                 │
│  ┌──────────────┐              ┌──────────────┐                        │
│  │  CANCELLED   │              │  ARCHIVED    │                        │
│  │              │              │              │                        │
│  │ • All        │              │ • Read-only  │                        │
│  │   registrations             │ • Visible    │                        │
│  │   cancelled  │              │   to admin   │                        │
│  │ • All        │              │ • View stats │                        │
│  │   payments   │              │ • History    │                        │
│  │   refunded   │              │              │                        │
│  │ • All        │              │ No new:      │                        │
│  │   users      │              │ • Registr.   │                        │
│  │   notified   │              │ • Payments   │                        │
│  │              │              │ • Changes    │                        │
│  └──────────────┘              └──────────────┘                        │
│       │                              │                                 │
│       │                              │                                 │
│       └──────────┬───────────────────┘                                 │
│                  │                                                     │
│                  │ (Visible in history only)                           │
│                  ▼                                                     │
│          ┌──────────────────────┐                                      │
│          │ INACTIVE (Archived or│                                      │
│          │ Cancelled)           │                                      │
│          │ ┌──────────────────┐ │                                      │
│          │ │ Only admins see: │ │                                      │
│          │ │ • Past stats     │ │                                      │
│          │ │ • User list      │ │                                      │
│          │ │ • Revenue        │ │                                      │
│          │ └──────────────────┘ │                                      │
│          └──────────────────────┘                                      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Registration Status Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION STATUS FLOW                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER CLICKS "INSCRIBIRSE"                                              │
│                │                                                        │
│                ▼                                                        │
│  ┌──────────────────────────┐                                           │
│  │ Check Event Capacity     │                                           │
│  └────┬─────────────────────┘                                           │
│       │                                                                 │
│       ├─ Spots Available?                                               │
│       │   │                                                             │
│       │   ├─ YES ─────────────────────┐                                │
│       │   │                           │                                │
│       │   │   ┌────────────────────┐  │                                │
│       │   │   │ Status: PENDING    │  │                                │
│       │   │   │ (Waiting for pay)  │  │                                │
│       │   │   └─────┬──────────────┘  │                                │
│       │   │         │                 │                                │
│       │   │         ▼                 │                                │
│       │   │   User pays ──┐           │                                │
│       │   │                │          │                                │
│       │   │                ▼          │                                │
│       │   │   ┌─────────────────────┐ │                                │
│       │   │   │ Status: CONFIRMED   │ │                                │
│       │   │   │ (Registered!)       │ │                                │
│       │   │   └─────────────────────┘ │                                │
│       │   │                           │                                │
│       │   └─ NO ──────────────────────┘                                │
│       │       │                                                        │
│       │       ▼                                                        │
│       │   ┌────────────────────┐                                       │
│       │   │ Status: WAITLISTED │                                       │
│       │   │ (On queue)         │                                       │
│       │   └─────┬──────────────┘                                       │
│       │         │                                                      │
│       │         │ Someone cancels ──┐                                  │
│       │         │                   │                                  │
│       │         │ pickBestWaitlisted() ◄──┐                            │
│       │         │   (highest activity)    │                            │
│       │         │                   │     │                            │
│       │         ▼                   │     │                            │
│       │   ┌────────────────────┐   │     │                            │
│       │   │ Status: PENDING    │   │     │                            │
│       │   │ (Promoted!)        │   │     │                            │
│       │   └────────────────────┘   │     │                            │
│       │                            └─────┘                            │
│       │                                                                 │
│       └─ Admin rejects ────────────────────┐                           │
│                                            │                           │
│                                            ▼                           │
│                                   ┌────────────────┐                   │
│                                   │ Status:        │                   │
│                                   │ REJECTED       │                   │
│                                   │ (Denied)       │                   │
│                                   └────────────────┘                   │
│                                                                          │
│  ANY STATUS ── User cancels──> ┌────────────────┐                      │
│                                │ Status:        │                      │
│                                │ CANCELLED      │                      │
│                                │ (Withdrawn)    │                      │
│                                └────────────────┘                      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Payment Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT PROCESSING FLOW                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Registration created with status=PENDING                               │
│           │                                                             │
│           ▼                                                             │
│  Payment record created                                                 │
│  ┌─────────────────────────────────────────────┐                       │
│  │ Type: FULL | ADVANCE | CUSTOM               │                       │
│  │ Amount: Decimal(10,2)                       │                       │
│  │ Status: PENDING                             │                       │
│  │ Reference: null (until completed)           │                       │
│  └────────┬────────────────────────────────────┘                       │
│           │                                                             │
│           ▼                                                             │
│  User navigates to Payment form                                         │
│  ┌─────────────────────────────────────────────┐                       │
│  │ Show payment options:                       │                       │
│  │                                             │                       │
│  │ • FULL: 100% of event price                 │                       │
│  │   Price: $100 → Pay: $100                   │                       │
│  │                                             │                       │
│  │ • ADVANCE: 50% of event price               │                       │
│  │   Price: $100 → Pay: $50 (min)              │                       │
│  │                                             │                       │
│  │ • CUSTOM: Custom amount (30-70%)            │                       │
│  │   Price: $100 → Pay: $30-70                 │                       │
│  └────────┬────────────────────────────────────┘                       │
│           │                                                             │
│           ├─ User selects FULL ────────────────┐                       │
│           │                                    │                       │
│           │  ┌────────────────────────────┐   │                       │
│           │  │ Amount: $100               │   │                       │
│           │  │ Submit Payment             │   │                       │
│           │  └────────┬───────────────────┘   │                       │
│           │           │                       │                       │
│           │           ▼                       │                       │
│           │  Payment Processed                │                       │
│           │  └────────┬───────────────────┐   │                       │
│           │           │                   │   │                       │
│           │           ▼                   │   │                       │
│           │  ┌─────────────────────────┐  │   │                       │
│           │  │ Status: COMPLETED       │  │   │                       │
│           │  │ Reference: REF-123-4567 │  │   │                       │
│           │  └────────┬────────────────┘  │   │                       │
│           │           │                   │   │                       │
│           │           ▼                   │   │                       │
│           │  Registration: CONFIRMED     │   │                       │
│           │  (User is signed up!)         │   │                       │
│           │                              │   │                       │
│           ├─ User selects ADVANCE ──────────┤                        │
│           │                              │   │                       │
│           │  ┌────────────────────────────┐  │                       │
│           │  │ Amount: $50 (min)          │  │                       │
│           │  │ Submit Payment             │  │                       │
│           │  └────────┬───────────────────┘  │                       │
│           │           │                   │  │                       │
│           │           ▼                   │  │                       │
│           │  Payment Processing...        │  │                       │
│           │  └────────┬───────────────────┘  │                       │
│           │           │                   │  │                       │
│           │           ▼                   │  │                       │
│           │  ┌─────────────────────────┐  │  │                       │
│           │  │ Status: PENDING         │  │  │                       │
│           │  │ Notes: "Partial paid,   │  │  │                       │
│           │  │         balance due"    │  │  │                       │
│           │  └────────┬────────────────┘  │  │                       │
│           │           │                   │  │                       │
│           │           ▼                   │  │                       │
│           │  Registration: PENDING      │  │                       │
│           │  (Awaiting final payment)   │  │                       │
│           │                              │  │                       │
│           └─ User selects CUSTOM ──────────┤                        │
│                                            │                       │
│  ┌─────────────────────────────────────────┴──┐                      │
│  │ Amount validation: must be 30-70% of price │                      │
│  │ Price: $100 → Valid: $30-$70               │                      │
│  └────────┬─────────────────────────────────┘                       │
│           │                                                          │
│           ├─ Valid: Submit Payment ─┐                               │
│           │                         │                               │
│           │  Status: PENDING or     │                               │
│           │  COMPLETED (user choice)│                               │
│           │                         │                               │
│           ▼                         ▼                               │
│  Payment recorded in database                                       │
│  Registration status updated based on payment type                 │
│                                                                      │
│  └─ Invalid: Show error ─┐                                         │
│                          │                                         │
│                          ▼                                         │
│                  "Invalid amount. Must be                          │
│                   between $30-70"                                  │
│                                                                      │
│  PAYMENT CANCELLATION                                              │
│  ────────────────────                                              │
│  │                                                                  │
│  └─ Event cancelled                                                │
│     ├─ All payments refunded                                       │
│     ├─ Status: CANCELLED                                           │
│     └─ Registration cancelled                                      │
│                                                                      │
│  └─ User cancels registration                                      │
│     ├─ Payment refunded (if COMPLETED)                             │
│     ├─ Status: CANCELLED                                           │
│     └─ Registration: CANCELLED                                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Penalty System Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    PENALTY APPLICATION FLOW                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Event date passes                                                      │
│        │                                                               │
│        ▼                                                               │
│  Admin Reviews Attendance                                              │
│        │                                                               │
│        ├─ User attended ──> No action                                  │
│        │                                                               │
│        └─ User didn't show ─────────────────┐                          │
│                                             │                          │
│                                             ▼                          │
│  Admin marks as NO_SHOW                                                │
│  ┌──────────────────────────────────────────┐                          │
│  │ Penalty record created:                  │                          │
│  │ • Type: NO_SHOW                          │                          │
│  │ • Reason: (admin notes)                  │                          │
│  │ • Active: true                           │                          │
│  │ • ExpiresAt: now + 5 days                │                          │
│  └────────┬─────────────────────────────────┘                          │
│           │                                                            │
│           ▼                                                            │
│  Update User.penalizedUntil = ExpiresAt                                │
│           │                                                            │
│           ▼                                                            │
│  BLOCKED STATE DURING PENALTY                                          │
│  ┌──────────────────────────────────────────┐                          │
│  │ User cannot:                             │                          │
│  │ • Register for new events                │                          │
│  │ • Join waitlists                         │                          │
│  │                                          │                          │
│  │ User can:                                │                          │
│  │ • View events (greyed out)               │                          │
│  │ • View profile                           │                          │
│  │ • See penalty expiration date            │                          │
│  │                                          │                          │
│  │ UI shows: "You're penalized until        │                          │
│  │            [date]. Reason: [reason]"     │                          │
│  └────────┬─────────────────────────────────┘                          │
│           │                                                            │
│           │ 5 days pass (ExpiresAt reached)                            │
│           │                                                            │
│           ▼                                                            │
│  AUTO-EXPIRE (or manual clear)                                         │
│  ┌──────────────────────────────────────────┐                          │
│  │ • Update Penalty.active = false           │                          │
│  │ • Set User.penalizedUntil = null         │                          │
│  │ • Penalty record kept for history        │                          │
│  └────────┬─────────────────────────────────┘                          │
│           │                                                            │
│           ▼                                                            │
│  PENALTY CLEARED                                                       │
│  ┌──────────────────────────────────────────┐                          │
│  │ User can:                                │                          │
│  │ • Register for events again              │                          │
│  │ • Join waitlists                         │                          │
│  │ • Full access restored                   │                          │
│  │                                          │                          │
│  │ Penalty visible in:                      │                          │
│  │ • Stats (historical)                     │                          │
│  │ • Admin view                             │                          │
│  │ • User history                           │                          │
│  └──────────────────────────────────────────┘                          │
│                                                                          │
│  MULTIPLE PENALTIES                                                    │
│  ──────────────────                                                    │
│  • User can receive multiple penalties                                 │
│  • penalizedUntil = latest expiration date                             │
│  • Blocked until ALL penalties expire                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Key Tables)

```
USER
├── id (PK)
├── email (UNIQUE)
├── password (hashed)
├── name
├── phone
├── address
├── photo (URL)
├── emergencyContact
├── role (USER|ADMIN|SUPER_ADMIN)
├── penalizedUntil (DateTime, nullable)
├── createdAt
└── updatedAt
    │
    ├─→ Events (1:Many)
    ├─→ Registrations (1:Many)
    ├─→ Payments (1:Many)
    ├─→ Notifications (1:Many)
    └─→ Penalties (1:Many)

EVENT
├── id (PK)
├── name
├── description
├── type (PUBLIC|PRIVATE)
├── category (FUTBOL|BASKETBALL|...)
├── status (DRAFT|ACTIVE|ARCHIVED|CANCELLED)
├── date (DateTime)
├── endDate (DateTime, nullable)
├── location
├── latitude, longitude
├── maxPlayers
├── price (Decimal 10,2)
├── image (URL)
├── creatorId (FK→User)
├── spaceId (FK→Space, nullable)
├── createdAt
└── updatedAt
    │
    ├─→ Registrations (1:Many)
    ├─→ Payments (1:Many)
    ├─→ Penalties (1:Many)
    └─→ Invitations (1:Many)

REGISTRATION
├── id (PK)
├── userId (FK→User)
├── eventId (FK→Event)
├── status (PENDING|CONFIRMED|REJECTED|CANCELLED|WAITLISTED)
├── createdAt
└── updatedAt
    │
    └─→ Payment (1:1)

PAYMENT
├── id (PK)
├── userId (FK→User)
├── eventId (FK→Event)
├── registrationId (FK→Registration)
├── amount (Decimal 10,2)
├── type (FULL|ADVANCE|CUSTOM)
├── status (PENDING|COMPLETED|CANCELLED)
├── reference (String, nullable)
├── notes
├── createdAt
└── updatedAt

PENALTY
├── id (PK)
├── userId (FK→User)
├── eventId (FK→Event)
├── type (NO_SHOW|OTHER)
├── reason
├── active (Boolean)
├── expiresAt (DateTime)
├── createdAt
└── updatedAt

... and more tables for NOTIFICATION, REQUEST, SPACE, GROUP, etc.
```

---

This comprehensive analysis should help you understand the application flow and identify bugs during testing!
