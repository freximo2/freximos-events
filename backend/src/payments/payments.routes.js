const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const paymentsController = require('./payments.controller');

const router = Router();

router.use(authenticate);

router.get('/my', paymentsController.myPayments);

router.get('/event/:eventId', authorize('ADMIN', 'SUPER_ADMIN'), paymentsController.listByEvent);

router.post(
  '/',
  [
    body('registrationId').isInt().withMessage('ID de inscripción requerido'),
    body('amount').isDecimal().withMessage('Monto inválido'),
  ],
  paymentsController.create
);

router.patch(
  '/:id/status',
  authorize('ADMIN', 'SUPER_ADMIN'),
  paymentsController.updateStatus
);

module.exports = router;
