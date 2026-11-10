const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const statsController = require('./stats.controller');

const router = Router();

router.use(authenticate);

// Accessible by all authenticated users
router.get('/my', statsController.myStats);

// Admin/Super Admin only
router.get('/dashboard', authorize('ADMIN', 'SUPER_ADMIN'), statsController.dashboard);
router.get('/player/:userId', authorize('ADMIN', 'SUPER_ADMIN'), statsController.playerStats);

// Event stats: all users can see public event stats, admin+ can see all
router.get('/event/:eventId', statsController.eventStats);

module.exports = router;
