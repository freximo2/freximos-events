const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const etrController = require('./event-type-requests.controller');
const router = Router();
router.use(authenticate);
router.get('/', etrController.list);
router.post('/', [
  body('categoryName').notEmpty().withMessage('Nombre de categoría es requerido'),
  body('description').notEmpty().withMessage('Descripción es requerida'),
  body('justification').notEmpty().withMessage('Justificación es requerida'),
], etrController.create);
router.patch('/:id/resolve', authorize('SUPER_ADMIN'), etrController.resolve);
module.exports = router;
