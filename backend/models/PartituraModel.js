const db = require('../config/db');

const PartituraModel = {
  // Consultas SQL a implementar
  getAll: async () => {
    // const [rows] = await db.query('SELECT * FROM partituras');
    // return rows;
  },

  getById: async (id) => {
    // const [rows] = await db.query('SELECT * FROM partituras WHERE id = ?', [id]);
    // return rows[0];
  }
};

module.exports = PartituraModel;
