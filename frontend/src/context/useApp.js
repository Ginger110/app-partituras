import { useContext } from 'react';
import { AppContext } from './AppContextInstance';

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}
