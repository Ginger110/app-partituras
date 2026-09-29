const PartituraModel = require('../models/PartituraModel');

const getPartituras = async (req, res) => {
    try {
        const data = await PartituraModel.getAll();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPartituraById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await PartituraModel.getById(id);
        if (!data) return res.status(404).json({ mensaje: 'Partitura no encontrada' });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const obtenerPartiturasBaratas = async (req, res) => {
    try {
        const precioMax = req.query.max || 10000; // ej: /filtro/baratas?max=5000
        const data = await PartituraModel.getPartiturasBaratas(precioMax);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crearUsuario = async (req, res) => {
    try {
        const { nombre, email, nivel_tecnico, estilo, link_portafolio } = req.body;
        const resultado = await PartituraModel.insertarNuevoUsuario(nombre, email, nivel_tecnico, estilo, link_portafolio);
        res.status(201).json({ mensaje: 'Usuario creado correctamente', id: resultado[0].insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la inserción' });
    }
};

const crearPartitura = async (req, res) => {
    try {
        const { instrumentacion, id_obra, nombre, estilo, arreglo, arreglista, transcriptor, editor, url, info, precio } = req.body;
        const resultado = await PartituraModel.insertarNuevaPartitura(instrumentacion, id_obra, nombre, estilo, arreglo, arreglista, transcriptor, editor, url, info, precio);
        res.status(201).json({ mensaje: 'Partitura creada correctamente', id: resultado[0].insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear partitura' });
    }
};

const crearRating = async (req, res) => {
    try {
        const { id_usuario, valor, nivel_usuario, id_partitura } = req.body;
        await PartituraModel.insertarRating(id_usuario, valor, nivel_usuario, id_partitura);
        res.status(201).json({ mensaje: 'Rating creado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear rating' });
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
        const { tipo_consulta } = req.body; // tipo_consulta: "alter1" | "alter2" | "drop"
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
    crearPartitura,
    crearRating,
    actualizarPrecio,
    actualizarNivel,
    eliminarPartitura,
    eliminarUsuario,
    ejecutarConsultasEstructurales
};
