const router = require('express').Router();
const ctrl = require('../controllers/catalogoCtrl');

router.get('/', ctrl.listarCatalogos);
router.get('/:id', ctrl.obtenerCatalogo);

module.exports = router;
