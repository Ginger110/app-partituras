import { createContext } from 'react';

export const AppContext = createContext(null);

// Vistas que solo tienen sentido con sesión iniciada (mensaje que se muestra al pedir login)
export const VISTAS_PRIVADAS = {
  perfil: 'Inicia sesión para ver tu perfil y tu repertorio.',
  subir: 'Inicia sesión para subir una partitura.'
};
