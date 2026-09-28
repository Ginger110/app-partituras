require('dotenv').config();
const express = require('express');
const cors = require('cors');

const partituraRoutes = require('./routes/partituraRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/partituras', partituraRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Partituras funcionando correctamente' });
});

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
