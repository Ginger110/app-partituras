const PartituraModel = require('../models/PartituraModel');

const getPartituras = async (req, res) => {
    try {
        // const data = await PartituraModel.getAll();
        // res.json(data);
        res.status(200).json({ message: 'Obtener todas las partituras' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPartituraById = async (req, res) => {
    try {
        const { id } = req.params;
        // const data = await PartituraModel.getById(id);
        res.status(200).json({ message: `Obtener partitura con id: ${id}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const obtenerPartiturasBaratas = async (req, res) => {
    try {
        res.status(200).json({ message: 'Obtener partituras baratas' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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

module.exports = {
    getPartituras,
    getPartituraById,
    obtenerPartiturasBaratas,
    crearUsuario,
    actualizarPrecio,
    actualizarNivel,
    eliminarPartitura,
    eliminarUsuario,
    ejecutarConsultasEstructurales
};