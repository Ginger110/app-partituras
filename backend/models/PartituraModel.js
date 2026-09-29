const db = require('../config/db');

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
    // Tus otras funciones exportadas...,
    updatePrecio,
    updateNivelUsuario,
    deletePartitura,
    deleteUsuario,
    ejecutarDDL
};