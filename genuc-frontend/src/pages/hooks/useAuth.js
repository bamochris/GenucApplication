/**
 * Hook useAuth — Accéder au contexte Auth
 * ✅ ÉTAPE 4 : Hook réutilisable
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook pour utiliser le contexte Auth
 * Leve une erreur si utilisé en dehors du AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export default useAuth;
