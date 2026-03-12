const express = require('express');
const multer = require('multer');
const { uploadImages } = require('../controllers/uploadController');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.array('images', 10), uploadImages);

module.exports = router;
