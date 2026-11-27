import AppProvider from './context/AppContext';
import AuthProvider from './context/AuthContext';
import { useApp } from './context/useApp';
import ProtectedRoute from './views/components/ProtectedRoute';
import MainLayout from './views/layouts/MainLayout';
import CatalogoPage from './views/pages/CatalogoPage';
import PerfilPage from './views/pages/PerfilPage';
import SubirPartituraPage from './views/pages/SubirPartituraPage';
import './App.css';

// Pantalla simple para la carga inicial y los errores de conexión con la API
function PantallaEstado({ titulo, mensaje, accion }) {
  return (
    <div
      role={accion ? 'alert' : 'status'}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}
    >
      <h1 style={{ fontSize: '1.4rem', margin: 0 }}>{titulo}</h1>
      <p style={{ margin: 0, maxWidth: '32rem', opacity: 0.8 }}>{mensaje}</p>
      {accion && (
        <button type="button" onClick={accion.onClick} className="btn-primary">
          {accion.texto}
        </button>
      )}
    </div>
  );
}

function MainRouter() {
  const { currentView, cargando, errorCarga, reintentarCarga } = useApp();

  if (cargando) {
    return (
      <PantallaEstado
        titulo="Cargando el catálogo…"
        mensaje="Conectando con el servidor. La primera carga puede tardar unos segundos."
      />
    );
  }
  if (errorCarga) {
    return (
      <PantallaEstado
        titulo="No pudimos cargar los datos"
        mensaje={errorCarga}
        accion={{ texto: 'Reintentar', onClick: reintentarCarga }}
      />
    );
  }

  return (
    <MainLayout>
      {currentView === 'catalogo' && <CatalogoPage />}
      {currentView === 'perfil' && <PerfilPage />}
      {currentView === 'subir' && <SubirPartituraPage />}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        {/* AppProvider se monta tras autenticar: carga los datos con el token y se reinicia al cerrar sesión */}
        <AppProvider>
          <MainRouter />
        </AppProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
