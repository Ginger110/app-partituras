import Navbar from '../components/Navbar';
import RatingModal from '../components/RatingModal';
import DetailModal from '../components/DetailModal';
import AddToRepertoryModal from '../components/AddToRepertoryModal';
import ToastNotification from '../components/ToastNotification';
import UIStateSwitcher from '../components/UIStateSwitcher';

export default function MainLayout({ children }) {
  return (
    <div className="app-shell">
      {/* 1. Header Global con Logo, Links y Badge de Nivel Técnico */}
      <Navbar />

      {/* 2. Contenido de la Pantalla Activa */}
      <div className="main-content-area">
        {children}
      </div>

      {/* 3. Footer Global */}
      <footer className="global-footer">
        <div className="footer-container">
          <div className="footer-left">
            <span className="footer-brand">ScorePulse &copy; 2026</span>
            <span className="footer-sep">•</span>
            <span className="footer-sub">Sistema de Catalogación y Cálculo Dinámico de Dificultad Técnica Instrumental</span>
          </div>
          <div className="footer-right">
            <span className="wcag-badge" title="Contraste de color certificado >= 4.5:1">
              ✓ Estándar WCAG AA Accesible
            </span>
          </div>
        </div>
      </footer>

      {/* 4. Modales Globales */}
      <RatingModal />
      <DetailModal />
      <AddToRepertoryModal />

      {/* 5. Notificaciones Toast */}
      <ToastNotification />

      {/* 6. Panel Flotante de Demostración de Estados UI (Evaluación) */}
      <UIStateSwitcher />
    </div>
  );
}
