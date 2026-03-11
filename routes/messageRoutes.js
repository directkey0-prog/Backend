const express = require('express');
const { submitMessage } = require('../controllers/messageController');
const router = express.Router();

// Public route - no auth needed
router.post('/', submitMessage);

module.exports = router;
