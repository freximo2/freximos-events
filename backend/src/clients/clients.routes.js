const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const clientsController = require('./clients.controller');

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

router.get('/', clientsController.list);
router.get('/:id', clientsController.getById);

router.post(
  '/',
  [body('name').notEmpty().withMessage('El nombre es requerido')],
  clientsController.create
);

router.put('/:id', clientsController.update);
router.delete('/:id', clientsController.remove);

module.exports = router;
