const { Router } = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { generateReport } = require('../controllers/reportController');

const router = Router();
router.use(protect);
router.post('/generate', generateReport);

module.exports = router;
