const express = require('express');
const { getStates, getLGAs, getAreas } = require('../controllers/locationController');
const router = express.Router();

router.get('/states', getStates);
router.get('/lgas/:state', getLGAs);
router.get('/areas/:state/:lga', getAreas);

module.exports = router;