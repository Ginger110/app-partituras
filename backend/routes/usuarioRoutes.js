const router = require('express').Router();
const ctrl = require('../controllers/usuarioCtrl');
const { conUsuarioAutenticado, requerirModerador } = require('../middlewares/authMiddleware');

router.post('/', ctrl.crear);

// Usuario autenticado (JWT)
router.get('/me', conUsuarioAutenticado, ctrl.me);
router.put('/me', conUsuarioAutenticado, ctrl.actualizarMe);
router.get('/me/repertorio', conUsuarioAutenticado, ctrl.listarRepertorio);
router.post('/me/repertorio', conUsuarioAutenticado, ctrl.agregarRepertorio);
router.delete('/me/repertorio/:partituraId', conUsuarioAutenticado, ctrl.quitarRepertorio);
router.get('/me/favoritos', conUsuarioAutenticado, ctrl.listarFavoritos);
router.post('/me/favoritos', conUsuarioAutenticado, ctrl.agregarFavorito);
router.delete('/me/favoritos/:partituraId', conUsuarioAutenticado, ctrl.quitarFavorito);

// Operaciones por id (solo moderador)
router.put('/:id/nivel', conUsuarioAutenticado, requerirModerador, ctrl.actualizarNivelPorId);
router.delete('/:id', conUsuarioAutenticado, requerirModerador, ctrl.eliminar);

module.exports = router;
