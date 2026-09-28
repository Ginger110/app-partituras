const express = require('express');
const router = express.Router();
const partituraCtrl = require('../controllers/partituraCtrl');

// Definición de rutas / endpoints
router.get('/', partituraCtrl.getPartituras);
router.get('/:id', partituraCtrl.getPartituraById);

module.exports = router;
