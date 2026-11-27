const router = require('express').Router();
const ctrl = require('../controllers/partituraCtrl');
const { conUsuarioAutenticado } = require('../middlewares/authMiddleware');

// Lectura: pública. Escritura: requiere JWT.
// Las rutas fijas (/facetas) van antes de las parametrizadas (/:id)
router.get('/facetas', ctrl.facetas);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.get('/:id/ratings', ctrl.listarRatings);

router.post('/', conUsuarioAutenticado, ctrl.crear);
router.put('/:id/precio', conUsuarioAutenticado, ctrl.actualizarPrecio);
router.delete('/:id', conUsuarioAutenticado, ctrl.eliminar);
router.post('/:id/ratings', conUsuarioAutenticado, ctrl.calificar);

module.exports = router;
