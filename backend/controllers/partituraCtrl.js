const PartituraModel = require('../models/PartituraModel');

const partituraCtrl = {
  // Lógica de peticiones y respuestas HTTP
  getPartituras: async (req, res) => {
    try {
      // const data = await PartituraModel.getAll();
      // res.json(data);
      res.json({ message: 'Obtener todas las partituras' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPartituraById: async (req, res) => {
    try {
      const { id } = req.params;
      // const data = await PartituraModel.getById(id);
      res.json({ message: `Obtener partitura con id: ${id}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = partituraCtrl;

const crearUsuario = async (req, res) => {
    try {
        // Desestructuramos el JSON que llega desde Postman
        const { nombre, email, nivel_tecnico, estilo, link_portafolio } = req.body;
        
        // Aquí invocas a tu Modelo para ejecutar el INSERT SQL real
        // const resultado = await PartituraModel.insertarNuevoUsuario(nombre, email, nivel_tecnico, estilo, link_portafolio);

        // Respondemos a Postman confirmando que llegó la petición
        res.status(201).json({ 
            mensaje: 'Petición POST recibida correctamente', 
            datosInsertados: req.body 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la inserción' });
    }
};

// Recuerda exportar esta nueva función junto con las que ya tenías
module.exports = {
    // getPartituras,
    // getPartituraById,
    crearUsuario
};
const PartituraModel = require('../models/PartituraModel');

// (Tus funciones anteriores: getPartituras, getPartituraById, crearUsuario, obtenerPartiturasBaratas...)

const actualizarPrecio = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevo_precio } = req.body;
        await PartituraModel.updatePrecio(id, nuevo_precio);
        res.status(200).json({ mensaje: `Precio actualizado a ${nuevo_precio} para la partitura ${id}` });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar precio' });
    }
};

const actualizarNivel = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevo_nivel } = req.body;
        await PartituraModel.updateNivelUsuario(id, nuevo_nivel);
        res.status(200).json({ mensaje: `Nivel técnico actualizado a ${nuevo_nivel} para el usuario ${id}` });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar nivel' });
    }
};

const eliminarPartitura = async (req, res) => {
    try {
        const { id } = req.params;
        await PartituraModel.deletePartitura(id);
        res.status(200).json({ mensaje: `Partitura ${id} eliminada correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar partitura' });
    }
};

const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        await PartituraModel.deleteUsuario(id);
        res.status(200).json({ mensaje: `Usuario ${id} eliminado correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

const ejecutarConsultasEstructurales = async (req, res) => {
    try {
        const { tipo_consulta } = req.body; // Envías desde Postman qué quieres ejecutar ("alter1", "alter2" o "drop")
        await PartituraModel.ejecutarDDL(tipo_consulta);
        res.status(200).json({ mensaje: `Consulta estructural ${tipo_consulta} ejecutada exitosamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al modificar la estructura de la BD' });
    }
};

// EXPORTAR TODO (reemplaza tu module.exports actual con este)
module.exports = {
    // getPartituras, getPartituraById, crearUsuario, obtenerPartiturasBaratas, // (descomenta las que ya tenías)
    actualizarPrecio,
    actualizarNivel,
    eliminarPartitura,
    eliminarUsuario,
    ejecutarConsultasEstructurales
};