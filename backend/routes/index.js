const router = require('express').Router();
const { conUsuarioAutenticado, requerirModerador } = require('../middlewares/authMiddleware');
const catalogoCtrl = require('../controllers/catalogoCtrl');
const partituraCtrl = require('../controllers/partituraCtrl');
const adminCtrl = require('../controllers/adminCtrl');

router.use('/auth', require('./authRoutes'));
router.use('/partituras',require('./partituraRoutes'));
router.use('/catalogos', require('./catalogoRoutes'));
router.use('/usuarios', require('./usuarioRoutes'));
router.get('/obras', catalogoCtrl.listarObras);
router.delete('/ratings/:id', conUsuarioAutenticado, requerirModerador, partituraCtrl.eliminarRating);
router.post('/admin/estructura', conUsuarioAutenticado, requerirModerador, adminCtrl.estructura);

module.exports = router;
