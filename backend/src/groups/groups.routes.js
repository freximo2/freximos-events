const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const groupsController = require('./groups.controller');
const router = Router();
router.use(authenticate);
router.get('/my-users', authorize('ADMIN', 'SUPER_ADMIN'), groupsController.myUsers);
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), groupsController.list);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), [body('name').notEmpty().withMessage('El nombre del grupo es requerido')], groupsController.create);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), groupsController.update);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), groupsController.remove);
router.post('/:id/members', authorize('ADMIN', 'SUPER_ADMIN'), groupsController.addMember);
router.delete('/:id/members/:userId', authorize('ADMIN', 'SUPER_ADMIN'), groupsController.removeMember);

// Search users for invitations
router.get('/search-users', authorize('ADMIN', 'SUPER_ADMIN'), groupsController.searchUsers);

// Deny access to a user (cancel registrations + remove from groups)
router.delete('/deny-access/:userId', authorize('ADMIN', 'SUPER_ADMIN'), groupsController.denyAccess);

module.exports = router;
