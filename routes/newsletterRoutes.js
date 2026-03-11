const express = require('express');
const { subscribe } = require('../controllers/newsletterController');
const router = express.Router();

// Public route - no auth needed
router.post('/subscribe', subscribe);

module.exports = router;
