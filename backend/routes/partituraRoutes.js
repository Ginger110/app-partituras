const router = require('express').Router();
const ctrl = require('../controllers/partituraCtrl');
const { conUsuario } = require('../middlewares/usuarioDemo');

// Las rutas fijas (/facetas) van antes de las parametrizadas (/:id)
router.get('/facetas', ctrl.facetas);
router.get('/', ctrl.listar);
router.post('/', conUsuario, ctrl.crear);
router.get('/:id', ctrl.obtener);
router.put('/:id/precio', ctrl.actualizarPrecio);
router.delete('/:id', ctrl.eliminar);
router.get('/:id/ratings', ctrl.listarRatings);
router.post('/:id/ratings', conUsuario, ctrl.calificar);

module.exports = router;
