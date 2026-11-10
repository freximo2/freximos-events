# VibraMeet Application Flowchart & Architecture Analysis

## 1. APPLICATION ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                     VIBRAMEET ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │   FRONTEND   │         │   BACKEND    │                     │
│  │  React 19    │◄────────┤   Express.js │                     │
│  │  + Vite      │ HTTP    │  + Prisma    │                     │
│  └──────────────┘         └──────┬───────┘                     │
│                                   │                             │
│                          ┌────────▼─────────┐                  │
│                          │   PostgreSQL 16  │                  │
│                          │   + JWT Auth     │                  │
│                          │   + bcrypt       │                  │
│                          └──────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. AUTHENTICATION & AUTHORIZATION FLOW

```
START: User Action
  │
  ├─► REGISTER (No Auth Required)
  │   │
  │   ├─ Validate email format
  │   ├─ Hash password with bcryptjs
  │   ├─ Create user with role=USER
  │   └─ Notify SUPER_ADMIN of new registration
  │
  ├─► LOGIN (No Auth Required)
  │   │
  │   ├─ Verify email exists
  │   ├─ Compare password hash
  │   ├─ Generate JWT token
  │   ├─ Store token in localStorage
  │   └─ Redirect to /events
  │
  └─► PROTECTED ROUTES
      │
      ├─ Middleware: verify JWT token
      ├─ Decode token → get userId & role
      ├─ Check role permissions
      │
      ├─ USER → Can view public events, register, view stats
      ├─ ADMIN → Can create events, manage registrations
      └─ SUPER_ADMIN → Full control, user management
```

---

## 3. USER ROLES & PERMISSIONS MATRIX

```
┌────────────────┬──────────┬────────┬──────────────┐
│ FEATURE        │   USER   │ ADMIN  │ SUPER_ADMIN  │
├────────────────┼──────────┼────────┼──────────────┤
│ View Events    │   ✓ All  │  ✓    │   ✓ All      │
│                │ (Public) │ (Own)  │  (Any Status)│
│ Create Events  │    ✗     │   ✓    │   ✓          │
│ Edit Events    │    ✗     │ ✓Own   │   ✓          │
│ Cancel Events  │    ✗     │ ✓Own   │   ✓          │
│ Register       │    ✓     │   ✓    │   ✓          │
│ Waitlist       │    ✓     │   ✓    │   ✓          │
│ Make Payments  │    ✓     │   ✓    │   ✓          │
│ Manage Regs    │    ✗     │ ✓Own   │   ✓          │
│ View Requests  │    ✓     │   ✓    │   ✓          │
│ Create Req     │    ✓     │   ✓    │   ✓          │
│ View Stats     │ Personal │ Space  │   Global     │
│ Manage Users   │    ✗     │    ✗   │   ✓          │
│ Manage Spaces  │    ✗     │ ✓Own   │   ✓          │
│ Manage Sponsors│    ✗     │    ✗   │   ✓          │
└────────────────┴──────────┴────────┴──────────────┘
```

---

## 4. EVENT LIFECYCLE WORKFLOW

```
CREATE EVENT (ADMIN/SUPER_ADMIN)
  │
  ├─ Validate event data
  │  ├─ name, date, location, maxPlayers required
  │  ├─ ADMIN must belong to space
  │  └─ Price converted to Decimal(10,2)
  │
  ├─ Create Event with status=ACTIVE
  │
  ├─ Auto-generate image (cloudinary/placeholder)
  │
  ├─ Notify users
  │  ├─ If PUBLIC → notify ALL users
  │  └─ If PRIVATE → notify invited users only
  │
  ├─► EVENT ACTIVE STATE
  │   │
  │   ├─ Users can register/waitlist
  │   ├─ Users can view details
  │   ├─ Payments can be collected
  │   └─ ADMIN can modify event
  │
  ├─► EVENT CANCELLED (ADMIN action)
  │   │
  │   ├─ Set status=CANCELLED
  │   ├─ Cancel all registrations
  │   ├─ Refund all payments
  │   ├─ Notify all registered users
  │   └─ Remove event from listings
  │
  └─► EVENT ARCHIVED (Auto after event date)
      │
      ├─ Set status=ARCHIVED
      ├─ Visible only to ADMIN/SUPER_ADMIN
      ├─ Cannot register/modify
      └─ Historical stats remain visible
```

---

## 5. REGISTRATION & WAITLIST WORKFLOW

```
USER REGISTERS FOR EVENT
  │
  ├─ Check event exists & is ACTIVE
  ├─ Check user not already registered
  ├─ Check event type:
  │
  ├─► PUBLIC EVENT
  │   │
  │   ├─ Count current registrations
  │   │
  │   ├─ IF count < maxPlayers
  │   │  │
  │   │  ├─ Create Registration with status=PENDING
  │   │  └─ User must complete payment
  │   │
  │   └─ IF count >= maxPlayers
  │      │
  │      ├─ Create Registration with status=WAITLISTED
  │      ├─ Calculate queue position
  │      └─ User sees "On Waitlist"
  │
  └─► PRIVATE EVENT
      │
      ├─ Check EventInvitation exists
      │
      ├─ IF invited
      │  │
      │  ├─ Create Registration (PENDING or WAITLISTED)
      │  └─ Proceed with payment
      │
      └─ IF NOT invited
         │
         └─ Return 403 Forbidden


WAITLIST PROMOTION (When someone cancels/is rejected)
  │
  ├─ Free up 1 spot
  ├─ Call pickBestWaitlisted()
  │  │
  │  ├─ Find all WAITLISTED registrations
  │  ├─ Count CONFIRMED events per user
  │  ├─ Sort by:
  │  │  1. Most confirmed events (activity)
  │  │  2. Earliest createdAt (tie-break)
  │  └─ Return top user
  │
  ├─ Update best waitlist user to PENDING
  ├─ Send notification: "Plaza disponible!"
  └─ Loop if more spots available
```

---

## 6. PAYMENT WORKFLOW

```
USER REGISTERS → NEEDS PAYMENT
  │
  ├─ Check event price
  │
  ├─ IF price = 0
  │  └─ Mark as CONFIRMED (free event)
  │
  ├─► IF price > 0
  │   │
  │   ├─ Create Payment record
  │   │  ├─ type: FULL, ADVANCE, or CUSTOM
  │   │  ├─ amount: decimal value
  │   │  ├─ status: PENDING or COMPLETED
  │   │  └─ reference: null until paid
  │   │
  │   ├─ USER PROCESSES PAYMENT
  │   │  │
  │   │  ├─ FULL (100% of price)
  │   │  │  └─ status=COMPLETED → Registration=CONFIRMED
  │   │  │
  │   │  ├─ ADVANCE (50-70% of price)
  │   │  │  └─ status=PENDING → Registration=PENDING
  │   │  │
  │   │  └─ CUSTOM (30-70% of price)
  │   │     └─ status=PENDING → Registration=PENDING
  │   │
  │   └─ Payment verified
  │      ├─ Set reference code
  │      ├─ Update Registration status
  │      └─ Send confirmation notification


PAYMENT LIFECYCLE
  │
  ├─ PENDING (waiting for payment)
  ├─ COMPLETED (payment received, reference set)
  └─ CANCELLED (if event cancelled or registration cancelled)
```

---

## 7. REQUESTS (PQRS) WORKFLOW

```
USER CREATES REQUEST
  │
  ├─ Validate request type (PETICION, QUEJA, RECLAMO, SUGERENCIA)
  ├─ Title, description required
  ├─ Link to event/user optional
  │
  ├─ Create Request
  │  ├─ status=PENDING
  │  ├─ priority=NORMAL (default)
  │  └─ createdAt timestamp
  │
  ├─► ADMIN/SUPER_ADMIN PROCESSES
  │   │
  │   ├─ View all requests (or own if ADMIN)
  │   ├─ Set priority (LOW, NORMAL, HIGH)
  │   ├─ Assign to staff member
  │   ├─ Add internal notes
  │   │
  │   ├─ Status transitions:
  │   │  ├─ PENDING → IN_PROGRESS
  │   │  ├─ IN_PROGRESS → ESCALATED
  │   │  ├─ ESCALATED → RESOLVED
  │   │  └─ RESOLVED → CLOSED
  │   │
  │   └─ Send notifications on status change


REQUEST PRIORITIES
  │
  ├─ LOW (≥7 days to resolve)
  ├─ NORMAL (3-7 days)
  └─ HIGH (< 24 hours)
```

---

## 8. PENALTY SYSTEM WORKFLOW

```
NO_SHOW PENALTY
  │
  ├─ Trigger: Event date passed, user didn't show
  │
  ├─ ADMIN marks user as NO_SHOW
  │
  ├─ Create Penalty record
  │  ├─ type=NO_SHOW
  │  ├─ reason=user provided
  │  ├─ active=true
  │  └─ expiresAt=date+5days (default)
  │
  ├─ Update User.penalizedUntil
  │
  ├─ User is BLOCKED from registering
  │
  └─► PENALTY EXPIRES
      │
      ├─ Auto-update penalizedUntil=null
      ├─ User can register again
      └─ Penalty remains in history


PENALTY IMPACT
  │
  ├─ During active period:
  │  ├─ Cannot register for NEW events
  │  ├─ Cannot register for WAITLIST
  │  └─ Can view events but greyed out
  │
  └─ After expiration:
     └─ Full access restored
```

---

## 9. STATISTICS & DASHBOARD WORKFLOW

```
USER STATS (Personal)
  │
  ├─ GET /api/stats/my
  │
  ├─ Calculate:
  │  ├─ Total confirmed registrations
  │  ├─ Total cancelled registrations
  │  ├─ Total waitlisted registrations
  │  ├─ Total payments (completed + pending)
  │  ├─ Active penalties
  │  ├─ Event categories breakdown
  │  └─ Monthly participation trend
  │
  └─ Return to /stats page


ADMIN STATS (Space/Own Events)
  │
  ├─ GET /api/stats/dashboard
  │
  ├─ If ADMIN:
  │  ├─ Stats for owned events only
  │  ├─ Space members & registrations
  │  └─ Revenue from own events
  │
  └─ If SUPER_ADMIN:
     ├─ Global stats (all events)
     ├─ User growth
     ├─ Total revenue
     ├─ Most popular events
     └─ Category distribution


PUBLIC EVENT STATS
  │
  ├─ GET /api/stats/event/:id
  │
  ├─ Anyone can view:
  │  ├─ Registration count
  │  ├─ Waitlist count
  │  ├─ Available spots
  │  └─ Most common category
  │
  └─ Private events stats hidden
```

---

## 10. NOTIFICATION SYSTEM

```
NOTIFICATION TYPES
  │
  ├─ INFO (general information)
  ├─ SUCCESS (action completed)
  ├─ WARNING (needs attention)
  └─ ERROR (something went wrong)


NOTIFICATION TRIGGERS
  │
  ├─ NEW EVENT created (public)
  ├─ REGISTRATION confirmed
  ├─ REGISTRATION rejected
  ├─ WAITLIST promotion
  ├─ PAYMENT completed
  ├─ PAYMENT failed
  ├─ EVENT cancelled
  ├─ PENALTY applied
  ├─ REQUEST status changed
  ├─ NEW user registered (to SUPER_ADMIN)
  └─ SPACE admin assigned


NOTIFICATION LIFECYCLE
  │
  ├─ Create with read=false
  ├─ Display in NotificationBell
  ├─ User clicks → read=true
  ├─ Auto-cleanup after 30 days
  └─ Persist in database for history
```

---

## 11. SPACES & GROUPS

```
SPACES (Multi-tenant concept)
  │
  ├─ Created by SUPER_ADMIN
  ├─ Assigned ADMIN(s)
  │
  ├─ Admin can:
  │  ├─ Create events in space
  │  ├─ Manage event registrations
  │  ├─ View space statistics
  │  ├─ Invite other admins
  │  └─ Manage space members
  │
  └─ Space organizes events by category/type


GROUPS (User collections)
  │
  ├─ Created by ADMIN
  ├─ Contain multiple users
  │
  ├─ Use cases:
  │  ├─ Team management
  │  ├─ Bulk invitations to private events
  │  ├─ Activity tracking
  │  └─ Group statistics
  │
  └─ Admin can add/remove members
```

---

## 12. IDENTIFIED POTENTIAL BUGS & ISSUES

### ⚠️ HIGH PRIORITY

1. **Waitlist Promotion Bug**
   ```
   Issue: When multiple spots free up, promotion loop may skip users
   Location: registrations.controller.js → promoteFromWaitlist()
   Fix: Should loop until all spots filled or waitlist empty
   ```

2. **Event Status Validation**
   ```
   Issue: DRAFT events don't transition properly to ACTIVE
   Location: events.controller.js → create()
   Fix: Should verify date > now() before setting ACTIVE
   ```

3. **Private Event Permissions**
   ```
   Issue: Invitation check only during registration, not during event view
   Location: events.controller.js → getById()
   Fix: Should validate invitation for PRIVATE events on GET /events/:id
   ```

4. **Payment Type Validation**
   ```
   Issue: CUSTOM payment amount validation missing
   Location: payments.controller.js
   Fix: Should validate amount is between 30-70% of event price
   ```

### ⚠️ MEDIUM PRIORITY

5. **Penalty Expiration**
   ```
   Issue: No automatic cleanup of expired penalties
   Location: penalties.controller.js
   Fix: Need cron job or middleware to update penalizedUntil
   ```

6. **Concurrent Registration**
   ```
   Issue: Race condition if multiple users register when 1 spot left
   Location: registrations.controller.js → register()
   Fix: Use database transaction to prevent double-booking
   ```

7. **Notification Link Validity**
   ```
   Issue: Notification links may break if event is deleted
   Location: notifications.controller.js
   Fix: Add link validation when displaying notifications
   ```

8. **Space Admin Assignment**
   ```
   Issue: Removing space admin doesn't revoke access immediately
   Location: spaces.controller.js
   Fix: Invalidate JWT tokens or add access timestamp check
   ```

### ⚠️ LOW PRIORITY

9. **Image Upload Validation**
   ```
   Issue: No file size/type validation for profile photos
   Location: users.controller.js → uploadPhoto()
   Fix: Add multer filters and limits
   ```

10. **Password Reset Missing**
    ```
    Issue: No password reset functionality
    Location: auth.controller.js
    Fix: Need forgot password endpoint with email verification
    ```

11. **API Rate Limiting**
    ```
    Issue: No rate limiting on auth endpoints
    Location: middleware/
    Fix: Add express-rate-limit
    ```

12. **CORS Configuration**
    ```
    Issue: CORS allows all origins in development
    Location: index.js
    Fix: Restrict to frontend domain in production
    ```

---

## 13. DATA FLOW DIAGRAMS

### Registration Data Flow
```
Frontend (Events.jsx)
    │
    ├─► User clicks "Inscribirse"
    │
    ├─► POST /api/registrations/event/:id
    │   {userId, eventId}
    │
    ▼
Backend (registrations.controller.js)
    │
    ├─ Validate event exists & ACTIVE
    ├─ Check for existing registration
    ├─ Check private event invitation
    │
    ├─► Count current registrations
    │   │
    │   ├─ IF < maxPlayers → PENDING status
    │   └─ IF >= maxPlayers → WAITLISTED status
    │
    ├─ Create Registration record
    ├─ Create Payment record
    │
    └─► Return Registration object + Payment
            │
            ▼
        Frontend (EventDetail.jsx)
            │
            └─ Update UI: show payment form or success
```

### Waitlist Promotion Flow
```
User Cancels Registration
    │
    ▼
DELETE /api/registrations/event/:id
    │
    ▼
Backend checks available spots
    │
    ├─ registrations.controller.js
    │  └─ promoteFromWaitlist()
    │
    ├─ Query WAITLISTED registrations
    ├─ Count CONFIRMED events per user
    ├─ Sort by activity + date
    │
    ├─ Pick top waitlisted user
    ├─ Update status → PENDING
    │
    └─► Send notification to promoted user
        │
        └─ User sees: "Plaza disponible!"
```

---

## 14. DATABASE RELATIONSHIPS

```
USER (Central Entity)
  │
  ├─ 1→Many REGISTRATION
  ├─ 1→Many PAYMENT
  ├─ 1→Many PENALTY
  ├─ 1→Many NOTIFICATION
  ├─ 1→Many REQUEST (created)
  ├─ 1→Many REQUEST (assigned)
  ├─ 1→Many EVENT (created)
  ├─ 1→Many SPACE_ADMIN
  ├─ 1→Many USER_GROUP_MEMBER
  └─ 1→Many EVENT_INVITATION


EVENT (Core Entity)
  │
  ├─ 1→Many REGISTRATION
  ├─ 1→Many PAYMENT
  ├─ 1→Many PENALTY
  ├─ 1→Many EVENT_INVITATION
  ├─ Many→1 CREATOR (User)
  ├─ Many→1 SPACE
  └─ 1→Many EVENT_SPONSOR


REGISTRATION (Junction)
  │
  ├─ Many→1 USER
  ├─ Many→1 EVENT
  ├─ 1→1 PAYMENT
  └─ Status: PENDING, CONFIRMED, REJECTED, CANCELLED, WAITLISTED
```

---

## 15. DEPLOYMENT CHECKLIST

```
BEFORE PRODUCTION DEPLOYMENT
  │
  ├─ [ ] Fix identified bugs (HIGH priority)
  ├─ [ ] Add database transaction for registrations
  ├─ [ ] Implement penalty expiration cron
  ├─ [ ] Add rate limiting to auth endpoints
  ├─ [ ] Validate image uploads (size, type)
  ├─ [ ] Restrict CORS to frontend domain
  ├─ [ ] Set JWT_SECRET to strong value (not "super_secret_key")
  ├─ [ ] Enable HTTPS/TLS
  ├─ [ ] Set up database backups
  ├─ [ ] Implement email verification
  ├─ [ ] Add password reset flow
  ├─ [ ] Test all role permissions thoroughly
  ├─ [ ] Load test concurrent registrations
  ├─ [ ] Set up monitoring/logging
  └─ [ ] Document API for third-party developers
```

---

## 16. API RESPONSE PATTERNS

### Success Response
```javascript
{
  "id": 123,
  "email": "user@example.com",
  "role": "USER",
  "createdAt": "2026-03-27T10:00:00Z"
}
```

### Error Response
```javascript
{
  "error": "Event not found",
  "statusCode": 404,
  "timestamp": "2026-03-27T10:00:00Z"
}
```

### Validation Error
```javascript
{
  "errors": [
    {
      "param": "email",
      "msg": "Invalid email format",
      "value": "invalid-email"
    }
  ]
}
```

---

## SUMMARY

**VibraMeet** is a multi-tenant event management platform with:
- ✓ 3-tier role system (USER, ADMIN, SUPER_ADMIN)
- ✓ Smart waitlist with activity-based promotion
- ✓ Flexible payment options (full/advance/custom)
- ✓ Real-time notifications
- ✓ Request management (PQRS)
- ✓ Penalty system for no-shows
- ✓ Space-based organization
- ✓ User groups
- ✓ Comprehensive statistics

**Key Modules:** Events, Registrations, Payments, Requests, Penalties, Notifications, Spaces, Groups, Stats, Sponsors, Clients

**Testing Focus Areas:** Waitlist logic, concurrent registrations, payment validation, permission checks, role-based access
