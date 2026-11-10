# VibraMeet - Quick Testing Reference Card

## 🚀 Start Here

```bash
# Deploy
cd /home/olamos/projects/eventhub-app
docker compose up --build -d
docker compose exec backend npm run seed

# Access
Frontend: http://localhost:5173
Backend:  http://localhost:3000
DB:       http://localhost:3000/api/health
```

---

## 👥 Test Accounts

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| superadmin@vibrameet.com | admin123 | SUPER_ADMIN | Full access |
| admin@vibrameet.com | admin123 | ADMIN | Capital Futbol space |
| admin2@vibrameet.com | admin123 | ADMIN | Campin 5 space |
| admin3@vibrameet.com | admin123 | ADMIN | Golaya Sports space |
| juan.perez@gmail.com | user123 | USER | Regular participant |
| maria.rodriguez@gmail.com | user123 | USER | Regular participant |
| *(25 more)* | user123 | USER | All other users |

---

## 🎯 Critical Test Scenarios

### 1. WAITLIST PROMOTION BUG
```
Create Event: maxPlayers=1
Register User A → CONFIRMED
Register User B → WAITLISTED (0 events)
Register User C → WAITLISTED (0 events, later)
Cancel User A

EXPECTED: User B promoted
ACTUAL: [Test & report]
```

### 2. PAYMENT VALIDATION BUG
```
Event Price: $1000
Select CUSTOM payment
Enter amount: $200 (20%)

EXPECTED: Rejected (not 30-70%)
ACTUAL: [Test & report]
```

### 3. CONCURRENT REGISTRATION BUG
```
Event: maxPlayers=1 (0 spots left)
Simultaneously: User A & B register

EXPECTED: Exactly 1 gets CONFIRMED, 1 gets WAITLISTED
ACTUAL: [Test & report]
```

### 4. PRIVATE EVENT ACCESS BUG
```
Create PRIVATE event as Admin A
Login as User B (not invited)
Try: GET /events/:id

EXPECTED: See event or get permission error?
ACTUAL: [Test & report]
```

### 5. PENALTY BLOCKING BUG
```
Apply NO_SHOW penalty to User A
Try to register in new event

EXPECTED: Blocked with error message
ACTUAL: [Test & report]
```

---

## 📋 Full Test Checklist

### Authentication (10 tests)
- [ ] Register with valid email
- [ ] Register with invalid email (should reject)
- [ ] Register with duplicate email (should reject)
- [ ] Login with correct password
- [ ] Login with wrong password (should reject)
- [ ] JWT token stored in localStorage
- [ ] Protected routes redirect to login if not authenticated
- [ ] Token expiration handled correctly
- [ ] Logout clears token
- [ ] Re-login generates new token

### Events (15 tests)
- [ ] Create event (ADMIN only)
- [ ] Create event as USER (should reject - 403)
- [ ] Event date validation (past dates rejected)
- [ ] maxPlayers validation (must be positive)
- [ ] Price validation (must be non-negative decimal)
- [ ] Public event → notifies all users
- [ ] Private event → notifies invited users only
- [ ] Event transitions to ARCHIVED after date
- [ ] Event status: DRAFT → ACTIVE → ARCHIVED
- [ ] Cancel event → refund all payments
- [ ] Edit event (only creator or SUPER_ADMIN)
- [ ] Delete event (only creator or SUPER_ADMIN)
- [ ] Event visibility filters by role
- [ ] Search/filter events by category
- [ ] Sort events by date/price/popularity

### Registrations (20 tests)
- [ ] Register for event with available spots → PENDING
- [ ] Register for event (no spots) → WAITLISTED
- [ ] Double registration prevented
- [ ] Cannot register for PRIVATE without invitation
- [ ] Cannot register while penalized
- [ ] Registration → CONFIRMED after full payment
- [ ] Registration → PENDING after advance payment
- [ ] Cancel registration → frees up spot
- [ ] Cancel registration → triggers waitlist promotion
- [ ] Waitlist shows correct position
- [ ] Waitlist promotion by activity (most confirmed)
- [ ] Waitlist promotion by date (tie-break)
- [ ] Waitlist promotion sends notification
- [ ] Registration status: PENDING → CONFIRMED
- [ ] Registration status: PENDING → REJECTED
- [ ] Registration status: ANY → CANCELLED
- [ ] Bulk operations (admin managing registrations)
- [ ] View all registrations (admin of own events)
- [ ] View all registrations (SUPER_ADMIN - all)
- [ ] Cannot view other admin's registrations

### Payments (15 tests)
- [ ] Free event (price=0) → auto-confirm
- [ ] FULL payment (100%) → COMPLETED
- [ ] ADVANCE payment (50-70%) → PENDING
- [ ] CUSTOM payment validation (must be 30-70%)
- [ ] CUSTOM payment invalid (20%) → rejected
- [ ] CUSTOM payment invalid (150%) → rejected
- [ ] Payment reference generated on completion
- [ ] Payment cancellation → refund status
- [ ] Event cancellation → refund all payments
- [ ] Multiple payments per user (different events)
- [ ] Payment history visible to user
- [ ] Admin can view event revenue
- [ ] Payment filtering by status
- [ ] Payment filtering by type
- [ ] Concurrent payment processing

### Permissions (15 tests)
- [ ] USER cannot create events
- [ ] USER cannot modify events
- [ ] USER can register/cancel own registrations
- [ ] ADMIN can create events in assigned space
- [ ] ADMIN cannot create in other space
- [ ] ADMIN sees own events (not others)
- [ ] SUPER_ADMIN sees all events
- [ ] ADMIN can manage registrations (own events)
- [ ] ADMIN cannot manage other admin's registrations
- [ ] SUPER_ADMIN can manage all registrations
- [ ] ADMIN cannot change user roles
- [ ] SUPER_ADMIN can change roles
- [ ] SUPER_ADMIN can delete users
- [ ] USER cannot access admin panel
- [ ] ADMIN cannot see SUPER_ADMIN only features

### Notifications (10 tests)
- [ ] New public event → USER notified
- [ ] New private event → invited user notified
- [ ] Registration confirmed → USER notified
- [ ] Waitlist promotion → USER notified
- [ ] Payment received → USER notified
- [ ] Event cancelled → all notified
- [ ] Penalty applied → USER notified
- [ ] Request status changed → notified
- [ ] Notifications mark as read
- [ ] Stale notifications (event deleted) handled

### Penalties (10 tests)
- [ ] Apply NO_SHOW penalty
- [ ] Penalty blocks registration
- [ ] Penalty shows expiration date
- [ ] Penalty expires after set days
- [ ] Multiple penalties block until all expire
- [ ] Admin can clear penalty manually
- [ ] Penalty history visible
- [ ] Penalty details show reason
- [ ] Penalized user cannot join waitlist
- [ ] Notification sent on penalty

### Requests/PQRS (8 tests)
- [ ] Create request (petición, queja, reclamo, sugerencia)
- [ ] Request shows in admin panel
- [ ] Set priority (LOW, NORMAL, HIGH)
- [ ] Assign to staff
- [ ] Status transitions: PENDING → IN_PROGRESS → ESCALATED → RESOLVED → CLOSED
- [ ] Comments/notes on request
- [ ] User notified of status changes
- [ ] Request visible to user history

### Spaces & Groups (8 tests)
- [ ] Create space (SUPER_ADMIN only)
- [ ] Assign admin to space
- [ ] Admin creates events in space
- [ ] Create group (ADMIN)
- [ ] Add/remove group members
- [ ] Group used for bulk invitations
- [ ] Space shows statistics
- [ ] Cannot remove admin while space has events

### UI/UX (10 tests)
- [ ] Grid view renders correctly
- [ ] List view renders correctly
- [ ] Toggle between grid/list
- [ ] Filters apply to both views
- [ ] Search works across modules
- [ ] Pagination works
- [ ] Loading states shown
- [ ] Error messages displayed
- [ ] Form validation shown
- [ ] Mobile responsive layout

### Edge Cases (12 tests)
- [ ] Event with price=0 (free)
- [ ] Event at exact maxPlayers
- [ ] Very long text fields
- [ ] Special characters in text
- [ ] Large number of waitlisted users
- [ ] Rapid successive registrations
- [ ] Concurrent event creation
- [ ] Delete while editing
- [ ] Timezone handling
- [ ] Date format parsing
- [ ] Currency formatting
- [ ] Decimal precision (prices)

---

## 📊 Bug Severity Scale

| Priority | Impact | Fix Timeline |
|----------|--------|--------------|
| HIGH | System broken, data loss, security | Before deployment |
| MEDIUM | Feature not working, bad UX | Within 1 week |
| LOW | Minor issues, cosmetic | In backlog |

---

## 🔍 How to Debug

### Browser Developer Tools
```
1. Open Chrome DevTools: F12
2. Check:
   - Console tab (errors/warnings)
   - Network tab (API responses)
   - Application tab (JWT token)
   - Storage (localStorage)
3. Look for:
   - Red error messages
   - Failed API calls (4xx/5xx)
   - Malformed JSON
```

### Database Check
```bash
# Access database
docker compose exec db psql -U vibrameet -d vibrameet

# Check users
SELECT id, email, role, penalizedUntil FROM users;

# Check registrations
SELECT id, userId, eventId, status FROM registrations ORDER BY createdAt DESC LIMIT 10;

# Check payments
SELECT id, userId, eventId, amount, status FROM payments ORDER BY createdAt DESC LIMIT 10;

# Exit
\q
```

### Backend Logs
```bash
docker compose logs backend -f
```

### Frontend Logs
```bash
# Browser console (F12 → Console tab)
# Or build logs if using npm run build
```

---

## 🐛 Bug Report Template

```markdown
# BUG: [Title]

**Severity:** HIGH / MEDIUM / LOW

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach if possible]

**Environment:**
- Browser: Chrome / Firefox / Safari
- URL: http://localhost:5173/...
- Account Role: USER / ADMIN / SUPER_ADMIN
- Account: admin@vibrameet.com

**Affected Code:**
- File: backend/src/[module]/[file].js
- Line: [number]
- Function: [functionName]

**Additional Notes:**
[Any other relevant info]
```

---

## ✅ Deployment Checklist

Before going live:
- [ ] All HIGH priority bugs fixed
- [ ] Database transactions for critical operations
- [ ] Rate limiting on auth endpoints
- [ ] CORS restricted to frontend domain
- [ ] JWT_SECRET changed from "super_secret_key"
- [ ] HTTPS/TLS enabled
- [ ] Database backups configured
- [ ] Monitoring/logging set up
- [ ] Load testing completed
- [ ] Security audit done

---

## 📞 Support

### Quick Links
- **Application Flowchart**: `APPLICATION_FLOWCHART.md`
- **Bug Testing Guide**: `BUG_TESTING_GUIDE.md`
- **Architecture**: `ARCHITECTURE_DIAGRAMS.md`
- **Summary**: `ANALYSIS_SUMMARY.md`

### Database Schema
- **Location**: `backend/prisma/schema.prisma`
- **Migrations**: `backend/prisma/migrations/`

### Key Controllers
- **Events**: `backend/src/events/events.controller.js`
- **Registrations**: `backend/src/registrations/registrations.controller.js`
- **Payments**: `backend/src/payments/payments.controller.js`
- **Penalties**: `backend/src/penalties/penalties.controller.js`

---

**Good luck testing! 🚀**
