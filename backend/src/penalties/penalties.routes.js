const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const penaltiesController = require('./penalties.controller');

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/event/:eventId', penaltiesController.listByEvent);

router.get('/user/:userId', penaltiesController.listByUser);

router.post(
  '/',
  [
    body('userId').isInt().withMessage('ID de usuario requerido'),
    body('eventId').isInt().withMessage('ID de evento requerido'),
    body('type')
      .isIn(['YELLOW_CARD', 'RED_CARD', 'SUSPENSION', 'FINE', 'WARNING'])
      .withMessage('Tipo inválido'),
    body('reason').notEmpty().withMessage('La razón es requerida'),
  ],
  penaltiesController.create
);

router.patch('/:id/deactivate', penaltiesController.deactivate);

module.exports = router;
