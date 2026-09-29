const express = require('express');
const router = express.Router();
const partituraCtrl = require('../controllers/partituraCtrl');

// --- RUTAS GET (Lectura) ---
router.get('/', partituraCtrl.getPartituras);
router.get('/:id', partituraCtrl.getPartituraById);
router.get('/filtro/baratas', partituraCtrl.obtenerPartiturasBaratas); // El JOIN que hicimos antes

// --- RUTAS POST (Creación) ---
router.post('/usuarios', partituraCtrl.crearUsuario);

// --- RUTAS PUT (Actualización) ---
router.put('/partituras/:id/precio', partituraCtrl.actualizarPrecio);
router.put('/usuarios/:id/nivel', partituraCtrl.actualizarNivel);

// --- RUTAS DELETE (Eliminación) ---
router.delete('/partituras/:id', partituraCtrl.eliminarPartitura);
router.delete('/usuarios/:id', partituraCtrl.eliminarUsuario);

// --- RUTA ADMIN PARA DDL (ALTER y DROP) ---
router.post('/admin/ddl', partituraCtrl.ejecutarConsultasEstructurales);

module.exports = router;