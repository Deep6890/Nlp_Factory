const { Router }           = require('express');
const { body }             = require('express-validator');
const userController       = require('../controllers/userController');
const recordingController  = require('../controllers/recordingController');
const { protect }          = require('../middlewares/authMiddleware');
const { getUserAudiosRules } = require('../validations/recordingValidation');

const updateProfileRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 80 }).withMessage('Name cannot exceed 80 characters'),
];

const router = Router();

router.use(protect);

// GET /api/v1/users/me
router.get('/me', userController.getMe);

// GET /api/v1/users/dashboard
router.get('/dashboard', userController.getDashboard);

// PUT /api/v1/users/profile
router.put('/profile', updateProfileRules, userController.updateProfile);

// GET /api/v1/users/:userId/audios
// :userId can be a MongoDB ObjectId or the shorthand "me"
router.get('/:userId/audios', getUserAudiosRules, recordingController.getUserAudios);

module.exports = router;
