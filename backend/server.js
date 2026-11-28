require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const { conectar } = require('./config/db');
const { conectarSQL } = require('./config/mysql');
const openapi = require('./docs/openapi');
const rutas = require('./routes');
const UsuarioModel = require('./models/UsuarioModel');
const { noEncontrado, manejarErrores } = require('./utils/errores');

const app = express();

// Con cookies de sesión el origen no puede ser "*": se usa una lista explícita (separada por comas)
const origenesPermitidos = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter((o) => o && o !== '*');

app.use(cors({ origin: origenesPermitidos, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Partituras funcionando correctamente', docs: '/api-docs' });
});

// Documentación interactiva (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'API App Partituras' }));
app.get('/api-docs.json', (req, res) => res.json(openapi));

// Rutas de la API
app.use('/api', rutas);

app.use(noEncontrado);
app.use(manejarErrores);

// Inicialización del servidor
async function iniciar() {
  if (!process.env.JWT_SECRET) throw new Error('Falta la variable de entorno JWT_SECRET');
  await conectar();      // MongoDB Atlas (NoSQL)
  await conectarSQL();   // TiDB Cloud (relacional)
  await UsuarioModel.asegurarIndices();
  const PORT = process.env.PORT || 3000;
  return app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
}

if (require.main === module) {
  iniciar().catch((e) => {
    console.error('No se pudo iniciar el servidor:', e.message);
    process.exit(1);
  });
}

module.exports = { app, iniciar };
