const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const ownershipsController = require('./ownerships.controller');

const router = Router();

router.use(authenticate);

router.get('/event/:eventId', ownershipsController.listByEvent);

router.post(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN'),
  [
    body('userId').isInt().withMessage('ID de usuario requerido'),
    body('eventId').isInt().withMessage('ID de evento requerido'),
    body('type').isIn(['TITULAR', 'SUPLENTE']).withMessage('Tipo debe ser TITULAR o SUPLENTE'),
  ],
  ownershipsController.assign
);

router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), ownershipsController.remove);

module.exports = router;
