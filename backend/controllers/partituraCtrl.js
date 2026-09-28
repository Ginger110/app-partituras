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
