const express = require('express');
const { initializePayment, verifyPayment, getConnectionsForProperty, getLandlordConnections } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

router.post('/initialize', initializePayment);
router.get('/verify/:reference', verifyPayment);
router.get('/landlord/connections', authMiddleware, roleMiddleware(['landlord']), getLandlordConnections);
router.get('/connections/:propertyId', authMiddleware, roleMiddleware(['landlord']), getConnectionsForProperty);

module.exports = router;