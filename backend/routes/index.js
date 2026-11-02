const router = require('express').Router();
const { conUsuario, requerirModerador } = require('../middlewares/usuarioDemo');
const catalogoCtrl = require('../controllers/catalogoCtrl');
const partituraCtrl = require('../controllers/partituraCtrl');
const adminCtrl = require('../controllers/adminCtrl');

router.use('/partituras', require('./partituraRoutes'));
router.use('/catalogos', require('./catalogoRoutes'));
router.use('/usuarios', require('./usuarioRoutes'));
router.get('/obras', catalogoCtrl.listarObras);
router.delete('/ratings/:id', conUsuario, requerirModerador, partituraCtrl.eliminarRating);
router.post('/admin/estructura', conUsuario, requerirModerador, adminCtrl.estructura);

module.exports = router;
