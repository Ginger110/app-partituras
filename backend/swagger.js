const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API App Partituras - Etapa 1',
      version: '1.0.0',
      description: 'Documentación de las 13 consultas SQL requeridas en la evaluación',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local',
      },
      {
        url: 'https://app-partituras-uwf2.onrender.com/',
        description: 'Servidor Render (Producción)',
      },
    ],
  },
  apis: ['./routes/*.js'], // Lee la documentación de las rutas
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger UI interactivo disponible en /api-docs');
};

module.exports = setupSwagger;