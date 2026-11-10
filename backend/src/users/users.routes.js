const { Router } = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const usersController = require('./users.controller');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads', 'photos'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'));
    }
  },
});

const router = Router();

router.get('/me', authenticate, usersController.getProfile);

router.put(
  '/me',
  authenticate,
  [
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('phone').optional(),
    body('address').optional(),
    body('photo').optional(),
    body('emergencyContact').optional(),
  ],
  usersController.updateProfile
);

router.post('/me/photo', authenticate, upload.single('photo'), usersController.uploadPhoto);

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), usersController.listUsers);

router.patch(
  '/:id/role',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  usersController.changeRole
);

router.post(
  '/invite',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  usersController.invite
);

router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  usersController.deleteUser
);

module.exports = router;
