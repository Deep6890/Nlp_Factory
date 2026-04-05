const { Router }     = require('express');
const authController = require('../controllers/authController');
const { protect }    = require('../middlewares/authMiddleware');
const { authRateLimiter } = require('../middlewares/rateLimiter');
const { signUpRules, loginRules } = require('../validations/authValidation');

const router = Router();

// POST /api/v1/auth/register
router.post('/register', authRateLimiter, signUpRules, authController.register);

// POST /api/v1/auth/login
router.post('/login', authRateLimiter, loginRules, authController.logIn);

// GET /api/v1/auth/me  (convenience alias)
router.get('/me', protect, authController.getMe);

module.exports = router;
