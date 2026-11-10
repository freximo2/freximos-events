const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const sponsorsController = require('./sponsors.controller');

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

router.get('/', sponsorsController.list);
router.get('/:id', sponsorsController.getById);

router.post(
  '/',
  [body('name').notEmpty().withMessage('El nombre es requerido')],
  sponsorsController.create
);

router.put('/:id', sponsorsController.update);
router.delete('/:id', sponsorsController.remove);

// Event-Sponsor relations
router.post('/assign', sponsorsController.assignToEvent);
router.delete('/event/:id', sponsorsController.removeFromEvent);

module.exports = router;
