import { useState, useEffect } from 'react';
import { AppContext } from './AppContextInstance';
import { api } from '../models/services/api';

// Consulta a la API todo lo que necesita la app al iniciar
function obtenerDatosIniciales() {
  return Promise.all([
    api.usuarioActual(),
    api.obras(),
    api.partituras(),
    api.repertorio(),
    api.favoritos(),
    api.facetas()
  ]);
}

export function AppProvider({ children }) {
  // Modo Oscuro / Claro con persistencia en localStorage y detección de preferencia del SO
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('scorepulse_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback a modo claro
    }
    return 'light';
  });

  // Estado de navegación
  const [currentView, setCurrentView] = useState('catalogo'); // 'catalogo' | 'perfil' | 'subir'
  const [profileTab, setProfileTab] = useState('repertorio'); // 'repertorio' | 'favoritos' | 'editar'

  // Datos principales (vienen de la API / MongoDB)
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [partituras, setPartituras] = useState([]);
  const [repertorio, setRepertorio] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [facetas, setFacetas] = useState({ instrumentaciones: [], estilos: [] });

  // Estado de la carga inicial y versión del catálogo (se incrementa cuando los datos cambian)
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [catalogVersion, setCatalogVersion] = useState(0);

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

  // Carga inicial desde la API
  const aplicarDatosIniciales = ([u, listaObras, listaPartituras, listaRepertorio, listaFavoritos, opciones]) => {
    setUser(u);
    setObras(listaObras);
    setPartituras(listaPartituras);
    setRepertorio(listaRepertorio);
    setFavoritos(listaFavoritos);
    setFacetas(opciones);
    setCargando(false);
  };

  useEffect(() => {
    let cancelado = false;
    obtenerDatosIniciales()
      .then((datos) => {
        if (!cancelado) aplicarDatosIniciales(datos);
      })
      .catch((e) => {
        if (!cancelado) {
          setErrorCarga(e.message);
          setCargando(false);
        }
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Botón "Reintentar" de la pantalla de error
  const reintentarCarga = () => {
    setCargando(true);
    setErrorCarga(null);
    obtenerDatosIniciales()
      .then(aplicarDatosIniciales)
      .catch((e) => {
        setErrorCarga(e.message);
        setCargando(false);
      });
  };

  // Sincronizar tema con <html> y almacenamiento local
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('scorepulse_theme', theme);
    } catch {
      // Ignorar
    }
  }, [theme]);

  const toggleTheme = () => {
  const next = theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  addToast(
    next === 'dark' ? 'Modo oscuro activado 🌙' : 'Modo claro activado ☀️',
    'info',
    2500
  );
};

  // Reemplaza una partitura actualizada en todas las listas en memoria
  const reemplazarPartitura = (actualizada) => {
    setPartituras(prev => prev.map(p => (p.id === actualizada.id ? actualizada : p)));
    setFavoritos(prev => prev.map(f => (f.id === actualizada.id ? actualizada : f)));
    setRepertorio(prev => prev.map(r => (r.id === actualizada.id ? { ...r, ...actualizada } : r)));
  };

  // CU01: Añadir al repertorio y recalcular nivel técnico (el cálculo lo hace el backend)
  const addToRepertorio = async (partituraId) => {
    const found = partituras.find(p => p.id === partituraId);
    if (!found) return;

    if (repertorio.some(r => r.id === partituraId)) {
      addToast(`"${found.nombre}" ya está en tu repertorio.`, 'info');
      return;
    }

    try {
      const r = await api.agregarRepertorio(partituraId);
      setRepertorio(prev => [r.item, ...prev]);
      setUser(r.usuario);
      addToast(
        `¡Partitura añadida a tu repertorio! Tu nivel técnico se actualizó de ${r.nivelAnterior.toFixed(1)} a ${r.nuevoNivel.toFixed(1)} (${r.delta >= 0 ? '+' : ''}${r.delta.toFixed(1)}).`,
        'success',
        6000
      );
    } catch (e) {
      addToast(e.status === 409 ? `"${found.nombre}" ya está en tu repertorio.` : e.message, e.status === 409 ? 'info' : 'error');
    }
  };

  // Eliminar del repertorio
  const removeFromRepertorio = async (partituraId) => {
    const item = repertorio.find(r => r.id === partituraId);
    try {
      const r = await api.quitarRepertorio(partituraId);
      setRepertorio(prev => prev.filter(x => x.id !== partituraId));
      setUser(r.usuario);
      addToast(`"${item?.nombre || 'Obra'}" retirada del repertorio. Nivel ajustado a ${r.nuevoNivel.toFixed(1)}.`, 'info');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // Alternar favoritos
  const toggleFavorito = async (partituraId) => {
    const found = partituras.find(p => p.id === partituraId) || favoritos.find(f => f.id === partituraId);
    if (!found) return;

    try {
      if (favoritos.some(f => f.id === partituraId)) {
        await api.quitarFavorito(partituraId);
        setFavoritos(prev => prev.filter(f => f.id !== partituraId));
        addToast(`"${found.nombre}" eliminada de tus guardados.`, 'info');
      } else {
        const guardada = await api.agregarFavorito(partituraId);
        setFavoritos(prev => [guardada, ...prev]);
        addToast(`"${found.nombre}" guardada en Favoritos para aprender luego.`, 'success');
      }
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // CU02: Calificar Dificultad Relativa de una Partitura (el recálculo bayesiano lo hace el backend)
  const submitRating = async (partituraId, relativeValue) => {
    try {
      const r = await api.calificar(partituraId, relativeValue);

      reemplazarPartitura(r.partitura);
      setRepertorio(prev => prev.map(item => (
        item.id === partituraId ? { ...item, calificado: true, mi_calificacion: relativeValue } : item
      )));
      setCatalogVersion(v => v + 1);

      const textoValor = relativeValue === -1
        ? 'Menos exigente que tu nivel'
        : relativeValue === 0
        ? 'Igual a tu nivel'
        : 'Más exigente que tu nivel';

      addToast(
        `Calificación registrada ("${textoValor}"). Dificultad dinámica recalculada: ${r.dificultadPrevia.toFixed(1)} ➔ ${r.dificultadNueva.toFixed(1)}.`,
        'success',
        6000
      );
      setRatingModalPartitura(null);
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // CU03: Agregar Nueva Partitura / Arreglo
  const createPartitura = async (data) => {
    try {
      const r = await api.crearPartitura(data);
      setPartituras(prev => [r.partitura, ...prev]);
      if (r.obra_creada) setObras(await api.obras());
      setFacetas(await api.facetas());
      setCatalogVersion(v => v + 1);
      addToast(`¡"${r.partitura.nombre}" publicada con éxito en el Catálogo!`, 'success');
      setCurrentView('catalogo');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // Actualizar datos del usuario
  const updateUserProfile = async (updatedFields) => {
    try {
      setUser(await api.actualizarPerfil(updatedFields));
      addToast('Perfil actualizado correctamente.', 'success');
    } catch (e) {
      addToast(e.status === 409 ? 'Ese correo electrónico ya está en uso.' : e.message, 'error');
    }
  };

  // Control directo desde el UI State Switcher para demostración en la evaluación
  const handleSetUiState = (state) => {
    setUiState(state);
    if (state === 'feedback') {
      addToast('¡Partitura añadida a tu repertorio! Tu nivel técnico se ha actualizado de 4.2 a 4.5', 'success', 7000);
      addToast('Calificación relativa registrada con éxito.', 'info', 7000);
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
        theme,
        setTheme,
        toggleTheme,
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
        facetas,
        cargando,
        errorCarga,
        reintentarCarga,
        catalogVersion,
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
