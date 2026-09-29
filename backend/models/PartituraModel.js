const db = require('../config/db');

const getAll = async () => {
    // const [rows] = await db.query('SELECT * FROM partitura');
    // return rows;
};

const getById = async (id) => {
    // const [rows] = await db.query('SELECT * FROM partitura WHERE id = ?', [id]);
    // return rows[0];
};

const insertarNuevoUsuario = async (nombre, email, nivel_tecnico, estilo, link_portafolio) => {
    const query = 'INSERT INTO usuario (nombre, email, nivel_tecnico, estilo, link_portafolio) VALUES (?, ?, ?, ?, ?)';
    return await db.execute(query, [nombre, email, nivel_tecnico, estilo, link_portafolio]);
};

const updatePrecio = async (id, nuevoPrecio) => {
    const query = 'UPDATE partitura SET precio = ? WHERE id = ?';
    return await db.execute(query, [nuevoPrecio, id]);
};

const updateNivelUsuario = async (id, nuevoNivel) => {
    const query = 'UPDATE usuario SET nivel_tecnico = ? WHERE id = ?';
    return await db.execute(query, [nuevoNivel, id]);
};

const deletePartitura = async (id) => {
    const query = 'DELETE FROM partitura WHERE id = ?';
    return await db.execute(query, [id]);
};

const deleteUsuario = async (id) => {
    // Precaución: Si el usuario tiene llaves foráneas en otras tablas (ej. rating), debes eliminarlas primero o configurar cascada en la BD.
    const query = 'DELETE FROM usuario WHERE id = ?';
    return await db.execute(query, [id]);
};

const ejecutarDDL = async (tipo) => {
    let query = '';
    if (tipo === 'alter1') {
        query = 'ALTER TABLE usuario ADD COLUMN fecha_registro DATE;';
    } else if (tipo === 'alter2') {
        query = 'ALTER TABLE partitura MODIFY COLUMN precio DECIMAL(10,2);';
    } else if (tipo === 'drop') {
        query = 'DROP TABLE IF EXISTS rating;'; // Ajusta la tabla a la que deban hacerle DROP según sus consultas originales
    }
    
    if (query) {
        return await db.execute(query);
    } else {
        throw new Error('Tipo de consulta DDL no válida');
    }
};

module.exports = {
    getAll,
    getById,
    insertarNuevoUsuario,
    updatePrecio,
    updateNivelUsuario,
    deletePartitura,
    deleteUsuario,
    ejecutarDDL
};