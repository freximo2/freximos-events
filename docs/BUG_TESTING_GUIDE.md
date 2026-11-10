# VibraMeet - Bug Testing Guide & Report Template

## How to Report Bugs Found

Use this template when you discover a bug:

```
BUG ID: [Unique number]
Title: [Short description]
Severity: HIGH / MEDIUM / LOW
Status: NEW / CONFIRMED / IN_PROGRESS / FIXED

DESCRIPTION:
[What is the bug?]

STEPS TO REPRODUCE:
1. [First step]
2. [Second step]
3. [Expected result]
4. [Actual result]

ENVIRONMENT:
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Account Role: [USER/ADMIN/SUPER_ADMIN]

SCREENSHOT/VIDEO:
[Attach if possible]

AFFECTED CODE:
File: [path/to/file.js]
Line: [number]
Function: [functionName()]
```

---

## TEST SCENARIOS TO VERIFY BUGS

### 1. WAITLIST PROMOTION BUGS

#### Test Case 1.1: Single User Waitlist Promotion
```
SCENARIO: Event with 1 spot, 2 waitlisted users

STEPS:
1. Create event with maxPlayers=1
2. Register User A → CONFIRMED
3. Register User B → WAITLISTED (B has 0 confirmed events)
4. Register User C → WAITLISTED (C has 0 confirmed events, later than B)
5. User A cancels registration

EXPECTED:
- User B promoted to PENDING (earliest waitlist)
- User C remains WAITLISTED
- User B receives notification

ACTUAL:
[Record your findings]
```

#### Test Case 1.2: Multiple Spots Freed
```
SCENARIO: Event with 3 spots, multiple cancellations

STEPS:
1. Create event with maxPlayers=3
2. Register A, B, C → all CONFIRMED
3. Register D, E, F → all WAITLISTED
4. Cancel A, B, C (all 3 spots freed)

EXPECTED:
- D, E, F all promoted to PENDING
- All 3 receive notifications
- Correct promotion order (most active users first)

ACTUAL:
[Record your findings]
```

#### Test Case 1.3: Activity-Based Priority
```
SCENARIO: Waitlist promotion considers user activity

STEPS:
1. Create 2 events
2. Register User A → confirmed in 5 events
3. Register User B → confirmed in 0 events
4. Register User C → confirmed in 2 events
5. Create new event with maxPlayers=1
6. Register A, B, C sequentially (B gets in, A & C waitlist)
7. User B cancels

EXPECTED:
- User A promoted (5 confirmed events > 2 confirmed)
- Not User C (even though older)

ACTUAL:
[Record your findings]
```

---

### 2. PAYMENT VALIDATION BUGS

#### Test Case 2.1: Payment Type Validation
```
SCENARIO: Custom payment amount validation

STEPS:
1. Create event with price=1000
2. Register as USER
3. Try to pay CUSTOM amount with:
   a) 500 (50% - should be valid)
   b) 300 (30% - should be valid)
   c) 200 (20% - should be rejected)
   d) 1500 (150% - should be rejected)

EXPECTED:
- 30-70% amounts accepted
- Outside range rejected with error
- Payment status updated correctly

ACTUAL:
[Record your findings]
```

#### Test Case 2.2: Payment Race Condition
```
SCENARIO: Concurrent payment processing

STEPS:
1. Create event with 1 spot, price=1000
2. Register User A → PENDING status
3. Register User B → WAITLISTED
4. Simultaneously:
   - User A completes payment
   - Admin marks User A as REJECTED
5. Check User A and B status

EXPECTED:
- One operation succeeds, other fails
- Database consistency maintained
- No double-confirming

ACTUAL:
[Record your findings]
```

---

### 3. REGISTRATION & PERMISSION BUGS

#### Test Case 3.1: Private Event Access Control
```
SCENARIO: Private event access without invitation

STEPS:
1. Create PRIVATE event as Admin A
2. Login as User B (not invited)
3. Try to access /events/:id

EXPECTED:
- Get event details? (Activity: visibility)
- Cannot register (confirmed behavior)
- See "Not invited" message

ACTUAL:
[Record your findings]
```

#### Test Case 3.2: Concurrent Registration
```
SCENARIO: Multiple users register simultaneously for limited spots

STEPS:
1. Create event with maxPlayers=2
2. Simultaneously register 3 users:
   - User A, User B, User C all click "Inscribirse"
   - Within 1 second of each other

EXPECTED:
- Exactly 2 get CONFIRMED
- 1 gets WAITLISTED
- No status conflicts
- All receive appropriate notifications

ACTUAL:
[Record your findings]
```

#### Test Case 3.3: Double Registration Prevention
```
SCENARIO: User cannot register twice to same event

STEPS:
1. Register User A for Event X → CONFIRMED
2. User A tries to register for Event X again
3. Check response

EXPECTED:
- 400 Bad Request
- Error: "Already registered for this event"
- No duplicate registration created

ACTUAL:
[Record your findings]
```

---

### 4. PENALTY SYSTEM BUGS

#### Test Case 4.1: Penalty Application
```
SCENARIO: NO_SHOW penalty blocks registration

STEPS:
1. Create event for tomorrow
2. Register User A → CONFIRMED
3. Event date passes
4. Admin marks User A as NO_SHOW
5. Create another event
6. Try to register User A

EXPECTED:
- User A cannot register
- Error message: "You are penalized until [date]"
- Registration button disabled in UI

ACTUAL:
[Record your findings]
```

#### Test Case 4.2: Penalty Expiration
```
SCENARIO: Penalty auto-expires after set period

STEPS:
1. Apply NO_SHOW penalty to User A (expires in 5 days)
2. Advance system clock to expiration date
3. Try to register User A

EXPECTED:
- User can register (penalty expired)
- User.penalizedUntil = NULL
- No restrictions visible

ACTUAL:
[Record your findings]

NOTE: May require manual DB check since auto-expiration 
might not be implemented. Check penalty records.
```

---

### 5. NOTIFICATION BUGS

#### Test Case 5.1: Notification on Event Creation
```
SCENARIO: All users notified of public event

STEPS:
1. Admin creates PUBLIC event
2. Check notification feed

EXPECTED:
- All USER role users receive notification
- Message includes event name
- Link points to correct event
- Notification.read = false initially

ACTUAL:
[Record your findings]
```

#### Test Case 5.2: Notification on Waitlist Promotion
```
SCENARIO: User notified when promoted from waitlist

STEPS:
1. Register User A → WAITLISTED
2. Other user cancels, freeing spot
3. Check User A's notifications

EXPECTED:
- Notification sent with "Plaza disponible"
- Link to event
- User.read = false
- Appears in notification bell

ACTUAL:
[Record your findings]
```

#### Test Case 5.3: Stale Notification Links
```
SCENARIO: Old notifications when event is deleted

STEPS:
1. User receives notification with event link
2. Admin deletes the event
3. User clicks old notification

EXPECTED:
- Handle gracefully (404 page, not crash)
- Remove invalid notification

ACTUAL:
[Record your findings]
```

---

### 6. ADMIN PERMISSION BUGS

#### Test Case 6.1: ADMIN Space Isolation
```
SCENARIO: Admin cannot access other admin's space

STEPS:
1. Create Space A, assign to Admin A
2. Create Space B, assign to Admin B
3. Admin A tries to:
   - Create event in Space B
   - Edit event in Space B
   - View Space B registrations

EXPECTED:
- 403 Forbidden for all attempts
- Error: "No access to this space"

ACTUAL:
[Record your findings]
```

#### Test Case 6.2: ADMIN Event Visibility
```
SCENARIO: ADMIN sees only own events

STEPS:
1. Admin A creates Event A (ACTIVE)
2. Admin B creates Event B (ACTIVE)
3. Admin A views /events

EXPECTED:
- Admin A sees Event A
- Admin A does NOT see Event B
- (Unless SUPER_ADMIN or Event B is PUBLIC)

ACTUAL:
[Record your findings]
```

#### Test Case 6.3: SUPER_ADMIN Override
```
SCENARIO: SUPER_ADMIN can manage all admins' spaces

STEPS:
1. SUPER_ADMIN tries to:
   - Edit Admin A's event
   - View Admin B's space
   - Manage Admin C's registrations

EXPECTED:
- All operations succeed
- No permission errors

ACTUAL:
[Record your findings]
```

---

### 7. DATA VALIDATION BUGS

#### Test Case 7.1: Event Date Validation
```
SCENARIO: Event date validation

STEPS:
1. Try to create event with date:
   a) In the past (yesterday)
   b) More than 1 year in future
   c) Invalid format
   d) Missing date entirely

EXPECTED:
- Past dates rejected
- Future dates validated
- Invalid formats show error
- Missing date shows "required" error

ACTUAL:
[Record your findings]
```

#### Test Case 7.2: MaxPlayers Validation
```
SCENARIO: MaxPlayers must be positive integer

STEPS:
1. Try to create event with maxPlayers:
   a) 0
   b) -5
   c) 0.5 (decimal)
   d) "abc" (text)
   e) null/empty

EXPECTED:
- Only positive integers accepted
- Error for invalid values

ACTUAL:
[Record your findings]
```

#### Test Case 7.3: Price Validation
```
SCENARIO: Price must be non-negative decimal

STEPS:
1. Try to create event with price:
   a) -100 (negative)
   b) "not_a_number"
   c) 1000.999 (too many decimals)
   d) 1000000000 (very large)

EXPECTED:
- Non-negative decimals accepted
- Invalid values rejected
- Stored as Decimal(10,2)

ACTUAL:
[Record your findings]
```

---

### 8. UI/UX BUGS

#### Test Case 8.1: Event Grid/List Toggle
```
SCENARIO: Grid and List view modes

STEPS:
1. Navigate to /events
2. Look for Grid/List toggle
3. Click Grid view
4. Click List view
5. Apply filters and toggle

EXPECTED:
- Both views render correctly
- Filters apply to both modes
- Scroll position preserved per mode
- No duplicate events

ACTUAL:
[Record your findings]
```

#### Test Case 8.2: Search/Filter Persistence
```
SCENARIO: Filters persist during navigation

STEPS:
1. Filter events by category=FUTBOL
2. Click on an event
3. Go back

EXPECTED:
- FUTBOL filter still applied
- Scroll position near previous selection
- Filters not reset

ACTUAL:
[Record your findings]
```

#### Test Case 8.3: Registration Form Validation
```
SCENARIO: Payment form validation on registration

STEPS:
1. Register for paid event
2. Try to submit payment form with:
   a) Empty amount
   b) Negative amount
   c) Non-numeric
   d) Valid amount

EXPECTED:
- Invalid inputs show error message
- Valid input submits successfully
- Error messages clear on correction

ACTUAL:
[Record your findings]
```

---

### 9. RESPONSE CODE BUGS

#### Test Case 9.1: HTTP Status Codes
```
SCENARIO: Verify correct HTTP status codes returned

Test these endpoints:
- GET /api/events/999 (not found) → should be 404
- POST /api/events without auth → should be 401
- POST /api/events with USER role → should be 403
- GET /api/events with invalid token → should be 401
- POST /api/auth/register with existing email → should be 400
- POST /api/registrations/event/999 → should be 404

EXPECTED:
All responses match REST conventions

ACTUAL:
[Record actual status codes]
```

---

### 10. EDGE CASE BUGS

#### Test Case 10.1: Event with Zero Price
```
SCENARIO: Free events (price=0) handling

STEPS:
1. Create event with price=0
2. Register as user
3. Check registration status
4. Check payment record

EXPECTED:
- Registration auto-confirmed (skip payment)
- No payment record created
- Or payment.status=COMPLETED with amount=0

ACTUAL:
[Record your findings]
```

#### Test Case 10.2: Event at Exact Max Capacity
```
SCENARIO: Event with exact number of registrations

STEPS:
1. Create event with maxPlayers=10
2. Register exactly 10 users
3. Register 11th user

EXPECTED:
- First 10: CONFIRMED
- 11th: WAITLISTED
- Clear distinction in UI

ACTUAL:
[Record your findings]
```

#### Test Case 10.3: Very Long Text Fields
```
SCENARIO: Text fields with maximum length

STEPS:
1. Create event with:
   - name: 500 characters
   - description: 5000 characters
   - location: 500 characters

EXPECTED:
- Fields truncated or rejected gracefully
- No database errors
- UI displays correctly

ACTUAL:
[Record your findings]
```

---

## Bug Priority Assessment

### HIGH PRIORITY (Fix before deployment)
- Waitlist promotion not working or skipping users
- Payment double-charging or missing refunds
- Admin seeing other admin's data
- Concurrent registration double-booking

### MEDIUM PRIORITY (Fix soon)
- Notification links breaking
- Penalty not expiring
- Date validation issues
- Form validation missing

### LOW PRIORITY (Fix later)
- UI rendering issues
- Filter persistence
- Minor validation gaps
- Performance optimization

---

## Performance Testing

```
LOAD TEST SCENARIO
==================

Create test data:
- 10 events with 100 spots each
- 500 registered users
- 1000 additional users trying to register simultaneously

Measure:
- Time to register (should be <2s)
- Time to list events (should be <1s)
- Database connection pool
- Memory usage
- Error rate
```

---

## Notes for Testing

1. **Always test with Chrome DevTools open** to catch JavaScript errors
2. **Check browser console** for warnings/errors
3. **Verify network requests** in Network tab
4. **Check database directly** for data integrity issues
5. **Use different roles** for comprehensive testing
6. **Test on different screen sizes** (mobile, tablet, desktop)
7. **Clear cache** between tests
8. **Check email notifications** if email service is configured
9. **Verify JWT token expiration** behavior
10. **Test with slow network** (Chrome DevTools → Throttling)

---

## Submission Format

When reporting bugs, please include:

```markdown
## BUG: [Title]

**Severity:** HIGH / MEDIUM / LOW

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:**
...

**Actual Result:**
...

**Environment:**
- Browser: ...
- Role: ...
- URL: ...

**Screenshot:**
[If possible]

**Affected Code:**
File: ...
Function: ...
```
