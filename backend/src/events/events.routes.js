const { Router } = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const eventsController = require('./events.controller');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads', 'events'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `event-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Solo imagenes (jpg, png, gif, webp)'));
  },
});

const router = Router();

// All event routes require authentication
router.use(authenticate);

router.get('/', eventsController.list);

// Static routes MUST come before /:id to avoid conflicts
router.post(
  '/archive-expired',
  authorize('ADMIN', 'SUPER_ADMIN'),
  eventsController.archiveExpiredEvents
);

router.post(
  '/batch-action',
  authorize('ADMIN', 'SUPER_ADMIN'),
  eventsController.batchAction
);

router.get('/:id', eventsController.getById);

router.post(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN'),
  [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('date').isISO8601().withMessage('Fecha inválida'),
    body('location').notEmpty().withMessage('La ubicación es requerida'),
    body('maxPlayers').isInt({ min: 2 }).withMessage('Mínimo 2 participantes'),
  ],
  eventsController.create
);

router.put(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  eventsController.update
);

router.patch(
  '/:id/cancel',
  authorize('ADMIN', 'SUPER_ADMIN'),
  eventsController.cancelEvent
);

router.delete(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  eventsController.remove
);

// Upload event image
router.post(
  '/:id/image',
  authorize('ADMIN', 'SUPER_ADMIN'),
  upload.single('image'),
  eventsController.uploadImage
);

module.exports = router;
