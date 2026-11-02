require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { conectar } = require('./config/db');
const openapi = require('./docs/openapi');
const rutas = require('./routes');
const { noEncontrado, manejarErrores } = require('./utils/errores');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
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
  await conectar();
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
