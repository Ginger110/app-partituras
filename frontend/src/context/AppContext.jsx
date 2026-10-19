import { useState } from 'react';
import { AppContext } from './AppContextInstance';
import {
  INITIAL_USER,
  INITIAL_OBRAS,
  INITIAL_PARTITURAS,
  INITIAL_REPERTORIO,
  INITIAL_FAVORITOS
} from '../models/mockData';
import {
  calcularDificultadDinamica,
  recalcularNivelUsuario
} from '../utils/difficultyUtils';

export function AppProvider({ children }) {
  // Estado de navegación
  const [currentView, setCurrentView] = useState('catalogo'); // 'catalogo' | 'perfil' | 'subir'
  const [profileTab, setProfileTab] = useState('repertorio'); // 'repertorio' | 'favoritos' | 'editar'

  // Datos principales
  const [user, setUser] = useState(INITIAL_USER);
  const [obras, setObras] = useState(INITIAL_OBRAS);
  const [partituras, setPartituras] = useState(INITIAL_PARTITURAS);
  const [repertorio, setRepertorio] = useState(INITIAL_REPERTORIO);
  const [favoritos, setFavoritos] = useState(INITIAL_FAVORITOS);

  // Estados de demostración para evaluación UI/UX (UI State Switcher)
  // 'normal' | 'empty' | 'error' | 'feedback'
  const [uiState, setUiState] = useState('normal');

  // Modales interactivos
  const [ratingModalPartitura, setRatingModalPartitura] = useState(null);
  const [detailModalPartitura, setDetailModalPartitura] = useState(null);
  const [addRepertoryModalOpen, setAddRepertoryModalOpen] = useState(false);

  // Notificaciones Toast
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 4500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // CU01: Añadir al repertorio y recalcular nivel técnico dinámicamente
  const addToRepertorio = (partituraId) => {
    const found = partituras.find(p => p.id === partituraId);
    if (!found) return;

    if (repertorio.some(r => r.id === partituraId)) {
      addToast(`"${found.nombre}" ya está en tu repertorio.`, 'info');
      return;
    }

    const itemNuevo = {
      ...found,
      fecha_agregado: new Date().toISOString().split('T')[0],
      estado_dominio: 'Dominada',
      calificado: false,
      mi_calificacion: null
    };

    const nuevoRepertorio = [itemNuevo, ...repertorio];
    setRepertorio(nuevoRepertorio);

    // Recálculo del Nivel Técnico del Usuario
    const nivelAnterior = user.nivel_tecnico;
    const resultado = recalcularNivelUsuario(user.nivel_base, nuevoRepertorio);
    setUser(prev => ({ ...prev, nivel_tecnico: resultado.nuevoNivel }));

    addToast(
      `¡Partitura añadida a tu repertorio! Tu nivel técnico se actualizó de ${nivelAnterior.toFixed(1)} a ${resultado.nuevoNivel.toFixed(1)} (${resultado.delta >= 0 ? '+' : ''}${resultado.delta.toFixed(1)}).`,
      'success',
      6000
    );
  };

  // Eliminar del repertorio
  const removeFromRepertorio = (partituraId) => {
    const item = repertorio.find(r => r.id === partituraId);
    const nuevoRepertorio = repertorio.filter(r => r.id !== partituraId);
    setRepertorio(nuevoRepertorio);

    const resultado = recalcularNivelUsuario(user.nivel_base, nuevoRepertorio);
    setUser(prev => ({ ...prev, nivel_tecnico: resultado.nuevoNivel }));

    addToast(`"${item?.nombre || 'Obra'}" retirada del repertorio. Nivel ajustado a ${resultado.nuevoNivel.toFixed(1)}.`, 'info');
  };

  // Alternar favoritos
  const toggleFavorito = (partituraId) => {
    const found = partituras.find(p => p.id === partituraId);
    if (!found) return;

    if (favoritos.some(f => f.id === partituraId)) {
      setFavoritos(prev => prev.filter(f => f.id !== partituraId));
      addToast(`"${found.nombre}" eliminada de tus guardados.`, 'info');
    } else {
      setFavoritos(prev => [found, ...prev]);
      addToast(`"${found.nombre}" guardada en Favoritos para aprender luego.`, 'success');
    }
  };

  // CU02: Calificar Dificultad Relativa de una Partitura
  const submitRating = (partituraId, relativeValue) => {
    const partitura = partituras.find(p => p.id === partituraId);
    if (!partitura) return;

    const dificultadPrevia = partitura.dificultadCalculada;
    const nuevoRating = {
      id_usuario: user.id,
      nivel_usuario: user.nivel_tecnico,
      valor: relativeValue // -1, 0, 1
    };

    const nuevosRatings = [...(partitura.ratings || []), nuevoRating];
    const nuevaDificultad = calcularDificultadDinamica(partitura.dificultadEstimada, nuevosRatings);

    // Actualizar catálogo
    setPartituras(prev => prev.map(p => {
      if (p.id === partituraId) {
        return {
          ...p,
          ratings: nuevosRatings,
          totalRatings: (p.totalRatings || 0) + 1,
          dificultadCalculada: nuevaDificultad
        };
      }
      return p;
    }));

    // Actualizar en repertorio si está ahí
    setRepertorio(prev => prev.map(r => {
      if (r.id === partituraId) {
        return {
          ...r,
          calificado: true,
          mi_calificacion: relativeValue,
          dificultadCalculada: nuevaDificultad,
          totalRatings: (r.totalRatings || 0) + 1
        };
      }
      return r;
    }));

    // Mensaje de éxito con cálculo visible
    const textoValor = relativeValue === -1
      ? 'Menos exigente que tu nivel'
      : relativeValue === 0
      ? 'Igual a tu nivel'
      : 'Más exigente que tu nivel';

    addToast(
      `Calificación registrada ("${textoValor}"). Dificultad dinámica recalculada: ${dificultadPrevia.toFixed(1)} ➔ ${nuevaDificultad.toFixed(1)}.`,
      'success',
      6000
    );

    setRatingModalPartitura(null);
  };

  // CU03: Agregar Nueva Partitura / Arreglo
  const createPartitura = (data) => {
    let obraId = data.id_obra;
    let obraNombre = '';
    let obraAutor = '';

    if (data.modo === 'obra_nueva') {
      const nuevaObra = {
        id: obras.length + 1,
        nombre: data.nombre_obra,
        autor: data.autor_obra,
        epoca: data.estilo
      };
      setObras(prev => [...prev, nuevaObra]);
      obraId = nuevaObra.id;
      obraNombre = nuevaObra.nombre;
      obraAutor = nuevaObra.autor;
    } else {
      const obraExistente = obras.find(o => o.id === parseInt(data.id_obra, 10));
      obraNombre = obraExistente?.nombre || 'Obra seleccionada';
      obraAutor = obraExistente?.autor || 'Compositor';
    }

    const nuevaPartitura = {
      id: Date.now(),
      id_obra: obraId,
      nombre: data.nombre_partitura || `${obraNombre} (${data.instrumentacion})`,
      obra_nombre: obraNombre,
      autor_obra: obraAutor,
      instrumentacion: data.instrumentacion,
      estilo: data.estilo,
      arreglo: data.arreglo || 'Versión estándar',
      arreglista: data.arreglista || obraAutor,
      transcriptor: data.transcriptor || user.nombre,
      editor: data.editor || 'Comunidad Symphonia',
      url: data.url,
      info: data.info || 'Aportado por usuario.',
      precio: parseInt(data.precio || 0, 10),
      dificultadEstimada: parseFloat(data.dificultadEstimada || 4.0),
      dificultadCalculada: parseFloat(data.dificultadEstimada || 4.0),
      totalRatings: 1,
      ratings: [
        { id_usuario: user.id, nivel_usuario: user.nivel_tecnico, valor: 0 }
      ]
    };

    setPartituras(prev => [nuevaPartitura, ...prev]);
    addToast(`¡"${nuevaPartitura.nombre}" publicada con éxito en el Catálogo!`, 'success');
    setCurrentView('catalogo');
  };

  // Actualizar datos del usuario
  const updateUserProfile = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
    addToast('Perfil actualizado correctamente.', 'success');
  };

  // Control directo desde el UI State Switcher para demostración en la evaluación
  const handleSetUiState = (state) => {
    setUiState(state);
    if (state === 'feedback') {
      addToast('¡Partitura añadida a tu repertorio! Tu nivel técnico se ha actualizado de 4.2 a 4.5', 'success', 7000);
      addToast('Calificación relativa registrada con éxito en el sistema Bayesiano.', 'info', 7000);
    } else if (state === 'error') {
      addToast('Simulación activada: visualizando errores de validación en formularios (en rojo).', 'error');
    } else if (state === 'empty') {
      addToast('Simulación activada: visualizando estados vacíos (Empty States) con CTA.', 'info');
    } else {
      addToast('Restaurado estado normal con datos representativos completos.', 'success');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        profileTab,
        setProfileTab,
        user,
        setUser,
        obras,
        partituras,
        repertorio,
        favoritos,
        uiState,
        setUiState: handleSetUiState,
        ratingModalPartitura,
        setRatingModalPartitura,
        detailModalPartitura,
        setDetailModalPartitura,
        addRepertoryModalOpen,
        setAddRepertoryModalOpen,
        toasts,
        addToast,
        removeToast,
        addToRepertorio,
        removeFromRepertorio,
        toggleFavorito,
        submitRating,
        createPartitura,
        updateUserProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;
