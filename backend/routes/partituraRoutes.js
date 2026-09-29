const express = require('express');
const router = express.Router();
const partituraCtrl = require('../controllers/partituraCtrl');

// --- RUTAS GET (Lectura) ---
// Las rutas fijas/específicas van antes de las parametrizadas (:id) para evitar conflictos en Express

/**
 * @openapi
 * /api/partituras:
 *   get:
 *     summary: (SELECT 1 con JOIN) Obtener todas las partituras cruzadas con la tabla obra
 *     tags: [Partituras]
 *     responses:
 *       200:
 *         description: Lista completa de partituras obtenida con éxito.
 */
router.get('/', partituraCtrl.getPartituras);

/**
 * @openapi
 * /api/partituras/filtro/baratas:
 *   get:
 *     summary: (SELECT 2 Simple con WHERE) Obtener partituras filtradas por precio máximo
 *     tags: [Partituras]
 *     parameters:
 *       - in: query
 *         name: max
 *         schema:
 *           type: integer
 *         example: 4000
 *         description: Precio máximo para filtrar
 *     responses:
 *       200:
 *         description: Lista de partituras baratas obtenida correctamente.
 */
router.get('/filtro/baratas', partituraCtrl.obtenerPartiturasBaratas);

/**
 * @openapi
 * /api/partituras/{id}:
 *   get:
 *     summary: (SELECT 3 con JOIN) Obtener una partitura específica por ID con datos de la obra
 *     tags: [Partituras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Detalle de la partitura encontrada.
 *       404:
 *         description: Partitura no encontrada.
 */
router.get('/:id', partituraCtrl.getPartituraById);


// --- RUTAS POST (Creación) ---

/**
 * @openapi
 * /api/partituras/usuarios:
 *   post:
 *     summary: (INSERT 1) Registrar un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Carlos Santana"
 *               email:
 *                 type: string
 *                 example: "carlos@example.com"
 *               nivel_tecnico:
 *                 type: integer
 *                 example: 4
 *               estilo:
 *                 type: string
 *                 example: "Rock"
 *               link_portafolio:
 *                 type: string
 *                 example: "https://portafolio.example.com/carlos"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente.
 */
router.post('/usuarios', partituraCtrl.crearUsuario);

/**
 * @openapi
 * /api/partituras/partituras:
 *   post:
 *     summary: (INSERT 2) Crear una nueva partitura
 *     tags: [Partituras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instrumentacion
 *               - id_obra
 *               - nombre
 *               - estilo
 *               - url
 *               - info
 *               - precio
 *             properties:
 *               instrumentacion:
 *                 type: string
 *                 example: "Piano solo"
 *               id_obra:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "Clair de lune - Edición Transcripción"
 *               estilo:
 *                 type: string
 *                 example: "Impresionista"
 *               arreglo:
 *                 type: string
 *                 example: "N/A"
 *               arreglista:
 *                 type: string
 *                 example: "Camila"
 *               transcriptor:
 *                 type: string
 *                 example: "Camila"
 *               editor:
 *                 type: string
 *                 example: "Ediciones Sur"
 *               url:
 *                 type: string
 *                 example: "https://partituras.example.com/pdf/demo.pdf"
 *               info:
 *                 type: string
 *                 example: "Edición demo para pruebas"
 *               precio:
 *                 type: integer
 *                 example: 3500
 *     responses:
 *       201:
 *         description: Partitura creada correctamente.
 */
router.post('/partituras', partituraCtrl.crearPartitura);

/**
 * @openapi
 * /api/partituras/ratings:
 *   post:
 *     summary: (INSERT 3) Registrar una calificación (rating)
 *     tags: [Ratings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_usuario
 *               - valor
 *               - nivel_usuario
 *               - id_partitura
 *             properties:
 *               id_usuario:
 *                 type: integer
 *                 example: 1
 *               valor:
 *                 type: integer
 *                 example: 5
 *               nivel_usuario:
 *                 type: integer
 *                 example: 3
 *               id_partitura:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Calificación registrada con éxito.
 */
router.post('/ratings', partituraCtrl.crearRating);


// --- RUTAS PUT (Actualización) ---

/**
 * @openapi
 * /api/partituras/partituras/{id}/precio:
 *   put:
 *     summary: (UPDATE 1) Actualizar el precio de una partitura por ID
 *     tags: [Partituras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nuevo_precio
 *             properties:
 *               nuevo_precio:
 *                 type: integer
 *                 example: 4500
 *     responses:
 *       200:
 *         description: Precio actualizado correctamente.
 */
router.put('/partituras/:id/precio', partituraCtrl.actualizarPrecio);

/**
 * @openapi
 * /api/partituras/usuarios/{id}/nivel:
 *   put:
 *     summary: (UPDATE 2) Actualizar el nivel técnico de un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nuevo_nivel
 *             properties:
 *               nuevo_nivel:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Nivel técnico actualizado correctamente.
 */
router.put('/usuarios/:id/nivel', partituraCtrl.actualizarNivel);


// --- RUTAS DELETE (Eliminación) ---

/**
 * @openapi
 * /api/partituras/partituras/{id}:
 *   delete:
 *     summary: (DELETE 1) Eliminar una partitura por ID
 *     tags: [Partituras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Partitura eliminada correctamente.
 */
router.delete('/partituras/:id', partituraCtrl.eliminarPartitura);

/**
 * @openapi
 * /api/partituras/usuarios/{id}:
 *   delete:
 *     summary: (DELETE 2) Eliminar un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente.
 */
router.delete('/usuarios/:id', partituraCtrl.eliminarUsuario);


// --- RUTA ADMIN PARA DDL (ALTER y DROP) ---

/**
 * @openapi
 * /api/partituras/admin/ddl:
 *   post:
 *     summary: (ALTER / DROP) Ejecutar consultas estructurales DDL en la base de datos
 *     tags: [Admin / DDL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_consulta
 *             properties:
 *               tipo_consulta:
 *                 type: string
 *                 description: Opciones válidas -> "alter1", "alter2" o "drop"
 *                 example: "alter1"
 *     responses:
 *       200:
 *         description: Consulta estructural DDL ejecutada exitosamente.
 */
router.post('/admin/ddl', partituraCtrl.ejecutarConsultasEstructurales);

module.exports = router;