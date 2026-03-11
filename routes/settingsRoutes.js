const express = require('express');
const { getSettings, getConnectionFee, updateConnectionFee } = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

router.get('/', getSettings);
router.get('/connection-fee', getConnectionFee);
router.put('/connection-fee', authMiddleware, roleMiddleware(['admin']), updateConnectionFee);

module.exports = router;