import AppProvider from './context/AppContext';
import { useApp } from './context/useApp';
import MainLayout from './views/layouts/MainLayout';
import CatalogoPage from './views/pages/CatalogoPage';
import PerfilPage from './views/pages/PerfilPage';
import SubirPartituraPage from './views/pages/SubirPartituraPage';
import './App.css';

function MainRouter() {
  const { currentView } = useApp();

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
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
