// Consultas entre ambas bases: completan documentos de MongoDB con datos de usuarios de TiDB.
// TiDB es la fuente de verdad del nombre y del perfil; MongoDB guarda solo el id (y un nombre de respaldo).
// Siempre una sola consulta SQL por respuesta (WHERE id IN (...)), nunca una por documento.
const UsuarioModel = require('../models/UsuarioModel');
const { getDB } = require('../config/db');

// Reemplaza el {_id, nombre} guardado en `campo` de cada documento por los datos actuales del usuario
async function conUsuarios(docs, campo) {
  const ids = docs.map((d) => d[campo] && d[campo]._id).filter(Boolean);
  const usuarios = await UsuarioModel.resumenPorIds(ids);
  return docs.map((d) => {
    const ref = d[campo];
    const u = ref && usuarios.get(String(ref._id));
    if (!ref) return d;
    // Si el usuario ya no existe en TiDB se conserva el nombre guardado en MongoDB
    return { ...d, [campo]: u ? { ...ref, nombre: u.nombre, avatar_url: u.avatar_url, nivel_tecnico: u.nivel_tecnico, rol: u.rol } : ref };
  });
}

// Perfil = fila de TiDB + conteos de su actividad en MongoDB
async function conEstadisticas(usuario) {
  const db = getDB();
  const id = usuario._id;
  const [repertorio, favoritos, ratings, obras] = await Promise.all([
    db.collection('biblioteca').countDocuments({ usuario_id: id, lista: 'repertorio' }),
    db.collection('biblioteca').countDocuments({ usuario_id: id, lista: 'guardados' }),
    db.collection('ratings').countDocuments({ 'usuario._id': id }),
    db.collection('obras').countDocuments({ 'subido_por._id': id }),
  ]);
  return { ...usuario, estadisticas: { repertorio, favoritos, ratings, obras_subidas: obras } };
}

module.exports = { conUsuarios, conEstadisticas };
