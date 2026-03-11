const express = require('express');
const { getProperties, getPropertyById, createProperty, updateProperty, deleteProperty, getLandlordProperties, uploadImages } = require('../controllers/propertyController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.post('/', authMiddleware, roleMiddleware(['landlord']), createProperty);
router.put('/:id', authMiddleware, roleMiddleware(['landlord']), updateProperty);
router.delete('/:id', authMiddleware, roleMiddleware(['landlord']), deleteProperty);
router.get('/landlord/my', authMiddleware, roleMiddleware(['landlord']), getLandlordProperties);
router.post('/upload-images', authMiddleware, upload.array('images', 10), uploadImages);

module.exports = router;