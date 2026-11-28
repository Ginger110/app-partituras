import { useState, useEffect } from 'react';
import { AppContext, VISTAS_PRIVADAS } from './AppContextInstance';
import { api } from '../models/services/api';
import { useAuth } from './useAuth';

// Datos públicos del catálogo (no requieren sesión)
function obtenerDatosIniciales() {
  return Promise.all([api.obras(), api.partituras(), api.facetas()]);
}

// Datos personales (requieren JWT)
function obtenerDatosUsuario() {
  return Promise.all([api.usuarioActual(), api.repertorio(), api.favoritos()]);
}

export function AppProvider({ children }) {
  const { sesion, requireAuth, consumirAccionPendiente } = useAuth();

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
  const [currentView, setCurrentViewRaw] = useState('catalogo'); // 'catalogo' | 'perfil' | 'subir'
  const [profileTab, setProfileTab] = useState('repertorio'); // 'repertorio' | 'favoritos' | 'editar'

  // Datos públicos (vienen de la API / MongoDB)
  const [obras, setObras] = useState([]);
  const [partituras, setPartituras] = useState([]);
  const [facetas, setFacetas] = useState({ instrumentaciones: [], estilos: [] });

  // Datos personales: solo se exponen si pertenecen a la sesión actual (al cerrar sesión desaparecen)
  const [datosDe, setDatosDe] = useState(null);
  const [userState, setUser] = useState(null);
  const [repertorioState, setRepertorio] = useState([]);
  const [favoritosState, setFavoritos] = useState([]);
  const datosVigentes = !!sesion && datosDe === sesion;
  const user = datosVigentes ? userState : null;
  const repertorio = datosVigentes ? repertorioState : [];
  const favoritos = datosVigentes ? favoritosState : [];

  // Estado de la carga inicial y versión del catálogo (se incrementa cuando los datos cambian)
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [catalogVersion, setCatalogVersion] = useState(0);

  // Estados de demostración para evaluación UI/UX (UI State Switcher)
  // 'normal' | 'empty' | 'error' | 'feedback'
  const [uiState, setUiState] = useState('normal');

  // Modales interactivos
  const [ratingModalPartitura, setRatingModalPartituraRaw] = useState(null);
  const [detailModalPartitura, setDetailModalPartitura] = useState(null);
  const [addRepertoryModalOpen, setAddRepertoryModalOpenRaw] = useState(false);

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

  // Carga inicial (pública) desde la API
  const aplicarDatosIniciales = ([listaObras, listaPartituras, opciones]) => {
    setObras(listaObras);
    setPartituras(listaPartituras);
    setFacetas(opciones);
    setCargando(false);
  };

  // Datos del usuario cada vez que cambia la sesión; luego retoma la acción que pidió iniciar sesión
  useEffect(() => {
    if (!sesion) return undefined;
    let cancelado = false;
    obtenerDatosUsuario()
      .then(([u, listaRepertorio, listaFavoritos]) => {
        if (cancelado) return;
        setUser(u);
        setRepertorio(listaRepertorio);
        setFavoritos(listaFavoritos);
        setDatosDe(sesion);
        consumirAccionPendiente();
      })
      .catch((e) => {
        // 401/403: el cliente HTTP ya cerró la sesión
        if (!cancelado && e.status !== 401 && e.status !== 403) {
          addToast(`No se pudieron cargar tus datos: ${e.message}`, 'error');
        }
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion, consumirAccionPendiente]);

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
      // 409: ya estaba guardada (p. ej. la acción se retomó tras iniciar sesión)
      addToast(e.status === 409 ? `"${found.nombre}" ya está en tus favoritos.` : e.message, e.status === 409 ? 'info' : 'error');
    }
  };

  // --- Guardias de acción: sin sesión abren el login y la acción se retoma al autenticarse ---
  const conSesion = (mensaje, accion) => (...args) => requireAuth(() => accion(...args), mensaje);

  const setCurrentView = (vista) => {
    if (VISTAS_PRIVADAS[vista]) requireAuth(() => setCurrentViewRaw(vista), VISTAS_PRIVADAS[vista]);
    else setCurrentViewRaw(vista);
  };

  const setRatingModalPartitura = (partitura) => {
    if (!partitura) setRatingModalPartituraRaw(null);
    else requireAuth(() => setRatingModalPartituraRaw(partitura), 'Inicia sesión para calificar la dificultad de esta partitura.');
  };

  const setAddRepertoryModalOpen = (abierto) => {
    if (!abierto) setAddRepertoryModalOpenRaw(false);
    else requireAuth(() => setAddRepertoryModalOpenRaw(true), 'Inicia sesión para añadir obras a tu repertorio.');
  };

  // Cerrar sesión desde la UI: vuelve al catálogo y cierra los modales personales
  const limpiarVistaPrivada = () => {
    setCurrentViewRaw('catalogo');
    setRatingModalPartituraRaw(null);
    setAddRepertoryModalOpenRaw(false);
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
        limpiarVistaPrivada,
        addToRepertorio: conSesion('Inicia sesión para añadir obras a tu repertorio.', addToRepertorio),
        removeFromRepertorio: conSesion('Inicia sesión para modificar tu repertorio.', removeFromRepertorio),
        toggleFavorito: conSesion('Inicia sesión para guardar partituras en tus favoritos.', toggleFavorito),
        submitRating: conSesion('Inicia sesión para calificar la dificultad de esta partitura.', submitRating),
        createPartitura: conSesion('Inicia sesión para subir una partitura.', createPartitura),
        updateUserProfile: conSesion('Inicia sesión para editar tu perfil.', updateUserProfile)
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;
