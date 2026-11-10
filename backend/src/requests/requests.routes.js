const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const requestsController = require('./requests.controller');

const router = Router();

router.use(authenticate);

router.get('/', requestsController.list);

router.get('/:id', requestsController.getById);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('El título es requerido'),
    body('description').notEmpty().withMessage('La descripción es requerida'),
  ],
  requestsController.create
);

// Admin: validate/update request
router.patch(
  '/:id/validate',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requestsController.validate
);

// Admin: escalate request
router.patch(
  '/:id/escalate',
  authorize('ADMIN', 'SUPER_ADMIN'),
  requestsController.escalate
);

module.exports = router;
