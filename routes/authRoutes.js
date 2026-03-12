const express = require('express');
const { signup, login, adminLogin, forgotPassword, logout } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/logout', logout);


module.exports = router;
