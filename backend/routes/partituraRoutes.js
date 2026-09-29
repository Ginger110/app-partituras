const express = require('express');
const router = express.Router();
const partituraCtrl = require('../controllers/partituraCtrl');

// --- RUTAS GET (Lectura) ---
// Las rutas fijas/específicas van antes de las parametrizadas (:id) para evitar conflictos en Express
router.get('/', partituraCtrl.getPartituras);
router.get('/filtro/baratas', partituraCtrl.obtenerPartiturasBaratas);
router.get('/:id', partituraCtrl.getPartituraById);

// --- RUTAS POST (Creación) ---
router.post('/usuarios', partituraCtrl.crearUsuario);
router.post('/partituras', partituraCtrl.crearPartitura);
router.post('/ratings', partituraCtrl.crearRating);

// --- RUTAS PUT (Actualización) ---
router.put('/partituras/:id/precio', partituraCtrl.actualizarPrecio);
router.put('/usuarios/:id/nivel', partituraCtrl.actualizarNivel);

// --- RUTAS DELETE (Eliminación) ---
router.delete('/partituras/:id', partituraCtrl.eliminarPartitura);
router.delete('/usuarios/:id', partituraCtrl.eliminarUsuario);

// --- RUTA ADMIN PARA DDL (ALTER y DROP) ---
router.post('/admin/ddl', partituraCtrl.ejecutarConsultasEstructurales);

module.exports = router;
