const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const templatesController = require('./templates.controller');

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', templatesController.list);

router.post(
  '/',
  [body('name').notEmpty().withMessage('El nombre es requerido')],
  templatesController.create
);

// Create template from existing event
router.post('/from-event/:eventId', templatesController.createFromEvent);

router.put('/:id', templatesController.update);

router.delete('/:id', templatesController.remove);

module.exports = router;
