const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const regController = require('./registrations.controller');

const router = Router();

router.use(authenticate);

// User: my registrations
router.get('/my', regController.myRegistrations);

// User: register to event
router.post('/event/:eventId', regController.register);

// User: cancel own registration
router.delete('/event/:eventId', regController.cancel);

// User: get waitlist position
router.get('/event/:eventId/waitlist-position', regController.getWaitlistPosition);

// Check penalty status
router.get('/check-penalty', regController.checkPenalty);

// Admin: update registration status (confirm/reject)
router.patch(
  '/:id/status',
  authorize('ADMIN', 'SUPER_ADMIN'),
  regController.updateStatus
);

router.patch('/:id/demote', authorize('SUPER_ADMIN'), regController.demoteToWaitlist);
router.post('/event/:eventId/no-show', authorize('ADMIN', 'SUPER_ADMIN'), regController.applyNoShowPenalties);

// Admin: remove user from event with reason
router.delete('/:id/remove', authorize('ADMIN', 'SUPER_ADMIN'), regController.removeFromEvent);

module.exports = router;
