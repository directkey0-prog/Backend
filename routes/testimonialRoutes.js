const express = require('express');
const { getTestimonials } = require('../controllers/testimonialController');
const router = express.Router();

// Public route - no auth needed
router.get('/', getTestimonials);

module.exports = router;
