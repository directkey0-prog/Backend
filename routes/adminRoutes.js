const express = require('express');
const { getAllProperties, approveProperty, rejectProperty, getAllUsers, getAllTransactions, getStatistics, createAdminProperty, deleteAdminProperty, changeAdminPassword } = require('../controllers/adminController');
const { getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } = require('../controllers/testimonialController');
const { getMessages, markAsRead, deleteMessage } = require('../controllers/messageController');
const { getSubscribers, removeSubscriber } = require('../controllers/newsletterController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

router.use(authMiddleware, roleMiddleware(['admin']));

// Properties
router.get('/properties', getAllProperties);
router.post('/properties', createAdminProperty);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', rejectProperty);
router.delete('/properties/:id', deleteAdminProperty);

// Users
router.get('/landlords', getAllUsers);

// Transactions
router.get('/transactions', getAllTransactions);

// Statistics
router.get('/statistics', getStatistics);

// Testimonials (admin CRUD)
router.get('/testimonials', getAllTestimonials);
router.post('/testimonials', createTestimonial);
router.put('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

// Messages
router.get('/messages', getMessages);
router.put('/messages/:id/read', markAsRead);
router.delete('/messages/:id', deleteMessage);

// Admin account
router.put('/change-password', changeAdminPassword);

// Newsletter
router.get('/newsletter/subscribers', getSubscribers);
router.delete('/newsletter/subscribers/:id', removeSubscriber);

module.exports = router;
