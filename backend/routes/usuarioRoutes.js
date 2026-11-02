const router = require('express').Router();
const ctrl = require('../controllers/usuarioCtrl');
const { conUsuario, requerirModerador } = require('../middlewares/usuarioDemo');

router.post('/', ctrl.crear);

// Usuario actual (demo)
router.get('/me', conUsuario, ctrl.me);
router.put('/me', conUsuario, ctrl.actualizarMe);
router.get('/me/repertorio', conUsuario, ctrl.listarRepertorio);
router.post('/me/repertorio', conUsuario, ctrl.agregarRepertorio);
router.delete('/me/repertorio/:partituraId', conUsuario, ctrl.quitarRepertorio);
router.get('/me/favoritos', conUsuario, ctrl.listarFavoritos);
router.post('/me/favoritos', conUsuario, ctrl.agregarFavorito);
router.delete('/me/favoritos/:partituraId', conUsuario, ctrl.quitarFavorito);

// Operaciones por id
router.put('/:id/nivel', ctrl.actualizarNivelPorId);
router.delete('/:id', conUsuario, requerirModerador, ctrl.eliminar);

module.exports = router;
